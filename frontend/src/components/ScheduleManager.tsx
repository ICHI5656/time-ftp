import React from 'react'
import { 
  Box, 
  Typography, 
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'

const ScheduleManager: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        スケジュール管理
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          新規スケジュール作成
        </Typography>
        
        <Box component="form">
          <TextField
            fullWidth
            label="スケジュール名"
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>FTP接続</InputLabel>
            <Select label="FTP接続">
              <MenuItem value="">選択してください</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="ソースディレクトリ"
            margin="normal"
            defaultValue="uploads"
          />
          
          <TextField
            fullWidth
            label="ターゲットディレクトリ"
            margin="normal"
            placeholder="/data/csv"
          />
          
          <TextField
            fullWidth
            label="Cron式"
            margin="normal"
            placeholder="0 9 * * *"
            helperText="例: 0 9 * * * (毎日午前9時)"
          />
          
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="primary">
              スケジュール作成
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          登録済みスケジュール
        </Typography>
        <Typography color="textSecondary">
          スケジュールがここに表示されます
        </Typography>
      </Paper>
    </Box>
  )
}

export default ScheduleManager