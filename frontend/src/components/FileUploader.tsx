import React from 'react'
import { 
  Box, 
  Typography, 
  Paper,
  Button,
  List,
  ListItem,
  ListItemText
} from '@mui/material'
import { CloudUpload } from '@mui/icons-material'

const FileUploader: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        CSVファイルアップロード
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          ファイル選択
        </Typography>
        
        <Box sx={{ 
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: '#f5f5f5'
          }
        }}>
          <CloudUpload sx={{ fontSize: 48, color: '#999', mb: 2 }} />
          <Typography color="textSecondary">
            クリックしてファイルを選択、またはドラッグ&ドロップ
          </Typography>
          <Button variant="contained" sx={{ mt: 2 }}>
            ファイルを選択
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          アップロード済みファイル
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="ファイルはまだアップロードされていません"
              secondary="CSVファイルをアップロードしてください"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  )
}

export default FileUploader