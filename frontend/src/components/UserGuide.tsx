import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Divider,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import ScheduleIcon from '@mui/icons-material/Schedule';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import HistoryIcon from '@mui/icons-material/History';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

const UserGuide: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="primary" fontSize="large" />
          CSV FTP Uploader 使い方ガイド
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          このシステムは、CSVファイルを定期的にFTPサーバーへ自動アップロードするためのツールです。
          複数のFTPサーバーへのスケジュール配信、履歴管理、エラー処理などの機能を提供します。
        </Alert>

        {/* クイックスタート */}
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TipsAndUpdatesIcon color="secondary" />
              クイックスタート
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                  <Typography variant="h4" color="primary">1</Typography>
                  <Typography variant="body2">FTP接続を設定</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                  <Typography variant="h4" color="primary">2</Typography>
                  <Typography variant="body2">CSVファイルをアップロード</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                  <Typography variant="h4" color="primary">3</Typography>
                  <Typography variant="body2">スケジュールを作成</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                  <Typography variant="h4" color="primary">4</Typography>
                  <Typography variant="body2">自動配信開始！</Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 詳細セクション */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
              <SettingsIcon />
              1. FTP接続の設定
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph sx={{ fontSize: '1rem' }}>
              まず、CSVファイルを送信するFTPサーバーの接続情報を設定します。
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="接続名"
                  secondary="管理しやすい名前を付けてください（例：本番サーバー、テストサーバー）"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="ホスト"
                  secondary="FTPサーバーのアドレス（例：ftp.example.com）"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="ポート"
                  secondary="通常は21番ポート、SFTPの場合は22番ポート"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="ユーザー名・パスワード"
                  secondary="FTPサーバーのログイン情報"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="デフォルトディレクトリ（転送先フォルダ）"
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        FTPサーバー上でCSVファイルを保存する場所を指定します
                      </Typography>
                      <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="caption" display="block">
                          <strong>例：</strong>
                        </Typography>
                        <Typography variant="caption" display="block">
                          • <code>/</code> → FTPサーバーのルート（最上位）フォルダ
                        </Typography>
                        <Typography variant="caption" display="block">
                          • <code>/csv/</code> → ルートにある「csv」フォルダ内
                        </Typography>
                        <Typography variant="caption" display="block">
                          • <code>/data/csv/</code> → 「data」フォルダ内の「csv」フォルダ
                        </Typography>
                        <Typography variant="caption" display="block">
                          • <code>/public_html/uploads/</code> → Webサイト公開フォルダ内
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                        💡 FTPサーバーにログインして、実際のフォルダ構造を確認してから設定してください
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            </List>
            
            {/* デフォルトディレクトリの詳細説明 */}
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f8ff', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                📁 デフォルトディレクトリとは？
              </Typography>
              <Typography variant="body2" paragraph>
                CSVファイルをFTPサーバーのどこに置くかを指定する設定です。
                パソコンのフォルダと同じように、FTPサーバーにもフォルダ構造があります。
              </Typography>
              
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, fontFamily: 'monospace' }}>
                <Typography variant="body2" gutterBottom>
                  <strong>🖥️ FTPサーバーのフォルダ構造の例：</strong>
                </Typography>
                <Typography variant="body2" component="pre" sx={{ fontSize: '0.85rem' }}>
{`FTPサーバー（your-server.com）
│
├── / （ルートフォルダ = 最上位）
│   ├── 📁 data/
│   │   ├── 📁 csv/        ← ここを指定: /data/csv/
│   │   ├── 📁 backup/
│   │   └── 📁 temp/
│   │
│   ├── 📁 public_html/    （Webサイト公開用）
│   │   ├── 📁 uploads/    ← ここを指定: /public_html/uploads/
│   │   └── 📁 images/
│   │
│   └── 📁 csv/            ← ここを指定: /csv/`}
                </Typography>
              </Box>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color="success.main">
                      ✅ 正しい指定方法
                    </Typography>
                    <Typography variant="body2" component="div">
                      • 先頭に必ず <code>/</code> を付ける<br />
                      • 末尾の <code>/</code> は任意<br />
                      • 存在するフォルダを指定<br />
                      <Box sx={{ mt: 1, p: 1, bgcolor: '#e8f5e9' }}>
                        <code>/data/csv/</code><br />
                        <code>/public_html/</code><br />
                        <code>/</code> （ルートに直接）
                      </Box>
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color="error">
                      ❌ 間違った指定方法
                    </Typography>
                    <Typography variant="body2" component="div">
                      • 先頭の <code>/</code> を忘れる<br />
                      • 存在しないフォルダを指定<br />
                      • Windowsのパス形式を使う<br />
                      <Box sx={{ mt: 1, p: 1, bgcolor: '#ffebee' }}>
                        <code>data/csv/</code> （/が無い）<br />
                        <code>C:\data\csv\</code> （Windows形式）<br />
                        <code>/not_exist/</code> （存在しない）
                      </Box>
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>初めての場合：</strong> まず <code>/</code> （ルートフォルダ）を試してみて、
                FTPクライアントソフト（FileZillaなど）で実際のフォルダ構造を確認してから、
                適切なフォルダを指定することをお勧めします。
              </Alert>
            </Box>
            
            <Alert severity="warning" sx={{ mt: 2 }}>
              接続設定後は必ず「接続テスト」を実行して、正常に接続できることを確認してください。
            </Alert>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
              <UploadFileIcon />
              2. CSVファイルのアップロード
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph sx={{ fontSize: '1rem' }}>
              アップロードタブから、送信したいCSVファイルをシステムに登録します。
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary={<Typography variant="body1" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>複数ファイル選択</Typography>}
                  secondary={<Typography variant="body1" sx={{ fontSize: '0.95rem' }}>Ctrl（Cmd）キーを押しながら複数のCSVファイルを選択できます</Typography>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={<Typography variant="body1" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>ファイル形式</Typography>}
                  secondary={<Typography variant="body1" sx={{ fontSize: '0.95rem' }}>対応形式：.csv（文字コード：UTF-8、Shift-JIS対応）</Typography>}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={<Typography variant="body1" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>ファイルサイズ制限</Typography>}
                  secondary={<Typography variant="body1" sx={{ fontSize: '0.95rem', color: 'primary.main', fontWeight: 'bold' }}>1ファイルあたり最大500MBまで対応</Typography>}
                />
              </ListItem>
            </List>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>📌 アップロード順序の制御方法</strong>
              </Typography>
            </Alert>
            <Typography variant="body2" sx={{ mt: 2 }}>
              CSVファイルは<strong>ファイル名順（文字コード順）</strong>で自動的に処理されます。
              特定の順序でアップロードしたい場合は、以下のようにファイル名の先頭に<strong>3桁の連番</strong>を付けてください。
              <br />
              <strong>※ アンダースコア（_）は必須ではありません。</strong>番号とファイル名を区別しやすくするための区切り文字です。
            </Typography>
            <Box sx={{ bgcolor: '#f0f0f0', p: 2, mt: 2, borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>✅ 正しい命名例（すべてOK）</Typography>
              <Typography variant="body2" component="pre">
                {`【アンダースコア（_）を使う場合】
001_商品マスタ.csv      ← 最初に処理
002_在庫データ.csv      ← 2番目に処理
003_価格情報.csv        ← 3番目に処理

【アンダースコアを使わない場合】
001商品マスタ.csv       ← これもOK！
002在庫データ.csv       ← これもOK！
003価格情報.csv         ← これもOK！

【ハイフン（-）を使う場合】
001-product.csv
002-inventory.csv
003-price.csv

【スペースを使う場合】
001 商品マスタ.csv
002 在庫データ.csv
003 価格情報.csv`}
              </Typography>
            </Box>
            <Box sx={{ bgcolor: '#ffe0e0', p: 2, mt: 2, borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>❌ 避けるべき命名例</Typography>
              <Typography variant="body2" component="pre">
                {`1_商品.csv     ← 桁数が揃っていない
10_在庫.csv    ← 1の後に来てしまう
2_価格.csv     ← 10より後に処理される

正しくない順序：
1_商品.csv → 10_在庫.csv → 2_価格.csv`}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
              <strong>💡 推奨事項：</strong>
              <br />
              • <strong>アンダースコア（_）を入れることをお勧めします</strong> - 番号と名前が見分けやすくなります
              <br />
              • 3桁の連番（001〜999）を使用することで、最大999個のファイルを確実に順序制御できます
              <br />
              • ファイル数が10個以下の場合でも、001形式を使用することを推奨します
              <br />
              <br />
              <strong>📝 最も推奨される形式：</strong>
              <br />
              <Box component="span" sx={{ bgcolor: 'yellow', px: 1, fontFamily: 'monospace' }}>
                001_ファイル名.csv
              </Box>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
              <ScheduleIcon />
              3. スケジュールの設定
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph sx={{ fontSize: '1rem' }}>
              自動配信のタイミングを設定します。Cron式という時間指定の方法を使って、
              細かく配信時間を制御できます。
            </Typography>
            
            {/* 新機能：ファイル選択 */}
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                🆕 新機能：FTP設定とCSVファイルの柔軟な組み合わせ
              </Typography>
              <Typography variant="body2" component="div">
                スケジュール作成時に、以下の2つの方法でファイルを指定できます：
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="📁 パターンマッチング"
                      secondary="ワイルドカード（*.csv）で条件に合うファイルを自動選択"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="📌 個別ファイル選択"
                      secondary="特定のファイルを手動で選択して組み合わせ（NEW!）"
                    />
                  </ListItem>
                </List>
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>使用例：</strong>
                  </Typography>
                  <Typography variant="body2" component="ul">
                    <li>本番サーバー + 売上データCSV のみ</li>
                    <li>テストサーバー + 選択した3つのCSVファイル</li>
                    <li>バックアップサーバー + すべてのCSVファイル（*.csv）</li>
                  </Typography>
                </Box>
              </Typography>
            </Alert>
            
            {/* Cron式の詳細説明 */}
            <Box sx={{ mt: 3, p: 3, bgcolor: '#fff8e1', borderRadius: 2, border: '2px solid #ffc107' }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ⏰ 時間指定（Cron式）の仕組み
              </Typography>
              
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, mt: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  📝 Cron式は5つの数字で時間を指定します
                </Typography>
                <Box sx={{ fontSize: '1.2rem', fontFamily: 'monospace', p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12}>
                      <Typography variant="h6" component="div" sx={{ fontFamily: 'monospace', mb: 2 }}>
                        <Box component="span" sx={{ color: '#d32f2f' }}>分</Box>
                        {' '}
                        <Box component="span" sx={{ color: '#1976d2' }}>時</Box>
                        {' '}
                        <Box component="span" sx={{ color: '#388e3c' }}>日</Box>
                        {' '}
                        <Box component="span" sx={{ color: '#f57c00' }}>月</Box>
                        {' '}
                        <Box component="span" sx={{ color: '#7b1fa2' }}>曜日</Box>
                      </Typography>
                      <Typography variant="h5" component="div" sx={{ fontFamily: 'monospace' }}>
                        <Box component="span" sx={{ color: '#d32f2f' }}>0</Box>
                        {' '}
                        <Box component="span" sx={{ color: '#1976d2' }}>9</Box>
                        {' '}
                        <Box component="span" sx={{ color: '#388e3c' }}>*</Box>
                        {' '}
                        <Box component="span" sx={{ color: '#f57c00' }}>*</Box>
                        {' '}
                        <Box component="span" sx={{ color: '#7b1fa2' }}>*</Box>
                        {' = 毎日午前9時0分'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        🔢 各位置の意味
                      </Typography>
                      <Typography component="div" sx={{ fontSize: '1rem' }}>
                        <Box sx={{ color: '#d32f2f' }}>1番目: 分 (0-59)</Box>
                        <Box sx={{ color: '#1976d2' }}>2番目: 時 (0-23)</Box>
                        <Box sx={{ color: '#388e3c' }}>3番目: 日 (1-31)</Box>
                        <Box sx={{ color: '#f57c00' }}>4番目: 月 (1-12)</Box>
                        <Box sx={{ color: '#7b1fa2' }}>5番目: 曜日 (0-6, 日曜=0)</Box>
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: '#fce4ec' }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        ✨ 特殊文字の意味
                      </Typography>
                      <Typography component="div" sx={{ fontSize: '1rem' }}>
                        <Box><strong>*</strong> = すべての値（毎回）</Box>
                        <Box><strong>,</strong> = 複数指定（9,18 = 9時と18時）</Box>
                        <Box><strong>-</strong> = 範囲（1-5 = 月曜から金曜）</Box>
                        <Box><strong>/</strong> = 間隔（*/5 = 5分ごと）</Box>
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Box>

            {/* 実用的な例 */}
            <Box sx={{ mt: 4, p: 3, bgcolor: '#f0f8ff', borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                🎯 実際によく使うスケジュール設定
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* 毎日系 */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        📅 毎日の定期実行
                      </Typography>
                      <List>
                        <ListItem>
                          <Box sx={{ width: '100%' }}>
                            <Chip label="0 9 * * *" sx={{ fontSize: '1rem', mb: 1 }} color="primary" />
                            <Typography variant="body1">
                              <strong>毎日午前9時ちょうど</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              営業開始時刻に配信
                            </Typography>
                          </Box>
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <Box sx={{ width: '100%' }}>
                            <Chip label="0 9,12,18 * * *" sx={{ fontSize: '1rem', mb: 1 }} color="primary" />
                            <Typography variant="body1">
                              <strong>1日3回配信</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              朝9時、昼12時、夕方18時
                            </Typography>
                          </Box>
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <Box sx={{ width: '100%' }}>
                            <Chip label="30 23 * * *" sx={{ fontSize: '1rem', mb: 1 }} color="primary" />
                            <Typography variant="body1">
                              <strong>毎日深夜23時30分</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              日次バッチ処理向け
                            </Typography>
                          </Box>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 間隔系 */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="secondary">
                        ⏱️ 一定間隔での実行
                      </Typography>
                      <List>
                        <ListItem>
                          <Box sx={{ width: '100%' }}>
                            <Chip label="*/30 * * * *" sx={{ fontSize: '1rem', mb: 1 }} color="secondary" />
                            <Typography variant="body1">
                              <strong>30分ごと</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              0分、30分に実行
                            </Typography>
                          </Box>
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <Box sx={{ width: '100%' }}>
                            <Chip label="0 */2 * * *" sx={{ fontSize: '1rem', mb: 1 }} color="secondary" />
                            <Typography variant="body1">
                              <strong>2時間ごと</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              0時、2時、4時...22時
                            </Typography>
                          </Box>
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <Box sx={{ width: '100%' }}>
                            <Chip label="*/5 * * * *" sx={{ fontSize: '1rem', mb: 1 }} color="secondary" />
                            <Typography variant="body1">
                              <strong>5分ごと</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              リアルタイム性が必要な場合
                            </Typography>
                          </Box>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 曜日系 */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="success.main">
                        📆 曜日指定の実行
                      </Typography>
                      <List>
                        <ListItem>
                          <Box sx={{ width: '100%' }}>
                            <Chip label="0 9 * * 1-5" sx={{ fontSize: '1rem', mb: 1 }} color="success" />
                            <Typography variant="body1">
                              <strong>平日（月〜金）午前9時</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              営業日のみ配信
                            </Typography>
                          </Box>
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <Box sx={{ width: '100%' }}>
                            <Chip label="0 10 * * 1" sx={{ fontSize: '1rem', mb: 1 }} color="success" />
                            <Typography variant="body1">
                              <strong>毎週月曜日10時</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              週次レポート配信
                            </Typography>
                          </Box>
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <Box sx={{ width: '100%' }}>
                            <Chip label="0 8 * * 6,0" sx={{ fontSize: '1rem', mb: 1 }} color="success" />
                            <Typography variant="body1">
                              <strong>土日の朝8時</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              週末特別配信
                            </Typography>
                          </Box>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 月次系 */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="warning.main">
                        📊 月次・特定日の実行
                      </Typography>
                      <List>
                        <ListItem>
                          <Box sx={{ width: '100%' }}>
                            <Chip label="0 0 1 * *" sx={{ fontSize: '1rem', mb: 1 }} color="warning" />
                            <Typography variant="body1">
                              <strong>毎月1日の0時</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              月初処理
                            </Typography>
                          </Box>
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <Box sx={{ width: '100%' }}>
                            <Chip label="0 9 15,30 * *" sx={{ fontSize: '1rem', mb: 1 }} color="warning" />
                            <Typography variant="body1">
                              <strong>毎月15日と30日の9時</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              給与日など特定日
                            </Typography>
                          </Box>
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <Box sx={{ width: '100%' }}>
                            <Chip label="0 0 L * *" sx={{ fontSize: '1rem', mb: 1 }} color="warning" />
                            <Typography variant="body1">
                              <strong>毎月末日の0時</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              月末締め処理（※一部システムのみ）
                            </Typography>
                          </Box>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* 特定の日時を指定する方法 */}
            <Box sx={{ mt: 4, p: 3, bgcolor: '#e8f5e9', borderRadius: 2, border: '2px solid #4caf50' }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🎯 特定の日時を指定したい場合
              </Typography>
              
              <Alert severity="success" sx={{ mb: 2, fontSize: '1rem' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  例題：「9月9日の午前2時00分に実行したい」
                </Typography>
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: '#fff' }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        毎年9月9日の場合
                      </Typography>
                      <Chip 
                        label="0 2 9 9 *" 
                        sx={{ fontSize: '1.2rem', p: 2, mb: 2, width: '100%' }} 
                        color="primary" 
                      />
                      <Typography component="div" sx={{ fontSize: '1rem' }}>
                        <Box sx={{ mb: 1 }}>
                          <strong>解説：</strong>
                        </Box>
                        <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, fontFamily: 'monospace' }}>
                          <Box sx={{ color: '#d32f2f' }}>0 → 0分</Box>
                          <Box sx={{ color: '#1976d2' }}>2 → 午前2時</Box>
                          <Box sx={{ color: '#388e3c' }}>9 → 9日</Box>
                          <Box sx={{ color: '#f57c00' }}>9 → 9月</Box>
                          <Box sx={{ color: '#7b1fa2' }}>* → 曜日は問わない</Box>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                          毎年9月9日の午前2時0分に実行されます
                        </Typography>
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: '#fff' }}>
                    <CardContent>
                      <Typography variant="h6" color="secondary" gutterBottom>
                        今年の9月9日のみの場合
                      </Typography>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          特定の年の1回だけ実行したい場合は、<br />
                          9月9日にスケジュールを作成して、<br />
                          実行後に削除することをお勧めします
                        </Typography>
                      </Alert>
                      <Typography variant="body1" sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <strong>手順：</strong><br />
                        1. スケジュール作成<br />
                        2. 9月9日2時に自動実行<br />
                        3. 実行確認後、手動で削除
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* その他の特定日時の例 */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                📌 その他の特定日時指定の例
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      12月31日 23時59分
                    </Typography>
                    <Chip label="59 23 31 12 *" sx={{ fontSize: '1rem', width: '100%' }} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      年末最後の処理
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      1月1日 0時0分
                    </Typography>
                    <Chip label="0 0 1 1 *" sx={{ fontSize: '1rem', width: '100%' }} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      新年最初の処理
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      4月1日 9時0分
                    </Typography>
                    <Chip label="0 9 1 4 *" sx={{ fontSize: '1rem', width: '100%' }} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      年度初めの処理
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body1">
                  <strong>重要：</strong>特定の日付を指定する場合、毎年同じ日に実行されることに注意してください。
                  1回だけ実行したい場合は、実行後にスケジュールを削除してください。
                </Typography>
              </Alert>
            </Box>

            {/* 曜日の参照表 */}
            <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                📅 曜日の番号対応表
              </Typography>
              <Grid container spacing={1}>
                {[
                  { day: '日曜日', num: '0 または 7' },
                  { day: '月曜日', num: '1' },
                  { day: '火曜日', num: '2' },
                  { day: '水曜日', num: '3' },
                  { day: '木曜日', num: '4' },
                  { day: '金曜日', num: '5' },
                  { day: '土曜日', num: '6' }
                ].map((item) => (
                  <Grid item xs={6} sm={3} md={3} key={item.day}>
                    <Paper sx={{ p: 1, textAlign: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {item.day}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {item.num}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Alert severity="warning" sx={{ mt: 3, fontSize: '1rem' }}>
              <strong>⚠️ 注意事項：</strong>
              <br />
              • スケジュールは作成後すぐに有効になります
              <br />
              • サーバーの時刻設定（タイムゾーン）を確認してください
              <br />
              • 一時停止や削除はスケジュール管理画面から行えます
            </Alert>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
              <HistoryIcon />
              4. 履歴とモニタリング
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph sx={{ fontSize: '1rem' }}>
              アップロード履歴タブで、すべての配信履歴を確認できます。
            </Typography>
            <Typography variant="h6" gutterBottom>確認できる情報</Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="配信ステータス"
                  secondary="成功、失敗、処理中、保留中"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="配信日時"
                  secondary="実際にFTPサーバーへ送信された時刻"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="ファイル情報"
                  secondary="ファイル名、サイズ、送信先ディレクトリ"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="エラー詳細"
                  secondary="失敗時のエラーメッセージと対処法"
                />
              </ListItem>
            </List>
            <Alert severity="error" sx={{ mt: 2 }}>
              配信に失敗した場合は、エラー内容を確認して以下を試してください：
              <List dense sx={{ mt: 1 }}>
                <ListItem>• FTP接続設定を確認</ListItem>
                <ListItem>• ネットワーク接続を確認</ListItem>
                <ListItem>• FTPサーバーの空き容量を確認</ListItem>
                <ListItem>• ファイルの権限設定を確認</ListItem>
              </List>
            </Alert>
          </AccordionDetails>
        </Accordion>

        {/* トラブルシューティング */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon />
              トラブルシューティング
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="h6" gutterBottom>よくある問題と解決方法</Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Q: FTP接続テストが失敗する"
                  secondary="A: ホスト名、ポート番号、ユーザー名、パスワードが正しいか確認してください。ファイアウォールやプロキシ設定も確認が必要です。"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Q: スケジュールが実行されない"
                  secondary="A: Cron式が正しいか確認してください。また、スケジュールが有効になっているか確認してください。"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Q: ファイルアップロードが途中で止まる"
                  secondary="A: ファイルサイズが大きすぎる可能性があります。50MB以下に分割してください。"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Q: 文字化けが発生する"
                  secondary="A: CSVファイルの文字コードを確認してください。UTF-8またはShift-JISを推奨します。"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        {/* システム要件 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon />
              システム要件と注意事項
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="h6" gutterBottom>推奨環境</Typography>
            <List dense>
              <ListItem>• ブラウザ: Chrome, Firefox, Edge, Safari の最新版</ListItem>
              <ListItem>• ネットワーク: 安定したインターネット接続</ListItem>
              <ListItem>• FTPサーバー: FTP/FTPS/SFTP対応</ListItem>
            </List>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>セキュリティについて</Typography>
            <List dense>
              <ListItem>• FTPパスワードは暗号化して保存されます</ListItem>
              <ListItem>• 通信はSSL/TLSで保護されます（FTPS/SFTP使用時）</ListItem>
              <ListItem>• 定期的にパスワードを変更することを推奨します</ListItem>
            </List>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>制限事項</Typography>
            <List dense>
              <ListItem sx={{ fontSize: '1rem' }}>
                • <strong>1ファイルあたり最大500MB</strong>（大容量CSV対応）
              </ListItem>
              <ListItem sx={{ fontSize: '1rem' }}>• 同時アップロード数: 最大10ファイル</ListItem>
              <ListItem sx={{ fontSize: '1rem' }}>• スケジュール登録数: 最大100件</ListItem>
              <ListItem sx={{ fontSize: '1rem' }}>• 履歴保存期間: 90日間</ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            CSV FTP Uploader v1.0.0 | サポート: support@example.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserGuide;