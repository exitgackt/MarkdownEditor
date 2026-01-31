import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

export interface MaintenanceConfirmDialogProps {
  open: boolean;
  currentState: boolean;
  onClose: () => void;
  onConfirm: (isActive: boolean, message?: string) => void;
}

const MaintenanceConfirmDialog = ({
  open,
  currentState,
  onClose,
  onConfirm,
}: MaintenanceConfirmDialogProps) => {
  const [message, setMessage] = useState('');
  const willBeActive = !currentState;

  useEffect(() => {
    if (open) {
      setMessage('');
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(willBeActive, willBeActive ? message : undefined);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableScrollLock={true}
      PaperProps={{
        sx: {
          bgcolor: '#f0f0f0',
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: willBeActive ? '#d32f2f' : '#0078d4',
          color: 'white',
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {willBeActive && <WarningIcon />}
        メンテナンスモード切替確認
      </DialogTitle>

      <DialogContent sx={{ pt: 3, bgcolor: '#f0f0f0' }}>
        {willBeActive ? (
          <>
            <Alert severity="warning" sx={{ mt: 2, mb: 3 }}>
              メンテナンスモードをONにすると、管理者以外のユーザーはサービスにアクセスできなくなります。
            </Alert>

            <Typography variant="body2" gutterBottom fontWeight="bold" sx={{ color: '#000' }}>
              メンテナンスメッセージ（任意）
            </Typography>
            <TextField
              multiline
              fullWidth
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="例: システムメンテナンス中です。14:00頃に復旧予定です。"
              sx={{
                bgcolor: 'white',
                mt: 1,
                '& .MuiInputBase-input': {
                  color: '#000',
                  fontWeight: 500,
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#666',
                  opacity: 1,
                },
              }}
              inputProps={{
                maxLength: 500,
              }}
            />
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="caption" color="text.secondary">
                {message.length} / 500 文字
              </Typography>
            </Box>
          </>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom sx={{ color: '#000' }}>
              メンテナンスモードをOFFにしますか？
            </Typography>
            <Typography variant="body2" sx={{ color: '#333' }}>
              すべてのユーザーがサービスにアクセスできるようになります。
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            minWidth: 100,
            color: '#333333',
            borderColor: 'divider',
          }}
        >
          キャンセル
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={willBeActive ? 'error' : 'primary'}
          sx={{
            minWidth: 100,
          }}
        >
          {willBeActive ? 'ONにする' : 'OFFにする'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaintenanceConfirmDialog;
