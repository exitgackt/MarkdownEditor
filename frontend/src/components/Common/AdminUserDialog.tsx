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
} from '@mui/material';

export interface AdminUserDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AdminUserDialog = ({ open, onClose, onAdd }: AdminUserDialogProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setEmail('');
      setError('');
    }
  }, [open]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAdd = async () => {
    // バリデーション
    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      return;
    }

    if (!validateEmail(email)) {
      setError('正しいメールアドレスの形式で入力してください');
      return;
    }

    // 追加実行
    const result = await onAdd(email);

    if (!result.success) {
      setError(result.error || '管理者の追加に失敗しました');
      return;
    }

    onClose();
  };

  const handleCancel = () => {
    setEmail('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      disableScrollLock={true}
      PaperProps={{
        sx: {
          bgcolor: '#f0f0f0',
          minHeight: '320px',
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#0078d4',
          color: 'white',
          py: 1.5,
        }}
      >
        管理者を追加
      </DialogTitle>

      <DialogContent sx={{ pt: 3, bgcolor: '#f0f0f0' }}>
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="body2" gutterBottom sx={{ color: '#000' }}>
            管理者として追加するユーザーのメールアドレスを入力してください
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="メールアドレス"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          error={!!error}
          helperText={error}
          placeholder="example@example.com"
          sx={{
            bgcolor: 'white',
            '& .MuiInputBase-input': {
              color: '#000',
            },
            '& .MuiFormHelperText-root': {
              bgcolor: '#f0f0f0',
              m: 0,
              px: 0,
              pt: 0.5,
            },
          }}
          autoFocus
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleCancel}
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
          onClick={handleAdd}
          variant="contained"
          sx={{
            minWidth: 100,
            bgcolor: '#0078d4',
            '&:hover': {
              bgcolor: '#006cbd',
            },
          }}
        >
          追加
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminUserDialog;
