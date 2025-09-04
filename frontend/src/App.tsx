import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Container,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  CloudUpload as CloudUploadIcon,
  Schedule as ScheduleIcon,
  Dns as DnsIcon,
  History as HistoryIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material'
import Dashboard from './components/Dashboard'
import FtpConfig from './components/FtpConfig'
import ScheduleManager from './components/ScheduleManager'
import FileUploader from './components/FileUploader'
import UploadHistory from './components/UploadHistory'
import UserGuide from './components/UserGuide'

const drawerWidth = 280

const menuItems = [
  { text: 'ダッシュボード', icon: <DashboardIcon />, path: '/' },
  { text: 'FTP設定', icon: <DnsIcon />, path: '/ftp' },
  { text: 'スケジュール管理', icon: <ScheduleIcon />, path: '/schedules' },
  { text: 'ファイルアップロード', icon: <CloudUploadIcon />, path: '/upload' },
  { text: 'アップロード履歴', icon: <HistoryIcon />, path: '/history' },
  { text: '使い方ガイド', icon: <HelpIcon />, path: '/guide' },
]

function App() {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const location = useLocation()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          CSV FTP Uploader
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            CSV自動FTPアップロードシステム
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ftp" element={<FtpConfig />} />
            <Route path="/schedules" element={<ScheduleManager />} />
            <Route path="/upload" element={<FileUploader />} />
            <Route path="/history" element={<UploadHistory />} />
            <Route path="/guide" element={<UserGuide />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  )
}

export default App