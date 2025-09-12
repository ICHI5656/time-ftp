import React, { useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import { ProfileManager } from './components/ProfileManager';
import { FileUploader } from './components/FileUploader';
import { ScheduleManager } from './components/ScheduleManager';
import { UploadHistory } from './components/UploadHistory';
import { useStore } from './store/useStore';

// MUIテーマ設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`main-tabpanel-${index}`}
      aria-labelledby={`main-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = React.useState(0);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error' | 'info' | 'warning'>('info');

  const { currentProfile, error, clearError } = useStore();

  useEffect(() => {
    // エラーメッセージの表示
    if (error) {
      setSnackbarMessage(error);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      clearError();
    }
  }, [error, clearError]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* ヘッダー */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            📦 FTP/SFTP Manager - React版
          </Typography>
          {currentProfile && (
            <Typography variant="body1">
              現在のプロファイル: {currentProfile.name} ({currentProfile.protocol.toUpperCase()})
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      {/* メインコンテンツ */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* 現在のプロファイル情報 */}
        {currentProfile && (
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="subtitle1">
                <strong>接続先:</strong> {currentProfile.host}:{currentProfile.port}
              </Typography>
              <Typography variant="subtitle1">
                <strong>ユーザー:</strong> {currentProfile.username}
              </Typography>
              <Typography variant="subtitle1">
                <strong>デフォルトディレクトリ:</strong> {currentProfile.default_directory}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* タブナビゲーション */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="メインナビゲーション"
            variant="fullWidth"
          >
            <Tab label="プロファイル管理" />
            <Tab label="ファイルアップロード" />
            <Tab label="スケジュール管理" />
            <Tab label="アップロード履歴" />
          </Tabs>
        </Paper>

        {/* タブコンテンツ */}
        <TabPanel value={tabValue} index={0}>
          <ProfileManager />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <FileUploader />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <ScheduleManager />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <UploadHistory />
        </TabPanel>
      </Container>

      {/* スナックバー（通知） */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;