import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  HourglassEmpty as WaitingIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useStore, Schedule } from '../store/useStore';
import { ja } from 'date-fns/locale';

export const ScheduleManager: React.FC = () => {
  const {
    profiles,
    schedules,
    fetchSchedules,
    createSchedule,
    executeSchedule,
    deleteSchedule,
    error,
    loading
  } = useStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Schedule>>({
    name: '',
    profile_id: '',
    upload_directory: '/',
    schedule_time: undefined,
    status: 'waiting'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleOpenDialog = () => {
    setFormData({
      name: '',
      profile_id: profiles[0]?.id || '',
      upload_directory: '/',
      schedule_time: undefined,
      status: 'waiting'
    });
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedFile(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setFormData({
        ...formData,
        name: formData.name || event.target.files[0].name
      });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.profile_id) {
      alert('必須項目を入力してください');
      return;
    }

    try {
      await createSchedule({
        ...formData,
        file_path: selectedFile ? selectedFile.name : undefined
      } as Omit<Schedule, 'id'>);
      
      handleCloseDialog();
      fetchSchedules();
    } catch (error) {
      console.error('スケジュール作成エラー:', error);
    }
  };

  const handleExecute = async (id: string) => {
    if (window.confirm('このスケジュールを今すぐ実行しますか？')) {
      await executeSchedule(id);
      fetchSchedules();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('このスケジュールを削除しますか？')) {
      await deleteSchedule(id);
      fetchSchedules();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CompletedIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'executing':
        return <HourglassEmpty />;
      default:
        return <WaitingIcon />;
    }
  };

  const getStatusChip = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      waiting: '待機中',
      executing: '実行中',
      completed: '完了',
      failed: '失敗'
    };

    const statusColors: { [key: string]: 'default' | 'primary' | 'success' | 'error' } = {
      waiting: 'default',
      executing: 'primary',
      completed: 'success',
      failed: 'error'
    };

    return (
      <Chip
        label={statusLabels[status] || status}
        color={statusColors[status] || 'default'}
        size="small"
      />
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">スケジュール管理</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          新規スケジュール
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {schedules.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              スケジュールがありません
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <List>
              {schedules.map((schedule) => (
                <ListItem
                  key={schedule.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    {getStatusIcon(schedule.status)}
                  </Box>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {schedule.name}
                        </Typography>
                        {getStatusChip(schedule.status)}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          プロファイル: {schedule.profile_name || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          アップロード先: {schedule.upload_directory}
                        </Typography>
                        {schedule.schedule_time && (
                          <Typography variant="body2" color="text.secondary">
                            予定: {new Date(schedule.schedule_time).toLocaleString('ja-JP')}
                          </Typography>
                        )}
                        {schedule.executed_at && (
                          <Typography variant="body2" color="text.secondary">
                            実行: {new Date(schedule.executed_at).toLocaleString('ja-JP')}
                          </Typography>
                        )}
                        {schedule.error_message && (
                          <Typography variant="body2" color="error">
                            エラー: {schedule.error_message}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleExecute(schedule.id)}
                      disabled={schedule.status === 'executing'}
                    >
                      <PlayIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(schedule.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* スケジュール作成ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon />
            新規スケジュール作成
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="スケジュール名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel>プロファイル</InputLabel>
              <Select
                value={formData.profile_id}
                label="プロファイル"
                onChange={(e) => setFormData({ ...formData, profile_id: e.target.value })}
              >
                {profiles.map((profile) => (
                  <MenuItem key={profile.id} value={profile.id}>
                    {profile.name} ({profile.protocol.toUpperCase()})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="アップロードディレクトリ"
              value={formData.upload_directory}
              onChange={(e) => setFormData({ ...formData, upload_directory: e.target.value })}
              margin="normal"
              required
            />

            <Box sx={{ mt: 2, mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
              >
                ファイルを選択
                <input
                  type="file"
                  hidden
                  accept=".csv,.html,.xml,.txt,.zip"
                  onChange={handleFileChange}
                />
              </Button>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  選択: {selectedFile.name}
                </Typography>
              )}
            </Box>

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
              <DateTimePicker
                label="実行予定日時"
                value={formData.schedule_time ? new Date(formData.schedule_time) : null}
                onChange={(newValue) => {
                  setFormData({
                    ...formData,
                    schedule_time: newValue?.toISOString()
                  });
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal',
                    helperText: '空欄の場合は即座に実行'
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained">
            作成
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};