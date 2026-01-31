import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export type SaveConfirmResult = 'save' | 'discard' | 'cancel';

interface SaveConfirmDialogProps {
  open: boolean;
  fileName: string;
  onClose: (result: SaveConfirmResult) => void;
}

const SaveConfirmDialog = ({ open, fileName, onClose }: SaveConfirmDialogProps) => {
  // ドラッグ用の状態
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // ダイアログが閉じたときに位置をリセット
  useEffect(() => {
    if (!open) {
      setPosition(null);
    }
  }, [open]);

  // ドラッグ開始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // ボタンのクリックは除外
    if ((e.target as HTMLElement).closest('button')) return;

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

  return (
    <Dialog
      open={open}
      onClose={() => onClose('cancel')}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 370,
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
          mb: 3,
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
      <DialogContent sx={{ pt: 0, pb: 3, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <HelpOutlineIcon
            sx={{
              fontSize: 32,
              color: '#0078d4',
            }}
          />
          <Box sx={{ pt: 0.5 }}>
            <Typography variant="body2" sx={{ color: '#000', fontSize: '12px' }}>
              {fileName}
            </Typography>
            <Typography variant="body2" sx={{ color: '#000', fontSize: '12px' }}>
              は変更されています。閉じる前に保存しますか？
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, pt: 2, justifyContent: 'center', gap: 0.5, bgcolor: '#e0e0e0', borderTop: '1px solid #ccc' }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => onClose('save')}
          sx={{
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
          }}
        >
          はい(Y)
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => onClose('discard')}
          sx={{
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
          }}
        >
          いいえ(N)
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => onClose('cancel')}
          sx={{
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
          }}
        >
          キャンセル
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveConfirmDialog;
