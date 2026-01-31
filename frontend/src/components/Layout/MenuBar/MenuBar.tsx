import { useState, useEffect, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Menu,
  MenuItem,
  Divider,
  IconButton,
  Box,
  Typography,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  FolderOpen,
  CreateNewFolder,
  Save,
  SaveAs,
  NoteAdd,
  FileOpen,
  Close,
  CloseFullscreen,
  Undo,
  Redo,
  Search,
  FindReplace,
  Preview,
  AccountTree,
  ViewSidebar,
  VerticalSplit,
  Compare,
  Settings,
  Person,
  Logout,
  Help,
  Keyboard,
  Info,
  GetApp,
  FileUpload,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores';

interface MenuBarProps {
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onOpenFolder?: () => void;
  onOpenFile?: () => void;
  onImport?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onSaveAll?: () => void;
  onCloseTab?: () => void;
  onCloseAllTabs?: () => void;
  onNextTab?: () => void;
  onPreviousTab?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFind?: () => void;
  onReplace?: () => void;
  onTogglePreview?: () => void;
  onToggleMindmap?: () => void;
  onToggleSplit?: () => void;
  onToggleSidebar?: () => void;
  onToggleDiff?: () => void;
  onOpenSettings?: () => void;
  onOpenKeyboardShortcuts?: () => void;
  onOpenHelp?: () => void;
  onVersionInfo?: () => void;
  onExportPreview?: () => void;
  onExportMindmap?: () => void;
  onLogout?: () => void;
  hasContent?: boolean;
  hasRootFolder?: boolean;
}

// メニューボタンのスタイル
const menuButtonSx = {
  color: 'text.primary',
  textTransform: 'none',
  minWidth: 'auto',
  px: 1.5,
  py: 0.5,
  fontSize: '0.8125rem',
  fontWeight: 400,
  borderRadius: '4px',
  transition: 'all 0.12s ease',
  '&:hover': {
    bgcolor: 'rgba(255, 255, 255, 0.08)',
  },
  '& u': {
    textDecoration: 'none',
    borderBottom: '1px solid transparent',
  },
  '&:hover u': {
    borderBottom: '1px solid currentColor',
  },
};

// ショートカットテキストのスタイル
const shortcutTextSx = {
  ml: 'auto',
  pl: 3,
  fontSize: '0.75rem',
  color: 'text.secondary',
  opacity: 0.7,
  fontFamily: '"SF Mono", "Consolas", "Monaco", monospace',
};

const MenuBar = ({
  onNewFile,
  onNewFolder,
  onOpenFolder,
  onOpenFile,
  onImport,
  onSave,
  onSaveAs,
  onSaveAll,
  onCloseTab,
  onCloseAllTabs,
  onNextTab,
  onPreviousTab,
  onUndo,
  onRedo,
  onFind,
  onReplace,
  onTogglePreview,
  onToggleMindmap,
  onToggleSplit,
  onToggleSidebar,
  onToggleDiff,
  onOpenSettings,
  onOpenKeyboardShortcuts,
  onOpenHelp,
  onVersionInfo,
  onExportPreview,
  onExportMindmap,
  onLogout,
  hasContent = false,
  hasRootFolder = false,
}: MenuBarProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [anchorEl, setAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({
    file: null,
    edit: null,
    view: null,
    tools: null,
    help: null,
    settings: null,
    user: null,
  });

  // エクスポートサブメニューのanchor
  const [exportSubmenuAnchor, setExportSubmenuAnchor] = useState<HTMLElement | null>(null);

  // ホバー切り替えが有効かどうか（refで即時反映）
  const hoverEnabledRef = useRef(false);

  // メニューボタンのref
  const menuButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({
    file: null,
    edit: null,
    view: null,
    tools: null,
    help: null,
  });

  // Alt+キーのショートカット処理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;

      const keyMap: { [key: string]: string } = {
        'f': 'file',
        'e': 'edit',
        'v': 'view',
        't': 'tools',
        'h': 'help',
      };

      const menu = keyMap[e.key.toLowerCase()];
      if (menu && menuButtonRefs.current[menu]) {
        e.preventDefault();
        menuButtonRefs.current[menu]?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // メニューが開いているときにマウス移動を監視してホバー切り替え
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // ホバー切り替えが無効なら何もしない（refなので即時反映）
      if (!hoverEnabledRef.current) return;

      const menuNames = ['file', 'edit', 'view', 'tools', 'help'];

      for (const menuName of menuNames) {
        const button = menuButtonRefs.current[menuName];
        if (button) {
          const rect = button.getBoundingClientRect();
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          ) {
            // マウスがこのボタン上にある場合、そのメニューを開く
            setAnchorEl({
              file: null,
              edit: null,
              view: null,
              tools: null,
              help: null,
              settings: null,
              user: null,
              [menuName]: button,
            });
            return;
          }
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleMenuOpen = (menu: string) => (event: React.MouseEvent<HTMLElement>) => {
    // メニューを開くときにホバー切り替えを有効にする
    hoverEnabledRef.current = true;
    setAnchorEl({
      file: null,
      edit: null,
      view: null,
      tools: null,
      help: null,
      settings: null,
      user: null,
      [menu]: event.currentTarget,
    });
  };

  // すべてのメニューを閉じる
  const closeAllMenus = () => {
    // ホバー切り替えを無効にする（即時反映）
    hoverEnabledRef.current = false;
    setAnchorEl({
      file: null,
      edit: null,
      view: null,
      tools: null,
      help: null,
      settings: null,
      user: null,
    });
    setExportSubmenuAnchor(null);
  };

  const handleMenuClose = (_menu: string) => () => {
    closeAllMenus();
  };

  const handleAction = (_menu: string, action?: () => void) => () => {
    closeAllMenus();
    action?.();
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: '#323233',
        boxShadow: 'none',
        borderBottom: '1px solid #3C3C3C',
        width: '100%',
        flexShrink: 0,
      }}
      data-testid="menu-bar"
    >
      <Toolbar
        variant="dense"
        sx={{
          minHeight: 36,
          height: 36,
          px: 1,
          gap: 0.25,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* ロゴ */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mr: 1.5,
            gap: 0.75,
          }}
        >
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '3px',
              background: 'linear-gradient(135deg, #0078D4 0%, #00B4D8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            M
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              fontSize: '0.8125rem',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            VS Markdown
          </Typography>
        </Box>

        {/* ファイルメニュー */}
        <Button
          ref={(el) => { menuButtonRefs.current.file = el; }}
          size="small"
          onClick={handleMenuOpen('file')}
          sx={menuButtonSx}
        >
          ファイル(<u>F</u>)
        </Button>
        <Menu
          anchorEl={anchorEl.file}
          open={Boolean(anchorEl.file)}
          onClose={handleMenuClose('file')}
          MenuListProps={{ dense: true }}
          transitionDuration={150}
        >
          <MenuItem onClick={handleAction('file', onNewFile)}>
            <ListItemIcon><NoteAdd fontSize="small" /></ListItemIcon>
            <ListItemText>新しいファイル</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+N</Typography>
          </MenuItem>
          <MenuItem onClick={handleAction('file', onNewFolder)} disabled={!hasRootFolder}>
            <ListItemIcon><CreateNewFolder fontSize="small" /></ListItemIcon>
            <ListItemText>新しいフォルダー</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+B</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleAction('file', onOpenFile)}>
            <ListItemIcon><FileOpen fontSize="small" /></ListItemIcon>
            <ListItemText>ファイルを開く</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+O</Typography>
          </MenuItem>
          <MenuItem onClick={handleAction('file', onOpenFolder)}>
            <ListItemIcon><FolderOpen fontSize="small" /></ListItemIcon>
            <ListItemText>フォルダーを開く</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+U</Typography>
          </MenuItem>
          <MenuItem onClick={handleAction('file', onImport)}>
            <ListItemIcon><FileUpload fontSize="small" /></ListItemIcon>
            <ListItemText>インポート</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+I</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleAction('file', onSave)} disabled={!hasContent}>
            <ListItemIcon><Save fontSize="small" /></ListItemIcon>
            <ListItemText>保存</ListItemText>
            <Typography sx={shortcutTextSx}>Ctrl+S</Typography>
          </MenuItem>
          <MenuItem onClick={handleAction('file', onSaveAs)} disabled={!hasContent}>
            <ListItemIcon><SaveAs fontSize="small" /></ListItemIcon>
            <ListItemText>名前を付けて保存</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+S</Typography>
          </MenuItem>
          <MenuItem onClick={handleAction('file', onSaveAll)} disabled={!hasContent}>
            <ListItemIcon><Save fontSize="small" /></ListItemIcon>
            <ListItemText>すべて保存</ListItemText>
            <Typography sx={shortcutTextSx}>Ctrl+Alt+S</Typography>
          </MenuItem>
          <Divider />
          <MenuItem
            disabled={!hasContent}
            onMouseEnter={(e) => setExportSubmenuAnchor(e.currentTarget)}
            sx={{
              position: 'relative',
              '&:after': {
                content: '"▶"',
                position: 'absolute',
                right: 8,
                fontSize: '10px',
                color: hasContent ? 'text.secondary' : 'action.disabled',
              },
            }}
          >
            <ListItemIcon><GetApp fontSize="small" /></ListItemIcon>
            <ListItemText>エクスポート</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleAction('file', onCloseTab)} disabled={!hasContent}>
            <ListItemIcon><Close fontSize="small" /></ListItemIcon>
            <ListItemText>タブを閉じる</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+K</Typography>
          </MenuItem>
          <MenuItem onClick={handleAction('file', onCloseAllTabs)} disabled={!hasContent}>
            <ListItemIcon><CloseFullscreen fontSize="small" /></ListItemIcon>
            <ListItemText>全てのタブを閉じる</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+J</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleAction('file', onPreviousTab)} disabled={!hasContent}>
            <ListItemText>前のタブ</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+Z</Typography>
          </MenuItem>
          <MenuItem onClick={handleAction('file', onNextTab)} disabled={!hasContent}>
            <ListItemText>次のタブ</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+X</Typography>
          </MenuItem>
        </Menu>

        {/* エクスポートサブメニュー */}
        <Menu
          anchorEl={exportSubmenuAnchor}
          open={Boolean(exportSubmenuAnchor)}
          onClose={() => setExportSubmenuAnchor(null)}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          sx={{
            pointerEvents: 'none',
            '& .MuiPaper-root': {
              pointerEvents: 'auto',
              bgcolor: '#2D2D2D',
              color: '#fff',
              minWidth: 200,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              ml: 0.5,
            },
          }}
          MenuListProps={{
            onMouseLeave: () => setExportSubmenuAnchor(null),
          }}
        >
          <MenuItem
            onClick={() => {
              setExportSubmenuAnchor(null);
              handleAction('file', onExportPreview)();
            }}
          >
            <ListItemIcon><Preview fontSize="small" /></ListItemIcon>
            <ListItemText>ドキュメントをエクスポート</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setExportSubmenuAnchor(null);
              handleAction('file', onExportMindmap)();
            }}
          >
            <ListItemIcon><AccountTree fontSize="small" /></ListItemIcon>
            <ListItemText>マインドマップをエクスポート</ListItemText>
          </MenuItem>
        </Menu>

        {/* 編集メニュー */}
        <Button
          ref={(el) => { menuButtonRefs.current.edit = el; }}
          size="small"
          onClick={handleMenuOpen('edit')}
          sx={menuButtonSx}
        >
          編集(<u>E</u>)
        </Button>
        <Menu
          anchorEl={anchorEl.edit}
          open={Boolean(anchorEl.edit)}
          onClose={handleMenuClose('edit')}
          MenuListProps={{ dense: true }}
          transitionDuration={150}
        >
          <MenuItem onClick={handleAction('edit', onUndo)} disabled={!hasContent}>
            <ListItemIcon><Undo fontSize="small" /></ListItemIcon>
            <ListItemText>元に戻す</ListItemText>
            <Typography sx={shortcutTextSx}>Ctrl+Z</Typography>
          </MenuItem>
          <MenuItem onClick={handleAction('edit', onRedo)} disabled={!hasContent}>
            <ListItemIcon><Redo fontSize="small" /></ListItemIcon>
            <ListItemText>やり直し</ListItemText>
            <Typography sx={shortcutTextSx}>Ctrl+Y</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleAction('edit', onFind)} disabled={!hasContent}>
            <ListItemIcon><Search fontSize="small" /></ListItemIcon>
            <ListItemText>検索</ListItemText>
            <Typography sx={shortcutTextSx}>Ctrl+F</Typography>
          </MenuItem>
          <MenuItem onClick={handleAction('edit', onReplace)} disabled={!hasContent}>
            <ListItemIcon><FindReplace fontSize="small" /></ListItemIcon>
            <ListItemText>置換</ListItemText>
            <Typography sx={shortcutTextSx}>Ctrl+R</Typography>
          </MenuItem>
        </Menu>

        {/* 表示メニュー */}
        <Button
          ref={(el) => { menuButtonRefs.current.view = el; }}
          size="small"
          onClick={handleMenuOpen('view')}
          sx={menuButtonSx}
        >
          表示(<u>V</u>)
        </Button>
        <Menu
          anchorEl={anchorEl.view}
          open={Boolean(anchorEl.view)}
          onClose={handleMenuClose('view')}
          MenuListProps={{ dense: true }}
          transitionDuration={150}
        >
          <MenuItem onClick={handleAction('view', onTogglePreview)}>
            <ListItemIcon><Preview fontSize="small" /></ListItemIcon>
            <ListItemText>プレビュー</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+L</Typography>
          </MenuItem>
          <MenuItem onClick={handleAction('view', onToggleMindmap)}>
            <ListItemIcon><AccountTree fontSize="small" /></ListItemIcon>
            <ListItemText>マインドマップ</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+M</Typography>
          </MenuItem>
          <MenuItem onClick={handleAction('view', onToggleSplit)}>
            <ListItemIcon><VerticalSplit fontSize="small" /></ListItemIcon>
            <ListItemText>ファイルの分割表示</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+G</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleAction('view', onToggleSidebar)}>
            <ListItemIcon><ViewSidebar fontSize="small" /></ListItemIcon>
            <ListItemText>サイドバー</ListItemText>
          </MenuItem>
        </Menu>

        {/* ツールメニュー */}
        <Button
          ref={(el) => { menuButtonRefs.current.tools = el; }}
          size="small"
          onClick={handleMenuOpen('tools')}
          sx={menuButtonSx}
        >
          ツール(<u>T</u>)
        </Button>
        <Menu
          anchorEl={anchorEl.tools}
          open={Boolean(anchorEl.tools)}
          onClose={handleMenuClose('tools')}
          MenuListProps={{ dense: true }}
          transitionDuration={150}
        >
          <MenuItem onClick={handleAction('tools', onToggleDiff)}>
            <ListItemIcon><Compare fontSize="small" /></ListItemIcon>
            <ListItemText>ファイルの差分比較</ListItemText>
            <Typography sx={shortcutTextSx}>Alt+Y</Typography>
          </MenuItem>
        </Menu>

        {/* ヘルプメニュー */}
        <Button
          ref={(el) => { menuButtonRefs.current.help = el; }}
          size="small"
          onClick={handleMenuOpen('help')}
          sx={menuButtonSx}
        >
          ヘルプ(<u>H</u>)
        </Button>
        <Menu
          anchorEl={anchorEl.help}
          open={Boolean(anchorEl.help)}
          onClose={handleMenuClose('help')}
          MenuListProps={{ dense: true }}
          transitionDuration={150}
        >
          <MenuItem onClick={handleAction('help', onOpenHelp)}>
            <ListItemIcon><Help fontSize="small" /></ListItemIcon>
            <ListItemText>ヘルプ</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleAction('help', onVersionInfo)}>
            <ListItemIcon><Info fontSize="small" /></ListItemIcon>
            <ListItemText>バージョン情報</ListItemText>
          </MenuItem>
        </Menu>

        {/* スペーサー */}
        <Box sx={{ flexGrow: 1 }} />

        {/* 設定メニュー */}
        <Tooltip title="設定" arrow>
          <IconButton
            size="small"
            onClick={handleMenuOpen('settings')}
            sx={{
              color: 'text.secondary',
              width: 28,
              height: 28,
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            <Settings sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl.settings}
          open={Boolean(anchorEl.settings)}
          onClose={handleMenuClose('settings')}
          MenuListProps={{ dense: true }}
          transitionDuration={150}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleAction('settings', onOpenSettings)}>
            <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
            <ListItemText>設定</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleAction('settings', onOpenKeyboardShortcuts)}>
            <ListItemIcon><Keyboard fontSize="small" /></ListItemIcon>
            <ListItemText>キーボードショートカット</ListItemText>
          </MenuItem>
        </Menu>

        {/* ユーザーメニュー */}
        <Tooltip title="アカウント" arrow>
          <IconButton
            size="small"
            onClick={handleMenuOpen('user')}
            sx={{
              color: 'text.secondary',
              width: 28,
              height: 28,
              ml: 0.5,
              '&:hover': {
                color: 'text.primary',
              },
            }}
            data-testid="user-menu"
          >
            <Person sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl.user}
          open={Boolean(anchorEl.user)}
          onClose={handleMenuClose('user')}
          MenuListProps={{ dense: true }}
          transitionDuration={150}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {user && [
            <MenuItem
              key="user-email"
              onClick={(e) => e.stopPropagation()}
              sx={{
                cursor: 'default',
                '&:hover': {
                  backgroundColor: 'transparent',
                }
              }}
            >
              <ListItemText
                primary={user.email}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              />
            </MenuItem>,
            <Divider key="divider-1" />
          ]}
          {user?.is_admin && [
            <MenuItem key="admin-menu" onClick={handleAction('user', () => navigate('/admin/users'))}>
              <ListItemIcon><AdminPanelSettings fontSize="small" /></ListItemIcon>
              <ListItemText>管理画面</ListItemText>
            </MenuItem>,
            <Divider key="divider-2" />
          ]}
          <MenuItem onClick={handleAction('user', onLogout)} data-testid="logout-button">
            <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
            <ListItemText>ログアウト</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default MenuBar;
