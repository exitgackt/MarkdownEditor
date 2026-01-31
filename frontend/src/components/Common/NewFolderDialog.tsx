import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import { Folder as FolderIcon } from '@mui/icons-material';
import type { FileNode } from '../../types';

interface FolderOption {
  path: string;
  name: string;
  depth: number;
  handle: FileSystemDirectoryHandle;
}

interface NewFolderDialogProps {
  open: boolean;
  rootFolder: FileNode | null;
  onClose: (result: { folderName: string; parentHandle: FileSystemDirectoryHandle } | null) => void;
}

// フォルダーノードをフラット化してリストに変換
const flattenFolders = (node: FileNode, depth: number = 0): FolderOption[] => {
  const result: FolderOption[] = [];

  if (node.type === 'folder' && node.handle) {
    result.push({
      path: node.path,
      name: node.name,
      depth,
      handle: node.handle as FileSystemDirectoryHandle,
    });

    if (node.children) {
      for (const child of node.children) {
        if (child.type === 'folder') {
          result.push(...flattenFolders(child, depth + 1));
        }
      }
    }
  }

  return result;
};

// ボタンのスタイル
const buttonSx = {
  minWidth: 85,
  height: 26,
  fontSize: '12px',
  color: '#000',
  borderColor: '#adadad',
  bgcolor: '#f0f0f0',
  textTransform: 'none',
  '&:hover': {
    bgcolor: '#c7e0f4',
    borderColor: '#0078d4',
  },
};

// テキストフィールドのスタイル
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#fff',
    fontSize: '12px',
    '& fieldset': {
      borderColor: '#adadad',
    },
    '&:hover fieldset': {
      borderColor: '#0078d4',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0078d4',
    },
  },
  '& .MuiInputLabel-root': {
    fontSize: '12px',
    color: '#000',
  },
  '& .MuiInputBase-input': {
    fontSize: '12px',
    color: '#000',
  },
};

// セレクトのスタイル
const selectSx = {
  bgcolor: '#fff',
  fontSize: '12px',
  '& fieldset': {
    borderColor: '#adadad',
  },
  '&:hover fieldset': {
    borderColor: '#0078d4',
  },
  '&.Mui-focused fieldset': {
    borderColor: '#0078d4',
  },
  '& .MuiSelect-select': {
    fontSize: '12px',
    color: '#000',
  },
};

const NewFolderDialog = ({
  open,
  rootFolder,
  onClose,
}: NewFolderDialogProps) => {
  const [folderName, setFolderName] = useState('新しいフォルダー');
  const [selectedPath, setSelectedPath] = useState('');

  // ドラッグ用の状態
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // フォルダーリストを取得
  const folderOptions = useMemo(() => {
    if (!rootFolder) return [];
    return flattenFolders(rootFolder);
  }, [rootFolder]);

  // ダイアログが開かれたときに初期化
  useEffect(() => {
    if (open) {
      setFolderName('新しいフォルダー');
      // デフォルトでルートフォルダーを選択
      if (folderOptions.length > 0) {
        setSelectedPath(folderOptions[0].path);
      }
    } else {
      setPosition(null);
    }
  }, [open, folderOptions]);

  // ドラッグ開始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // ボタンやインプットのクリックは除外
    if ((e.target as HTMLElement).closest('button, input, .MuiSelect-select')) return;

    setIsDragging(true);
    const dialog = (e.target as HTMLElement).closest('.MuiDialog-paper') as HTMLElement;
    if (dialog) {
      const rect = dialog.getBoundingClientRect();
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position?.x ?? rect.left,
        posY: position?.y ?? rect.top,
      };
    }
  }, [position]);

  // ドラッグ中
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      setPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSubmit = () => {
    if (folderName.trim() && selectedPath) {
      const selectedFolder = folderOptions.find((f) => f.path === selectedPath);
      if (selectedFolder) {
        onClose({
          folderName: folderName.trim(),
          parentHandle: selectedFolder.handle,
        });
      }
    }
  };

  const handleCancel = () => {
    onClose(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 400,
          bgcolor: '#f0f0f0',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          ...(position && {
            position: 'fixed',
            left: position.x,
            top: position.y,
            margin: 0,
            transform: 'none',
          }),
        },
      }}
    >
      <DialogTitle
        onMouseDown={handleMouseDown}
        sx={{
          bgcolor: '#e0e0e0',
          py: 0.5,
          px: 1.5,
          mb: 2,
          fontSize: '12px',
          fontWeight: 'normal',
          borderBottom: '1px solid #ccc',
          color: '#000',
          cursor: 'move',
          userSelect: 'none',
        }}
      >
        Markdown Editor
      </DialogTitle>
      <DialogContent sx={{ pt: 0, pb: 2, px: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* 作成先フォルダー */}
          <Box>
            <Typography sx={{ fontSize: '12px', color: '#000', mb: 0.5 }}>
              作成先フォルダー:
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                sx={selectSx}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: '#fff',
                      '& .MuiMenuItem-root': {
                        fontSize: '12px',
                        color: '#000',
                      },
                    },
                  },
                }}
              >
                {folderOptions.map((folder) => (
                  <MenuItem key={folder.path} value={folder.path}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: folder.depth * 12 }} />
                      <FolderIcon fontSize="small" sx={{ color: '#DCAD5A', fontSize: 16 }} />
                      <span>{folder.name}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* フォルダー名 */}
          <Box>
            <Typography sx={{ fontSize: '12px', color: '#000', mb: 0.5 }}>
              フォルダー名:
            </Typography>
            <TextField
              autoFocus
              fullWidth
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
              size="small"
              sx={textFieldSx}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          px: 2,
          pb: 2,
          pt: 2,
          justifyContent: 'center',
          gap: 0.5,
          bgcolor: '#e0e0e0',
          borderTop: '1px solid #ccc',
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={handleSubmit}
          disabled={!folderName.trim() || !selectedPath}
          sx={buttonSx}
        >
          作成
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleCancel}
          sx={buttonSx}
        >
          キャンセル
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewFolderDialog;
