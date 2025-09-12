import { App } from "octokit";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.replace(/^--/, "");
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true; // flag
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

function ymd() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}${mm}${dd}`;
}

async function getOctokit() {
  const app = new App({
    appId: requiredEnv("GITHUB_APP_ID"),
    privateKey: requiredEnv("GITHUB_APP_PRIVATE_KEY"),
  });
  const installationId = Number(requiredEnv("GITHUB_APP_INSTALLATION_ID"));
  return app.getInstallationOctokit(installationId);
}

async function listInstallationRepos(octokit) {
  const repos = [];
  let page = 1;
  while (true) {
    const { data } = await octokit.request(
      "GET /installation/repositories",
      { per_page: 100, page }
    );
    for (const r of data.repositories || []) repos.push(r);
    if (!data.total_count || data.repositories?.length < 100) break;
    page++;
  }
  return repos;
}

async function ensureBranch(octokit, { owner, repo, branch, base }) {
  // Get base ref sha
  const { data: rep } = await octokit.request("GET /repos/{owner}/{repo}", { owner, repo });
  const baseRef = base || rep.default_branch || "main";
  const { data: refData } = await octokit.request(
    "GET /repos/{owner}/{repo}/git/ref/{ref}",
    { owner, repo, ref: `heads/${baseRef}` }
  );
  const baseSha = refData.object.sha;

  // Try to create branch; if exists, continue
  try {
    await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: baseSha,
    });
  } catch (e) {
    // already exists
  }
  return { baseRef, sha: baseSha };
}

async function createOrUpdateFile(octokit, { owner, repo, path, content, message, branch }) {
  // Check if file exists to include sha
  let sha;
  try {
    const { data: getRes } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      { owner, repo, path, ref: branch }
    );
    sha = getRes.sha;
  } catch (_) {}

  const b64 = Buffer.from(content, "utf8").toString("base64");
  const res = await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
    owner, repo, path,
    message,
    content: b64,
    branch,
    sha,
  });
  return res.data;
}

async function ensureLabel(octokit, { owner, repo, label }) {
  if (!label) return;
  try {
    await octokit.request("GET /repos/{owner}/{repo}/labels/{name}", { owner, repo, name: label });
  } catch (_) {
    try {
      await octokit.request("POST /repos/{owner}/{repo}/labels", {
        owner, repo, name: label, color: "0E8A16",
      });
    } catch (_) {}
  }
}

async function openPr(octokit, { owner, repo, title, head, base, body, label }) {
  const { data: pr } = await octokit.request("POST /repos/{owner}/{repo}/pulls", {
    owner, repo, title, head, base, body,
  });
  if (label) {
    try {
      await ensureLabel(octokit, { owner, repo, label });
      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/labels", {
        owner, repo, issue_number: pr.number, labels: [label],
      });
    } catch (_) {}
  }
  return pr.html_url;
}

async function applyFixForRepo(octokit, { owner, repo, branch, path, content, message, dryRun }) {
  if (dryRun) return { changed: true, note: `would write ${path}` };
  await createOrUpdateFile(octokit, { owner, repo, path, content, message, branch });
  return { changed: true };
}

(async () => {
  try {
    const args = parseArgs(process.argv);
    const org = args.org;
    if (!org) throw new Error("--org は必須です");
    const includeRe = new RegExp(args.include || ".*");
    const excludeRe = args.exclude ? new RegExp(args.exclude) : null;
    const path = args.path || ".github/.keep";
    const content = args.content || "Managed by Codex";
    const title = args.title || "chore: codex auto fix";
    const message = args.message || "chore: apply automated fix";
    const label = args.label || "codex-auto";
    const dryRun = !args.execute;
    const branch = args.branch || `codex/auto-fix-${ymd()}`;

    const octokit = await getOctokit();
    console.log(`[info] listing installation repositories...`);
    const repos = (await listInstallationRepos(octokit))
      .filter(r => r.owner?.login?.toLowerCase() === org.toLowerCase())
      .filter(r => includeRe.test(r.name))
      .filter(r => (excludeRe ? !excludeRe.test(r.name) : true))
      .filter(r => !r.archived && !r.disabled);

    console.log(`[plan] target repos: ${repos.length}`);
    for (const r of repos) {
      const owner = r.owner.login;
      const repo = r.name;
      try {
        console.log(`\n[repo] ${owner}/${repo}`);
        const { baseRef } = await ensureBranch(octokit, { owner, repo, branch, base: r.default_branch });
        const res = await applyFixForRepo(octokit, { owner, repo, branch, path, content, message, dryRun });
        if (!res.changed) {
          console.log("  - no change, skipping PR");
          continue;
        }
        if (dryRun) {
          console.log(`  - DRY RUN: would open PR -> ${branch} -> ${baseRef}`);
          continue;
        }
        const prUrl = await openPr(octokit, {
          owner, repo,
          title,
          head: branch,
          base: r.default_branch || baseRef || "main",
          body: `Automated change by Codex.\n\n- Path: ${path}\n- Label: ${label}`,
          label,
        });
        console.log(`  - PR opened: ${prUrl}`);
      } catch (e) {
        console.error(`  ! error:`, e?.message || e);
      }
    }
    console.log("\n[done]");
  } catch (e) {
    console.error(`[fatal] ${e?.message || e}`);
    process.exit(1);
  }
})();

