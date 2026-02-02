import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Divider,
  Button,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  AttachMoney as AttachMoneyIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const drawerWidth = 240;

const navItems: NavItem[] = [
  {
    label: 'ダッシュボード',
    path: '/admin/usage',
    icon: <DashboardIcon />,
  },
  {
    label: '管理者管理',
    path: '/admin/admin-management',
    icon: <AdminPanelSettingsIcon />,
  },
  {
    label: 'ユーザー管理',
    path: '/admin/users',
    icon: <PeopleIcon />,
  },
  {
    label: '売上管理',
    path: '/admin/sales',
    icon: <AttachMoneyIcon />,
  },
  {
    label: '価格設定',
    path: '/admin/pricing',
    icon: <AttachMoneyIcon />,
  },
  {
    label: 'システム設定',
    path: '/admin/settings',
    icon: <SettingsIcon />,
  },
  {
    label: 'バージョン管理',
    path: '/admin/version',
    icon: <InfoIcon />,
  },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState<null | HTMLElement>(null);

  // ページ遷移時にスクロールを最上部にリセット
  useEffect(() => {
    // 複数の方法でスクロールをリセット
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 念のため少し遅延させても実行
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleAccountMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAccountMenuAnchor(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountMenuAnchor(null);
  };

  const handleEditorNavigation = () => {
    handleAccountMenuClose();
    navigate('/editor');
  };

  const handleLogout = () => {
    handleAccountMenuClose();
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Typography variant="h6" noWrap>
          管理画面
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, pt: 2 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'inherit' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          ログアウト
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: 2 }}>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexShrink: 0 }}>
            {navItems.find((item) => item.path === location.pathname)?.label ||
              '管理画面'}
          </Typography>
          <Box sx={{ flexGrow: 1, minWidth: 0 }} />

          {/* アカウントメニュー */}
          {user && (
            <Box sx={{ flexShrink: 0 }}>
              <Tooltip title="アカウント" arrow>
                <IconButton
                  size="small"
                  onClick={handleAccountMenuOpen}
                  sx={{
                    color: 'inherit',
                    width: 40,
                    height: 40,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <PersonIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={accountMenuAnchor}
                open={Boolean(accountMenuAnchor)}
                onClose={handleAccountMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                disableScrollLock
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    maxWidth: 300,
                  },
                }}
              >
                {/* メールアドレス表示（クリック不可） */}
                <MenuItem
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    cursor: 'default',
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  <ListItemText
                    primary={user.email}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  />
                </MenuItem>
                <Divider />

                {/* エディタ画面へ */}
                <MenuItem onClick={handleEditorNavigation}>
                  <ListItemIcon>
                    <EditIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>エディタ画面</ListItemText>
                </MenuItem>
                <Divider />

                {/* ログアウト */}
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>ログアウト</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* モバイル用ドロワー */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar /> {/* スペーサー */}
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
