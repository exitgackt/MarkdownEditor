import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
} from '@mui/material';

interface UserInvitationDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (emails: string[]) => { success: boolean; message: string };
}

const UserInvitationDialog = ({
  open,
  onClose,
  onSend,
}: UserInvitationDialogProps) => {
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim();

    if (!trimmedEmail) {
      setError('メールアドレスを入力してください');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    if (emails.includes(trimmedEmail)) {
      setError('このメールアドレスは既に追加されています');
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setEmailInput('');
    setError('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');

    // カンマまたは改行で分割
    const emailList = pastedText
      .split(/[,\n]/)
      .map((email) => email.trim())
      .filter((email) => email);

    const validEmails: string[] = [];
    const invalidEmails: string[] = [];

    emailList.forEach((email) => {
      if (validateEmail(email) && !emails.includes(email)) {
        validEmails.push(email);
      } else {
        invalidEmails.push(email);
      }
    });

    if (validEmails.length > 0) {
      setEmails([...emails, ...validEmails]);
    }

    if (invalidEmails.length > 0) {
      setError(`無効なメールアドレス: ${invalidEmails.join(', ')}`);
    } else {
      setError('');
    }
  };

  const handleSend = () => {
    if (emails.length === 0) {
      setError('少なくとも1つのメールアドレスを追加してください');
      return;
    }

    const result = onSend(emails);

    if (result.success) {
      setSuccessMessage(result.message);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  const handleClose = () => {
    setEmailInput('');
    setEmails([]);
    setError('');
    setSuccessMessage('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>ユーザーを招待</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" gutterBottom>
            招待するユーザーのメールアドレスを入力してください
          </Typography>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            複数のメールアドレスをカンマ区切りで貼り付けることもできます
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mt: 2, mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="メールアドレス"
              placeholder="user@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
            />
            <Button
              variant="outlined"
              onClick={handleAddEmail}
              disabled={!emailInput.trim()}
            >
              追加
            </Button>
          </Box>

          {/* 追加されたメールアドレス一覧 */}
          {emails.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                招待するユーザー ({emails.length}名)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {emails.map((email) => (
                  <Chip
                    key={email}
                    label={email}
                    onDelete={() => handleRemoveEmail(email)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              招待されたユーザーには招待メールが送信されます。招待は7日間有効です。
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>キャンセル</Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={emails.length === 0 || !!successMessage}
        >
          招待を送信
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserInvitationDialog;
