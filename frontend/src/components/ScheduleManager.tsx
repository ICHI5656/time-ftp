import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Folder as FolderIcon,
  Cloud as CloudIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxBlankIcon,
  Info as InfoIcon,
  AccessTime as AccessTimeIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material'
import * as cronParser from 'cron-parser'

interface FTPConnection {
  id: number
  name: string
  host: string
  default_directory: string
}

interface CSVFile {
  name: string
  size: number
  created: string
  modified: string
}

interface Schedule {
  id: number
  name: string
  ftp_connection_id: number
  source_directory: string
  target_directory: string
  cron_expression: string
  is_active: boolean
  file_pattern?: string
  selected_files?: string[]
  created_at: string
}

const ScheduleManager: React.FC = () => {
  const [scheduleName, setScheduleName] = useState('')
  const [ftpConnectionId, setFtpConnectionId] = useState<string>('')
  const [sourceDirectory, setSourceDirectory] = useState('uploads')
  const [targetDirectory, setTargetDirectory] = useState('')
  const [cronExpression, setCronExpression] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [useFileSelection, setUseFileSelection] = useState(false)
  const [filePattern, setFilePattern] = useState('*.csv')
  
  const [ftpConnections, setFtpConnections] = useState<FTPConnection[]>([])
  const [availableFiles, setAvailableFiles] = useState<CSVFile[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [detailDialog, setDetailDialog] = useState<Schedule | null>(null)

  // FTP接続一覧を取得
  useEffect(() => {
    fetchFTPConnections()
    fetchAvailableFiles()
    fetchSchedules()
  }, [])

  const fetchFTPConnections = async () => {
    try {
      const response = await fetch('/api/ftp')
      if (response.ok) {
        const data = await response.json()
        setFtpConnections(data)
      }
    } catch (error) {
      console.error('Failed to fetch FTP connections:', error)
    }
  }

  const fetchAvailableFiles = async () => {
    try {
      const response = await fetch('/api/uploads/files')
      if (response.ok) {
        const data = await response.json()
        setAvailableFiles(data)
      }
    } catch (error) {
      console.error('Failed to fetch files:', error)
    }
  }

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedules')
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    }
  }

  const handleFileToggle = (fileName: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileName)) {
        return prev.filter(f => f !== fileName)
      } else {
        return [...prev, fileName]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === availableFiles.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(availableFiles.map(f => f.name))
    }
  }

  const handleCreateSchedule = async () => {
    if (!scheduleName || !ftpConnectionId || !targetDirectory || !cronExpression) {
      setMessage('必須項目を入力してください')
      return
    }

    if (useFileSelection && selectedFiles.length === 0) {
      setMessage('アップロードするファイルを選択してください')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scheduleName,
          ftp_connection_id: parseInt(ftpConnectionId),
          source_directory: sourceDirectory,
          target_directory: targetDirectory,
          cron_expression: cronExpression,
          file_pattern: useFileSelection ? null : filePattern,
          selected_files: useFileSelection ? selectedFiles : null
        })
      })

      if (response.ok) {
        setMessage('スケジュールを作成しました')
        // フォームをリセット
        setScheduleName('')
        setFtpConnectionId('')
        setTargetDirectory('')
        setCronExpression('')
        setSelectedFiles([])
        setUseFileSelection(false)
        setFilePattern('*.csv')
        // スケジュール一覧を更新
        fetchSchedules()
      } else {
        const error = await response.json()
        setMessage(`エラー: ${error.error}`)
      }
    } catch (error) {
      setMessage('スケジュール作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('このスケジュールを削除しますか？')) return

    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setMessage('スケジュールを削除しました')
        fetchSchedules()
      }
    } catch (error) {
      setMessage('削除に失敗しました')
    }
  }

  const handleToggleSchedule = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      })
      if (response.ok) {
        setMessage(isActive ? 'スケジュールを一時停止しました' : 'スケジュールを有効化しました')
        fetchSchedules()
      }
    } catch (error) {
      setMessage('更新に失敗しました')
    }
  }

  const getCronDescription = (cron: string) => {
    const patterns: { [key: string]: string } = {
      '0 9 * * *': '毎日午前9時',
      '0 */2 * * *': '2時間ごと',
      '0 9 * * 1-5': '平日午前9時',
      '*/30 * * * *': '30分ごと',
      '0 0 1 * *': '毎月1日0時'
    }
    return patterns[cron] || cron
  }

  const getNextExecutionTime = (cronExpression: string) => {
    try {
      const interval = cronParser.parseExpression(cronExpression)
      const nextDate = interval.next().toDate()
      
      // 日時を日本語形式でフォーマット
      const now = new Date()
      const isToday = nextDate.toDateString() === now.toDateString()
      const isTomorrow = nextDate.toDateString() === new Date(now.getTime() + 86400000).toDateString()
      
      const timeStr = nextDate.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      
      if (isToday) {
        return `今日 ${timeStr}`
      } else if (isTomorrow) {
        return `明日 ${timeStr}`
      } else {
        return nextDate.toLocaleString('ja-JP', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    } catch (error) {
      return '計算できません'
    }
  }

  const sortFilesByOrder = (files: string[]): string[] => {
    return [...files].sort((a, b) => {
      // 001_形式の番号を抽出
      const getOrder = (filename: string): number => {
        const match = filename.match(/^(\d+)_/)
        return match ? parseInt(match[1], 10) : 999999
      }
      
      const orderA = getOrder(a)
      const orderB = getOrder(b)
      
      if (orderA !== orderB) {
        return orderA - orderB
      }
      // 番号が同じか、番号がない場合はファイル名でソート
      return a.localeCompare(b)
    })
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        スケジュール管理
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon color="primary" />
          新規スケジュール作成
        </Typography>
        
        {message && (
          <Alert severity={message.includes('エラー') ? 'error' : 'success'} sx={{ mb: 2 }} onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="スケジュール名"
              margin="normal"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              required
              helperText="例：毎日の売上データアップロード"
            />
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel>FTP接続先</InputLabel>
              <Select 
                label="FTP接続先"
                value={ftpConnectionId}
                onChange={(e) => setFtpConnectionId(e.target.value as string)}
              >
                <MenuItem value="">選択してください</MenuItem>
                {ftpConnections.map(conn => (
                  <MenuItem key={conn.id} value={conn.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <CloudIcon fontSize="small" />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">{conn.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {conn.host} → {conn.default_directory}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>CSVファイルの送信先FTPサーバー</FormHelperText>
            </FormControl>
            
            <TextField
              fullWidth
              label="転送先ディレクトリ"
              margin="normal"
              value={targetDirectory}
              onChange={(e) => setTargetDirectory(e.target.value)}
              placeholder="/data/csv"
              required
              helperText="FTPサーバー上の保存先フォルダ"
            />
            
            <TextField
              fullWidth
              label="Cron式"
              margin="normal"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="0 9 * * *"
              required
              helperText="例: 0 9 * * * (毎日午前9時)"
            />

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>よく使う設定：</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="毎日9時" onClick={() => setCronExpression('0 9 * * *')} />
                <Chip label="2時間ごと" onClick={() => setCronExpression('0 */2 * * *')} />
                <Chip label="平日9時" onClick={() => setCronExpression('0 9 * * 1-5')} />
                <Chip label="毎月1日" onClick={() => setCronExpression('0 0 1 * *')} />
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderIcon />
                アップロードファイル設定
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={useFileSelection}
                    onChange={(e) => setUseFileSelection(e.target.checked)}
                  />
                }
                label="特定のファイルを選択"
              />
              
              {useFileSelection ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                      アップロードするCSVファイルを選択:
                    </Typography>
                    <Button size="small" onClick={handleSelectAll}>
                      {selectedFiles.length === availableFiles.length ? '選択解除' : 'すべて選択'}
                    </Button>
                  </Box>
                  
                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <List dense>
                      {availableFiles.length === 0 ? (
                        <ListItem>
                          <ListItemText 
                            primary="CSVファイルがありません"
                            secondary="まずCSVファイルをアップロードしてください"
                          />
                        </ListItem>
                      ) : (
                        sortFilesByOrder(availableFiles.map(f => f.name)).map((fileName, index) => {
                          const file = availableFiles.find(f => f.name === fileName)!
                          const hasOrder = /^\d+_/.test(fileName)
                          
                          return (
                            <ListItem 
                              key={file.name}
                              button
                              onClick={() => handleFileToggle(file.name)}
                            >
                              <ListItemIcon>
                                <Checkbox
                                  edge="start"
                                  checked={selectedFiles.includes(file.name)}
                                  tabIndex={-1}
                                  disableRipple
                                />
                              </ListItemIcon>
                              <ListItemText 
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {hasOrder && (
                                      <Chip 
                                        label={`${index + 1}番目`} 
                                        size="small" 
                                        color="primary" 
                                        variant="outlined"
                                      />
                                    )}
                                    <Typography>{file.name}</Typography>
                                  </Box>
                                }
                                secondary={`${(file.size / 1024).toFixed(2)} KB`}
                              />
                            </ListItem>
                          )
                        })
                      )}
                    </List>
                  </Paper>
                  
                  {selectedFiles.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="primary">
                        {selectedFiles.length}個のファイルを選択中
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box>
                  <TextField
                    fullWidth
                    label="ファイルパターン"
                    margin="normal"
                    value={filePattern}
                    onChange={(e) => setFilePattern(e.target.value)}
                    placeholder="*.csv"
                    helperText="ワイルドカード使用可 (例: sales_*.csv)"
                  />
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      指定したパターンに一致するすべてのCSVファイルが自動的にアップロードされます
                    </Typography>
                  </Alert>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleCreateSchedule}
            disabled={loading}
            size="large"
            startIcon={<ScheduleIcon />}
          >
            スケジュール作成
          </Button>
          <Button 
            variant="outlined"
            onClick={() => {
              setScheduleName('')
              setFtpConnectionId('')
              setTargetDirectory('')
              setCronExpression('')
              setSelectedFiles([])
              setUseFileSelection(false)
              setFilePattern('*.csv')
            }}
          >
            リセット
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          登録済みスケジュール
        </Typography>
        
        {schedules.length === 0 ? (
          <Typography color="textSecondary">
            スケジュールが登録されていません
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {schedules.map(schedule => {
              const ftpConnection = ftpConnections.find(c => c.id === schedule.ftp_connection_id)
              return (
                <Grid item xs={12} md={6} key={schedule.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Typography variant="h6">
                          {schedule.name}
                        </Typography>
                        <Chip 
                          label={schedule.is_active ? '有効' : '停止中'}
                          color={schedule.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      
                      <List dense>
                        <ListItem>
                          <ListItemIcon><CloudIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="FTP接続"
                            secondary={ftpConnection?.name || 'Unknown'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><FolderIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="転送先"
                            secondary={schedule.target_directory}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><ScheduleIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="スケジュール"
                            secondary={getCronDescription(schedule.cron_expression)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><AccessTimeIcon fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="次回実行"
                            secondary={
                              <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                {getNextExecutionTime(schedule.cron_expression)}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {schedule.selected_files && (
                          <ListItem>
                            <ListItemIcon><CheckBoxIcon fontSize="small" /></ListItemIcon>
                            <ListItemText 
                              primary="指定ファイル"
                              secondary={`${schedule.selected_files.length}個のファイル`}
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                    <CardActions>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleSchedule(schedule.id, schedule.is_active)}
                        color={schedule.is_active ? 'default' : 'primary'}
                      >
                        {schedule.is_active ? <PauseIcon /> : <PlayIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDetailDialog(schedule)}
                        color="info"
                      >
                        <InfoIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}
      </Paper>

      {/* 詳細ダイアログ */}
      <Dialog 
        open={!!detailDialog} 
        onClose={() => setDetailDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>スケジュール詳細</DialogTitle>
        <DialogContent>
          {detailDialog && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>基本情報</Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="スケジュール名"
                    secondary={detailDialog.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="作成日時"
                    secondary={new Date(detailDialog.created_at).toLocaleString('ja-JP')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Cron式"
                    secondary={detailDialog.cron_expression}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="次回実行時刻"
                    secondary={
                      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        {getNextExecutionTime(detailDialog.cron_expression)}
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
              
              {detailDialog.selected_files && detailDialog.selected_files.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    選択されたファイル ({detailDialog.selected_files.length}個) - アップロード順
                  </Typography>
                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <List dense>
                      {sortFilesByOrder(detailDialog.selected_files).map((file, index) => {
                        const hasOrder = /^\d+_/.test(file)
                        return (
                          <ListItem key={file}>
                            <ListItemIcon>
                              <FileIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip 
                                    label={`${index + 1}`} 
                                    size="small" 
                                    color={hasOrder ? 'primary' : 'default'}
                                    sx={{ minWidth: 35 }}
                                  />
                                  <Typography>{file}</Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        )
                      })}
                    </List>
                  </Paper>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="caption">
                      ファイル名に番号（001_、002_など）が付いている場合は、その順番でアップロードされます。
                      番号がない場合は、ファイル名のアルファベット順になります。
                    </Typography>
                  </Alert>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(null)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ScheduleManager