import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Breadcrumbs,
  Link,
  Paper
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  NavigateNext as NavigateNextIcon,
  ArrowUpward as ParentIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../store/useStore';

interface DirectoryItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedTime?: string;
}

export const FileUploader: React.FC = () => {
  const {
    currentProfile,
    uploadFile,
    browseDirectory,
    updateProfile,
    error,
    loading
  } = useStore();

  const [files, setFiles] = useState<File[]>([]);
  const [uploadDirectory, setUploadDirectory] = useState('/');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [directoryItems, setDirectoryItems] = useState<DirectoryItem[]>([]);
  const [browserLoading, setBrowserLoading] = useState(false);

  // ファイルドロップ処理
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/html': ['.html'],
      'text/xml': ['.xml'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip']
    }
  });

  // ディレクトリ参照を開く
  const handleOpenBrowser = async () => {
    if (!currentProfile) {
      alert('プロファイルを選択してください');
      return;
    }

    setBrowserOpen(true);
    setCurrentPath(currentProfile.default_directory || '/');
    await loadDirectory(currentProfile.default_directory || '/');
  };

  // ディレクトリを読み込む
  const loadDirectory = async (path: string) => {
    if (!currentProfile) return;

    setBrowserLoading(true);
    try {
      const response = await browseDirectory(currentProfile.id, path);
      if (response.success) {
        setDirectoryItems(response.files || []);
        setCurrentPath(path);
      }
    } catch (error) {
      console.error('ディレクトリ読み込みエラー:', error);
    } finally {
      setBrowserLoading(false);
    }
  };

  // ディレクトリ選択
  const handleSelectDirectory = () => {
    setUploadDirectory(currentPath);
    
    // プロファイルのデフォルトディレクトリも更新
    if (currentProfile) {
      updateProfile(currentProfile.id, { default_directory: currentPath });
    }
    
    setBrowserOpen(false);
  };

  // ディレクトリナビゲーション
  const navigateToDirectory = (dirName: string) => {
    const newPath = currentPath === '/' 
      ? `/${dirName}` 
      : `${currentPath}/${dirName}`;
    loadDirectory(newPath);
  };

  const navigateToParent = () => {
    const parts = currentPath.split('/').filter(p => p);
    parts.pop();
    const newPath = parts.length > 0 ? '/' + parts.join('/') : '/';
    loadDirectory(newPath);
  };

  // パンくずリストのパスをクリック
  const navigateToPath = (path: string) => {
    loadDirectory(path);
  };

  // ファイルアップロード
  const handleUpload = async () => {
    if (!currentProfile) {
      alert('プロファイルを選択してください');
      return;
    }

    if (files.length === 0) {
      alert('ファイルを選択してください');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(((i + 1) / files.length) * 100);
        await uploadFile(file, currentProfile.id, uploadDirectory);
      }
      
      setFiles([]);
      alert('アップロード完了');
    } catch (error) {
      console.error('アップロードエラー:', error);
      alert('アップロードに失敗しました');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ファイル削除
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // パンくずリストを生成
  const generateBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(p => p);
    const paths: { label: string; path: string }[] = [
      { label: 'Root', path: '/' }
    ];
    
    let accPath = '';
    parts.forEach(part => {
      accPath += '/' + part;
      paths.push({ label: part, path: accPath });
    });
    
    return paths;
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>ファイルアップロード</Typography>

      {!currentProfile && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          プロファイルを選択してください
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* アップロード先ディレクトリ */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            アップロード先ディレクトリ
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              value={uploadDirectory}
              onChange={(e) => setUploadDirectory(e.target.value)}
              disabled={!currentProfile}
              placeholder="/path/to/directory"
            />
            <Button
              variant="outlined"
              startIcon={<FolderIcon />}
              onClick={handleOpenBrowser}
              disabled={!currentProfile}
            >
              参照
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ファイルドロップエリア */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive
                ? 'ファイルをドロップしてください'
                : 'クリックまたはドラッグ&ドロップでファイルを選択'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              対応形式: CSV, HTML, XML, TXT, ZIP
            </Typography>
          </Box>

          {/* 選択されたファイル一覧 */}
          {files.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                選択されたファイル ({files.length}件)
              </Typography>
              <List dense>
                {files.map((file, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => removeFile(index)}>
                        <CloseIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <FileIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(2)} KB`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* アップロードボタン */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handleUpload}
              disabled={!currentProfile || files.length === 0 || uploading}
              fullWidth
            >
              アップロード
            </Button>
          </Box>

          {/* プログレスバー */}
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                アップロード中... {Math.round(uploadProgress)}%
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ディレクトリブラウザダイアログ */}
      <Dialog
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          ディレクトリを選択
        </DialogTitle>
        <DialogContent>
          {/* パンくずリスト */}
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ mb: 2 }}
          >
            {generateBreadcrumbs().map((item, index, array) => (
              <Link
                key={item.path}
                component="button"
                variant="body1"
                onClick={() => navigateToPath(item.path)}
                underline="hover"
                color={index === array.length - 1 ? 'text.primary' : 'inherit'}
              >
                {item.label}
              </Link>
            ))}
          </Breadcrumbs>

          {/* ディレクトリリスト */}
          <Paper variant="outlined" sx={{ height: 400, overflow: 'auto' }}>
            {browserLoading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>読み込み中...</Typography>
              </Box>
            ) : (
              <List>
                {currentPath !== '/' && (
                  <ListItem button onClick={navigateToParent}>
                    <ListItemIcon>
                      <ParentIcon />
                    </ListItemIcon>
                    <ListItemText primary=".." />
                  </ListItem>
                )}
                
                {directoryItems
                  .filter(item => item.type === 'directory')
                  .map(item => (
                    <ListItem
                      button
                      key={item.name}
                      onClick={() => navigateToDirectory(item.name)}
                    >
                      <ListItemIcon>
                        <FolderIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={item.name} />
                    </ListItem>
                  ))}
                
                {directoryItems
                  .filter(item => item.type === 'file')
                  .map(item => (
                    <ListItem key={item.name} disabled>
                      <ListItemIcon>
                        <FileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.name}
                        secondary={item.size ? `${(item.size / 1024).toFixed(2)} KB` : ''}
                      />
                    </ListItem>
                  ))}
              </List>
            )}
          </Paper>

          {/* 選択ボタン */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => setBrowserOpen(false)}>
              キャンセル
            </Button>
            <Button variant="contained" onClick={handleSelectDirectory}>
              このディレクトリを選択
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};