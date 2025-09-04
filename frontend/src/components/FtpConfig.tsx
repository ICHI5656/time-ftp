import React from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'

const FtpConfig: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        FTP接続設定
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              新規FTP接続
            </Typography>
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="接続名"
                margin="normal"
              />
              <TextField
                fullWidth
                label="ホスト"
                margin="normal"
              />
              <TextField
                fullWidth
                label="ユーザー名"
                margin="normal"
              />
              <TextField
                fullWidth
                label="パスワード"
                type="password"
                margin="normal"
              />
              <TextField
                fullWidth
                label="ポート"
                type="number"
                defaultValue="21"
                margin="normal"
              />
              <TextField
                fullWidth
                label="デフォルトディレクトリ"
                defaultValue="/"
                margin="normal"
              />
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" color="primary" sx={{ mr: 1 }}>
                  保存
                </Button>
                <Button variant="outlined">
                  接続テスト
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              登録済みFTP接続
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>接続名</TableCell>
                    <TableCell>ホスト</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      データがありません
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default FtpConfig