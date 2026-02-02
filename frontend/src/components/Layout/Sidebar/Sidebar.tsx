import { useState, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  FolderOpen,
  Folder,
  InsertDriveFile,
  Description,
  ExpandMore,
  ChevronRight,
  Star,
  StarBorder,
  Refresh,
  NoteAdd,
  CreateNewFolder,
} from '@mui/icons-material';
import type { FileNode } from '../../../types';

// Sidebar用のお気に入り型（表示用）
interface SidebarFavorite {
  id: string;
  path: string;
  name: string;
}

interface SidebarProps {
  files: FileNode[];
  favorites: SidebarFavorite[];
  selectedPath?: string;
  onFileSelect?: (path: string) => void;
  onFolderToggle?: (path: string) => void;
  onAddFavorite?: (path: string, name: string) => void;
  onRemoveFavorite?: (id: string) => void;
  onFavoriteSelect?: (id: string, path: string, name: string) => void;
  onRefresh?: () => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onOpenFolder?: () => void;
  hasRootFolder?: boolean;
}

// ファイルアイコンを取得
const getFileIcon = (name: string, isFolder: boolean, isExpanded: boolean) => {
  if (isFolder) {
    return isExpanded ? (
      <FolderOpen sx={{ color: '#E8AB53', fontSize: 16 }} />
    ) : (
      <Folder sx={{ color: '#E8AB53', fontSize: 16 }} />
    );
  }

  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'md' || ext === 'markdown') {
    return <Description sx={{ color: '#519ABA', fontSize: 16 }} />;
  }
  return <InsertDriveFile sx={{ color: '#8E8E8E', fontSize: 16 }} />;
};

// ファイルツリーアイテム
const FileTreeItem = ({
  node,
  level,
  selectedPath,
  favoritePaths,
  onSelect,
  onToggle,
  onAddFavorite,
  onRemoveFavorite,
}: {
  node: FileNode;
  level: number;
  selectedPath?: string;
  favoritePaths: Set<string>;
  onSelect?: (path: string) => void;
  onToggle?: (path: string) => void;
  onAddFavorite?: (path: string, name: string) => void;
  onRemoveFavorite?: (path: string) => void;
}) => {
  const isFavorite = favoritePaths.has(node.path);
  const isSelected = selectedPath === node.path;
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (node.type === 'folder') {
      onToggle?.(node.id);
    } else {
      onSelect?.(node.path);
    }
  };

  return (
    <>
      <ListItemButton
        className="file-tree-item"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        selected={isSelected}
        sx={{
          py: 0.25,
          pl: 1 + level * 1.25,
          pr: 1,
          minHeight: 22,
          borderRadius: 0,
          transition: 'background-color 0.08s ease',
          '&.Mui-selected': {
            bgcolor: 'rgba(0, 120, 212, 0.25)',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: '#007ACC',
            },
          },
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.05)',
          },
          '&.Mui-selected:hover': {
            bgcolor: 'rgba(0, 120, 212, 0.3)',
          },
          position: 'relative',
        }}
        data-testid="file-tree-item"
      >
        {/* 展開アイコン */}
        <Box
          sx={{
            width: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 0.25,
            opacity: node.type === 'folder' ? 1 : 0,
          }}
          data-testid="folder-expand-icon"
        >
          {node.type === 'folder' && (
            node.isExpanded ? (
              <ExpandMore sx={{ fontSize: 16, color: 'text.secondary' }} />
            ) : (
              <ChevronRight sx={{ fontSize: 16, color: 'text.secondary' }} />
            )
          )}
        </Box>

        {/* ファイル/フォルダアイコン */}
        <ListItemIcon sx={{ minWidth: 20, mr: 0.5 }}>
          {getFileIcon(node.name, node.type === 'folder', node.isExpanded || false)}
        </ListItemIcon>

        {/* ファイル名 */}
        <ListItemText
          primary={node.name}
          primaryTypographyProps={{
            variant: 'body2',
            noWrap: true,
            sx: {
              fontSize: '0.8125rem',
              color: isSelected ? 'text.primary' : 'text.secondary',
              fontWeight: isSelected ? 500 : 400,
            },
          }}
        />

        {/* お気に入りボタン */}
        {node.type === 'file' && (isFavorite || isHovered) && (
          <Tooltip title={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'} arrow>
            <IconButton
              className={isFavorite ? "favorite-icon active" : "favorite-icon"}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (isFavorite) {
                  onRemoveFavorite?.(node.path);
                } else {
                  onAddFavorite?.(node.path, node.name);
                }
              }}
              sx={{
                p: 0.25,
                opacity: isFavorite ? 1 : 0.7,
                '&:hover': { opacity: 1 },
              }}
            >
              {isFavorite ? (
                <Star sx={{ fontSize: 14, color: '#F5C518' }} />
              ) : (
                <StarBorder sx={{ fontSize: 14, color: '#CCCCCC' }} />
              )}
            </IconButton>
          </Tooltip>
        )}
      </ListItemButton>

      {/* 子要素 */}
      {node.type === 'folder' && node.isExpanded && node.children && (
        <Collapse in={node.isExpanded} timeout={150} unmountOnExit>
          <List component="div" disablePadding>
            {node.children.map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                level={level + 1}
                selectedPath={selectedPath}
                favoritePaths={favoritePaths}
                onSelect={onSelect}
                onToggle={onToggle}
                onAddFavorite={onAddFavorite}
                onRemoveFavorite={onRemoveFavorite}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

// セクションヘッダー
const SectionHeader = ({
  title,
  expanded,
  onToggle,
  actions,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
}) => (
  <Box
    onClick={onToggle}
    sx={{
      display: 'flex',
      alignItems: 'center',
      px: 1,
      py: 0.5,
      cursor: 'pointer',
      flexShrink: 0,
      minHeight: 26,
      bgcolor: '#252526',
      borderBottom: '1px solid #3C3C3C',
      transition: 'background-color 0.1s ease',
      '&:hover': {
        bgcolor: '#2A2D2E',
      },
    }}
  >
    <Box
      sx={{
        width: 16,
        height: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mr: 0.5,
        transition: 'transform 0.15s ease',
        transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
      }}
    >
      <ExpandMore sx={{ fontSize: 16, color: 'text.secondary' }} />
    </Box>
    <Typography
      variant="body2"
      sx={{
        fontWeight: 600,
        fontSize: '0.6875rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'text.secondary',
        flexGrow: 1,
      }}
    >
      {title}
    </Typography>
    {expanded && (
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{ display: 'flex', gap: 0.25 }}
      >
        {actions}
      </Box>
    )}
  </Box>
);

const Sidebar = ({
  files,
  favorites,
  selectedPath,
  onFileSelect,
  onFolderToggle,
  onAddFavorite,
  onRemoveFavorite,
  onFavoriteSelect,
  onRefresh,
  onNewFile,
  onNewFolder,
  onOpenFolder,
  hasRootFolder = false,
}: SidebarProps) => {
  const [explorerExpanded, setExplorerExpanded] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [splitRatio, setSplitRatio] = useState(60);
  const containerRef = useRef<HTMLDivElement>(null);

  // お気に入りパスのセットを計算
  const favoritePaths = useMemo(() => new Set(favorites.map((f) => f.path)), [favorites]);

  // パスからお気に入りを削除するヘルパー
  const handleRemoveFavoriteByPath = useCallback((path: string) => {
    const favorite = favorites.find((f) => f.path === path);
    if (favorite) {
      onRemoveFavorite?.(favorite.id);
    }
  }, [favorites, onRemoveFavorite]);

  // リサイズハンドルのドラッグ処理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newRatio = ((moveEvent.clientY - containerRect.top) / containerRect.height) * 100;
      setSplitRatio(Math.max(20, Math.min(80, newRatio)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // レイアウト計算
  const getExplorerStyle = () => {
    if (!explorerExpanded) {
      return { flex: 'none' };
    }
    if (!favoritesExpanded) {
      return { flex: 1 };
    }
    return { flex: `0 0 ${splitRatio}%` };
  };

  const getFavoritesStyle = () => {
    if (!favoritesExpanded) {
      return { flex: 'none' };
    }
    if (!explorerExpanded) {
      return { flex: 1 };
    }
    return { flex: 1 };
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: '#252526',
        borderRight: '1px solid #3C3C3C',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      data-testid="file-tree-sidebar"
    >
      {/* エクスプローラーセクション */}
      <Box
        sx={{
          ...getExplorerStyle(),
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <SectionHeader
          title="エクスプローラー"
          expanded={explorerExpanded}
          onToggle={() => setExplorerExpanded(!explorerExpanded)}
          actions={
            <>
              <Tooltip title="フォルダーを開く" arrow>
                <IconButton
                  data-testid="open-folder-button"
                  size="small"
                  onClick={onOpenFolder}
                  sx={{
                    p: 0.25,
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  <FolderOpen sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="新しいフォルダー" arrow>
                <span>
                  <IconButton
                    size="small"
                    onClick={onNewFolder}
                    disabled={!hasRootFolder}
                    sx={{
                      p: 0.25,
                      color: 'text.secondary',
                      '&:hover': { color: 'text.primary' },
                      '&.Mui-disabled': {
                        color: 'action.disabled',
                      },
                    }}
                  >
                    <CreateNewFolder sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="新しいファイル" arrow>
                <IconButton
                  size="small"
                  onClick={onNewFile}
                  sx={{
                    p: 0.25,
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  <NoteAdd sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="更新" arrow>
                <IconButton
                  size="small"
                  onClick={onRefresh}
                  sx={{
                    p: 0.25,
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  <Refresh sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </>
          }
        />
        {explorerExpanded && (
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              minHeight: 0,
              '&::-webkit-scrollbar': {
                width: 8,
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 4,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
              },
            }}
          >
            <List component="nav" disablePadding>
              {files.length > 0 ? (
                files.map((node) => (
                  <FileTreeItem
                    key={node.path}
                    node={node}
                    level={0}
                    selectedPath={selectedPath}
                    favoritePaths={favoritePaths}
                    onSelect={onFileSelect}
                    onToggle={onFolderToggle}
                    onAddFavorite={onAddFavorite}
                    onRemoveFavorite={handleRemoveFavoriteByPath}
                  />
                ))
              ) : (
                <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    フォルダーが開かれていません
                  </Typography>
                </Box>
              )}
            </List>
          </Box>
        )}
      </Box>

      {/* リサイズハンドル */}
      {explorerExpanded && favoritesExpanded && (
        <Box
          onMouseDown={handleMouseDown}
          sx={{
            height: 4,
            cursor: 'row-resize',
            bgcolor: 'transparent',
            flexShrink: 0,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              height: 1,
              bgcolor: '#3C3C3C',
              transition: 'background-color 0.15s ease',
            },
            '&:hover::after': {
              bgcolor: '#007ACC',
              height: 2,
              top: 'calc(50% - 0.5px)',
            },
          }}
        />
      )}

      {/* お気に入りセクション */}
      <Box
        sx={{
          ...getFavoritesStyle(),
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <SectionHeader
          title="お気に入り"
          expanded={favoritesExpanded}
          onToggle={() => setFavoritesExpanded(!favoritesExpanded)}
        />
        {favoritesExpanded && (
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              minHeight: 0,
              '&::-webkit-scrollbar': {
                width: 8,
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 4,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
              },
            }}
          >
            <List component="nav" className="favorites-list" disablePadding>
              {favorites.length > 0 ? (
                favorites.map((fav) => (
                  <ListItemButton
                    className="favorite-item"
                    key={fav.id}
                    onClick={() => onFavoriteSelect?.(fav.id, fav.path, fav.name)}
                    selected={selectedPath === fav.path}
                    sx={{
                      py: 0.25,
                      pl: 2,
                      pr: 1,
                      minHeight: 22,
                      transition: 'background-color 0.08s ease',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(0, 120, 212, 0.25)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 2,
                          bgcolor: '#007ACC',
                        },
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                      },
                      position: 'relative',
                    }}
                  >
                    <Tooltip title="お気に入りから削除" arrow>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFavorite?.(fav.id);
                        }}
                        sx={{
                          minWidth: 20,
                          mr: 0.5,
                          p: 0.25,
                          '&:hover': {
                            bgcolor: 'transparent',
                            opacity: 0.8,
                          },
                        }}
                      >
                        <Star sx={{ color: '#F5C518', fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <ListItemText
                      primary={fav.name}
                      primaryTypographyProps={{
                        variant: 'body2',
                        noWrap: true,
                        sx: {
                          fontSize: '0.8125rem',
                          color: selectedPath === fav.path ? 'text.primary' : 'text.secondary',
                        },
                      }}
                    />
                  </ListItemButton>
                ))
              ) : (
                <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    お気に入りはありません
                  </Typography>
                </Box>
              )}
            </List>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;
