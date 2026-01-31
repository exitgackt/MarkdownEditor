import { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import {
  Close,
  Description,
  MoreHoriz,
  CloseFullscreen,
  ContentCopy,
  InsertDriveFile,
} from '@mui/icons-material';
import type { Tab as TabType } from '../../../types';

// Tab型の拡張（表示用）
interface DisplayTab extends TabType {
  name?: string;
}

interface TabBarProps {
  tabs: DisplayTab[];
  activeTabId?: string;
  onTabSelect?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onTabCloseOthers?: (tabId: string) => void;
  onTabCloseAll?: () => void;
  onTabDuplicate?: (tabId: string) => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
}

// ファイル拡張子からアイコンを取得
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'md' || ext === 'markdown') {
    return <Description sx={{ fontSize: 16, color: '#519ABA' }} />;
  }
  return <InsertDriveFile sx={{ fontSize: 16, color: '#8E8E8E' }} />;
};

// 単一タブコンポーネント
const TabItem = ({
  tab,
  index,
  isActive,
  onSelect,
  onClose,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragging,
  isDragOver,
}: {
  tab: DisplayTab;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragging: boolean;
  isDragOver: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      className="tab"
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, index)}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 35,
        px: 1.25,
        gap: 0.75,
        cursor: isDragging ? 'grabbing' : 'grab',
        bgcolor: isDragOver ? '#094771' : isActive ? '#1E1E1E' : '#2D2D2D',
        border: '1px solid #4A4A4A',
        borderLeft: isDragOver ? '2px solid #007ACC' : '1px solid #4A4A4A',
        borderRadius: '4px 4px 0 0',
        position: 'relative',
        transition: 'background-color 0.1s ease, border-left 0.1s ease',
        minWidth: 100,
        maxWidth: 200,
        flexShrink: 0,
        opacity: isDragging ? 0.5 : 1,
        '&:hover': {
          bgcolor: isDragOver ? '#094771' : isActive ? '#1E1E1E' : '#3A3A3A',
        },
        // アクティブタブの上部ハイライト
        '&::before': isActive ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          bgcolor: '#007ACC',
          zIndex: 0,
        } : {},
        // アクティブタブの下部ボーダーを消す
        '&::after': isActive ? {
          content: '""',
          position: 'absolute',
          bottom: -1,
          left: 0,
          right: 0,
          height: 1,
          bgcolor: '#1E1E1E',
          zIndex: 0,
        } : {},
      }}
    >
      {/* ファイルアイコン */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, zIndex: 1 }}>
        {getFileIcon(tab.fileName || tab.name || '')}
      </Box>

      {/* ファイル名 */}
      <Typography
        variant="body2"
        noWrap
        sx={{
          fontSize: '0.8125rem',
          color: isActive ? '#FFFFFF' : '#969696',
          fontWeight: isActive ? 500 : 400,
          flex: '1 1 auto',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '35px',
          zIndex: 1,
        }}
      >
        {tab.fileName || tab.name || 'Untitled'}
      </Typography>

      {/* 未保存インジケーター or 閉じるボタン */}
      <Box
        sx={{
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        {tab.isDirty && !isHovered ? (
          // 未保存の白い丸
          <Box
            className="tab-unsaved-indicator"
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: isActive ? '#fff' : 'text.secondary',
              transition: 'all 0.15s ease',
            }}
          />
        ) : (
          // 閉じるボタン（ホバー時または未保存でない時）
          <IconButton
            className="tab-close-button"
            size="small"
            onClick={onClose}
            sx={{
              p: 0.25,
              opacity: isHovered || isActive ? 0.8 : 0,
              transition: 'all 0.1s ease',
              borderRadius: '4px',
              '&:hover': {
                opacity: 1,
                bgcolor: 'rgba(255, 255, 255, 0.15)',
              },
            }}
          >
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

const TabBar = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabCloseOthers,
  onTabCloseAll,
  onTabDuplicate,
  onTabReorder,
}: TabBarProps) => {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    tabId: string;
  } | null>(null);

  // ドラッグ&ドロップの状態
  const [dragState, setDragState] = useState<{
    draggingIndex: number | null;
    dragOverIndex: number | null;
  }>({
    draggingIndex: null,
    dragOverIndex: null,
  });

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDragState({ draggingIndex: index, dragOverIndex: null });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragState.draggingIndex !== null && dragState.draggingIndex !== index) {
      setDragState((prev) => ({ ...prev, dragOverIndex: index }));
    }
  };

  const handleDragEnd = () => {
    setDragState({ draggingIndex: null, dragOverIndex: null });
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== toIndex && !isNaN(fromIndex)) {
      onTabReorder?.(fromIndex, toIndex);
    }
    setDragState({ draggingIndex: null, dragOverIndex: null });
  };

  const handleContextMenu = (event: React.MouseEvent, tabId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      tabId,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose?.(tabId);
  };

  // タブがない場合の表示
  if (tabs.length === 0) {
    return (
      <Box
        sx={{
          height: 35,
          bgcolor: '#252526',
          borderBottom: 'none',
        }}
      />
    );
  }

  return (
    <Box
      className="tab-bar"
      sx={{
        bgcolor: '#252526',
        borderBottom: 'none',
        display: 'flex',
        alignItems: 'flex-end',
        minHeight: 35,
        overflow: 'hidden',
      }}
    >
      {/* タブコンテナ */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          flexGrow: 1,
          maxHeight: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
        }}
      >
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.id}
            tab={tab}
            index={index}
            isActive={activeTabId === tab.id}
            onSelect={() => onTabSelect?.(tab.id)}
            onClose={(e) => handleCloseTab(e, tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            isDragging={dragState.draggingIndex === index}
            isDragOver={dragState.dragOverIndex === index}
          />
        ))}
      </Box>

      {/* タブ操作メニューボタン */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 0.5,
          height: 35,
          borderLeft: '1px solid #3C3C3C',
          bgcolor: '#252526',
          flexShrink: 0,
        }}
      >
        <Tooltip title="タブ操作" arrow>
          <IconButton
            size="small"
            onClick={(e) => handleContextMenu(e, '')}
            sx={{
              color: 'text.secondary',
              width: 24,
              height: 24,
              '&:hover': {
                color: 'text.primary',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <MoreHoriz sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* コンテキストメニュー */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        MenuListProps={{ dense: true }}
        transitionDuration={150}
      >
        {contextMenu?.tabId && (
          <>
            <MenuItem
              onClick={() => {
                onTabClose?.(contextMenu.tabId);
                handleCloseContextMenu();
              }}
            >
              <ListItemIcon>
                <Close fontSize="small" />
              </ListItemIcon>
              <ListItemText>閉じる</ListItemText>
              <Typography
                variant="caption"
                sx={{
                  ml: 3,
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  fontFamily: '"SF Mono", "Consolas", monospace',
                }}
              >
                Ctrl+W
              </Typography>
            </MenuItem>
            <MenuItem
              onClick={() => {
                onTabCloseOthers?.(contextMenu.tabId);
                handleCloseContextMenu();
              }}
            >
              <ListItemIcon>
                <CloseFullscreen fontSize="small" />
              </ListItemIcon>
              <ListItemText>他のタブを閉じる</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                onTabDuplicate?.(contextMenu.tabId);
                handleCloseContextMenu();
              }}
            >
              <ListItemIcon>
                <ContentCopy fontSize="small" />
              </ListItemIcon>
              <ListItemText>タブを複製</ListItemText>
            </MenuItem>
            <Divider />
          </>
        )}
        <MenuItem
          onClick={() => {
            onTabCloseAll?.();
            handleCloseContextMenu();
          }}
        >
          <ListItemIcon>
            <CloseFullscreen fontSize="small" />
          </ListItemIcon>
          <ListItemText>すべてのタブを閉じる</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TabBar;
