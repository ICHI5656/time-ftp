import React from 'react'
import { 
  Box, 
  Typography, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'

const UploadHistory: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        アップロード履歴
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ファイル名</TableCell>
                <TableCell>アップロード先</TableCell>
                <TableCell>日時</TableCell>
                <TableCell>ステータス</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} align="center">
                  履歴データがありません
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

export default UploadHistory