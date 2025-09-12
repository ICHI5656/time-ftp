import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  NetworkCheck as TestIcon,
  Folder as FolderIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useStore, Profile } from '../store/useStore';

export const ProfileManager: React.FC = () => {
  const {
    profiles,
    currentProfile,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    selectProfile,
    testConnection,
    error,
    clearError
  } = useStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<Partial<Profile>>({
    name: '',
    host: '',
    port: 21,
    username: '',
    password: '',
    protocol: 'ftp',
    default_directory: '/'
  });
  const [testResults, setTestResults] = useState<{ [key: string]: boolean | null }>({});

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleOpenDialog = (profile?: Profile) => {
    if (profile) {
      setEditingProfile(profile);
      setFormData(profile);
    } else {
      setEditingProfile(null);
      setFormData({
        name: '',
        host: '',
        port: 21,
        username: '',
        password: '',
        protocol: 'ftp',
        default_directory: '/'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProfile(null);
    clearError();
  };

  const handleSave = async () => {
    try {
      if (editingProfile) {
        await updateProfile(editingProfile.id, formData);
      } else {
        await createProfile(formData as Omit<Profile, 'id'>);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('このプロファイルを削除しますか？')) {
      await deleteProfile(id);
    }
  };

  const handleTest = async (profileId: string) => {
    setTestResults({ ...testResults, [profileId]: null });
    const result = await testConnection(profileId);
    setTestResults({ ...testResults, [profileId]: result });
    
    setTimeout(() => {
      setTestResults(prev => {
        const newResults = { ...prev };
        delete newResults[profileId];
        return newResults;
      });
    }, 3000);
  };

  const handleSelectProfile = (profile: Profile) => {
    selectProfile(profile);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">サーバープロファイル管理</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新規プロファイル
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {profiles.map((profile) => (
          <Grid item xs={12} md={6} lg={4} key={profile.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: currentProfile?.id === profile.id ? '2px solid' : '1px solid',
                borderColor: currentProfile?.id === profile.id ? 'primary.main' : 'divider',
                '&:hover': {
                  boxShadow: 3
                }
              }}
              onClick={() => handleSelectProfile(profile)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    {profile.name}
                  </Typography>
                  <Chip
                    label={profile.protocol.toUpperCase()}
                    size="small"
                    color={profile.protocol === 'sftp' ? 'primary' : 'default'}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {profile.host}:{profile.port}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  ユーザー: {profile.username}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <FolderIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  {profile.default_directory}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDialog(profile);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(profile.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                  
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTest(profile.id);
                    }}
                  >
                    {testResults[profile.id] === null ? (
                      <TestIcon fontSize="small" />
                    ) : testResults[profile.id] ? (
                      <CheckIcon fontSize="small" color="success" />
                    ) : (
                      <CloseIcon fontSize="small" color="error" />
                    )}
                  </IconButton>
                </Stack>

                {currentProfile?.id === profile.id && (
                  <Chip
                    label="選択中"
                    size="small"
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* プロファイル編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProfile ? 'プロファイル編集' : '新規プロファイル作成'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="プロファイル名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>プロトコル</InputLabel>
              <Select
                value={formData.protocol}
                label="プロトコル"
                onChange={(e) => setFormData({ ...formData, protocol: e.target.value as 'ftp' | 'sftp' })}
              >
                <MenuItem value="ftp">FTP</MenuItem>
                <MenuItem value="sftp">SFTP</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="ホスト"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="ポート"
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="ユーザー名"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="パスワード"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="デフォルトディレクトリ"
              value={formData.default_directory}
              onChange={(e) => setFormData({ ...formData, default_directory: e.target.value })}
              margin="normal"
              helperText="アップロード先のデフォルトディレクトリ"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained">
            {editingProfile ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};