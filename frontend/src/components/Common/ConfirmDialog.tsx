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
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

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

const ConfirmDialog = ({
  open,
  title = 'Markdown Editor',
  message,
  confirmText = 'はい',
  cancelText = 'いいえ',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
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
      onClose={onCancel}
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
        {title}
      </DialogTitle>
      <DialogContent sx={{ pt: 0, pb: 2, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <WarningAmberIcon
            sx={{
              fontSize: 32,
              color: '#f0ad4e',
            }}
          />
          <Box sx={{ pt: 0.5 }}>
            {message.split('\n').map((line, index) => (
              <Typography key={index} variant="body2" sx={{ color: '#000', fontSize: '12px' }}>
                {line}
              </Typography>
            ))}
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
          onClick={onConfirm}
          sx={buttonSx}
        >
          {confirmText}
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={onCancel}
          sx={buttonSx}
        >
          {cancelText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
