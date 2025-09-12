import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Alert
} from '@mui/material';
import {
  Download as DownloadIcon,
  Clear as ClearIcon,
  CheckCircle as SuccessIcon,
  Cancel as FailedIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useStore, History } from '../store/useStore';

export const UploadHistory: React.FC = () => {
  const {
    history,
    fetchHistory,
    clearHistory,
    error
  } = useStore();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchHistory(100);
  }, []);

  const handleRefresh = () => {
    fetchHistory(100);
  };

  const handleClear = async () => {
    if (window.confirm('すべての履歴を削除しますか？')) {
      await clearHistory();
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportToCSV = () => {
    if (history.length === 0) {
      alert('エクスポートする履歴がありません');
      return;
    }

    const headers = ['日時', 'ファイル名', 'サイズ(KB)', 'プロファイル', 'ディレクトリ', 'ステータス', 'エラー'];
    const rows = history.map(item => [
      new Date(item.uploaded_at).toLocaleString('ja-JP'),
      item.file_name,
      (item.file_size / 1024).toFixed(2),
      item.profile_name || '',
      item.upload_directory,
      item.status,
      item.error_message || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `upload_history_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    if (history.length === 0) {
      alert('エクスポートする履歴がありません');
      return;
    }

    const json = JSON.stringify(history, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `upload_history_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusChip = (status: string) => {
    return status === 'success' ? (
      <Chip
        icon={<SuccessIcon />}
        label="成功"
        color="success"
        size="small"
      />
    ) : (
      <Chip
        icon={<FailedIcon />}
        label="失敗"
        color="error"
        size="small"
      />
    );
  };

  // 統計情報の計算
  const stats = {
    total: history.length,
    success: history.filter(h => h.status === 'success').length,
    failed: history.filter(h => h.status === 'failed').length,
    totalSize: history.reduce((sum, h) => sum + h.file_size, 0)
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">アップロード履歴</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            更新
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToCSV}
          >
            CSV出力
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToJSON}
          >
            JSON出力
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
            onClick={handleClear}
          >
            クリア
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 統計情報 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">
                総アップロード数
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">{stats.success}</Typography>
              <Typography variant="body2" color="text.secondary">
                成功
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">{stats.failed}</Typography>
              <Typography variant="body2" color="text.secondary">
                失敗
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4">{formatFileSize(stats.totalSize)}</Typography>
              <Typography variant="body2" color="text.secondary">
                合計サイズ
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 履歴テーブル */}
      <Card>
        <CardContent>
          {history.length === 0 ? (
            <Typography color="text.secondary" align="center">
              履歴がありません
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>日時</TableCell>
                      <TableCell>ファイル名</TableCell>
                      <TableCell>サイズ</TableCell>
                      <TableCell>プロファイル</TableCell>
                      <TableCell>ディレクトリ</TableCell>
                      <TableCell>ステータス</TableCell>
                      <TableCell>所要時間</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {new Date(item.uploaded_at).toLocaleString('ja-JP')}
                          </TableCell>
                          <TableCell>{item.file_name}</TableCell>
                          <TableCell>{formatFileSize(item.file_size)}</TableCell>
                          <TableCell>{item.profile_name || '-'}</TableCell>
                          <TableCell>{item.upload_directory}</TableCell>
                          <TableCell>{getStatusChip(item.status)}</TableCell>
                          <TableCell>
                            {item.duration ? `${item.duration}秒` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={history.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="表示件数:"
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};