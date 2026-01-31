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
import { useState, useEffect } from 'react';

export interface VersionEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (version: string, releaseDate: string, releaseNotes: string) => void;
  currentVersion?: string;
  currentReleaseDate?: string;
  currentReleaseNotes?: string;
}

const VersionEditDialog = ({
  open,
  onClose,
  onSave,
  currentVersion = '',
  currentReleaseDate = '',
  currentReleaseNotes = '',
}: VersionEditDialogProps) => {
  const [version, setVersion] = useState(currentVersion);
  const [releaseDate, setReleaseDate] = useState(currentReleaseDate);
  const [releaseNotes, setReleaseNotes] = useState(currentReleaseNotes);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      setVersion(currentVersion);
      setReleaseDate(currentReleaseDate || new Date().toISOString().split('T')[0]);
      setReleaseNotes(currentReleaseNotes);
      setError('');
    }
  }, [open, currentVersion, currentReleaseDate, currentReleaseNotes]);

  const handleSave = () => {
    // バリデーション
    if (!version.trim()) {
      setError('バージョン番号を入力してください');
      return;
    }

    if (!releaseDate.trim()) {
      setError('リリース日を入力してください');
      return;
    }

    if (!releaseNotes.trim()) {
      setError('リリースノートを入力してください');
      return;
    }

    // バージョン番号の形式チェック（例: 1.0.0）
    const versionPattern = /^\d+\.\d+\.\d+$/;
    if (!versionPattern.test(version.trim())) {
      setError('バージョン番号は "1.0.0" の形式で入力してください');
      return;
    }

    onSave(version.trim(), releaseDate.trim(), releaseNotes.trim());
    onClose();
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#2D2D2D',
          borderRadius: '8px',
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#1E1E1E',
          py: 1.5,
          px: 2,
          fontSize: '14px',
          fontWeight: 500,
          borderBottom: '1px solid #3C3C3C',
          color: '#fff',
        }}
      >
        バージョン情報の編集
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
        {error && (
          <Typography
            variant="body2"
            sx={{ color: '#f44336', mb: 2, fontSize: '13px' }}
          >
            {error}
          </Typography>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            sx={{ color: '#ccc', mb: 1, fontSize: '13px' }}
          >
            バージョン番号 *
          </Typography>
          <TextField
            fullWidth
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0.0"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                bgcolor: '#1E1E1E',
                '& fieldset': {
                  borderColor: '#555',
                },
                '&:hover fieldset': {
                  borderColor: '#777',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0078d4',
                },
              },
            }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            sx={{ color: '#ccc', mb: 1, fontSize: '13px' }}
          >
            リリース日 *
          </Typography>
          <TextField
            fullWidth
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                bgcolor: '#1E1E1E',
                '& fieldset': {
                  borderColor: '#555',
                },
                '&:hover fieldset': {
                  borderColor: '#777',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0078d4',
                },
              },
            }}
          />
        </Box>

        <Box>
          <Typography
            variant="body2"
            sx={{ color: '#ccc', mb: 1, fontSize: '13px' }}
          >
            リリースノート *
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            placeholder="バージョンの変更内容を記載してください"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                bgcolor: '#1E1E1E',
                '& fieldset': {
                  borderColor: '#555',
                },
                '&:hover fieldset': {
                  borderColor: '#777',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0078d4',
                },
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          px: 2,
          pb: 2,
          pt: 1,
          borderTop: '1px solid #3C3C3C',
        }}
      >
        <Button
          onClick={handleClose}
          size="small"
          sx={{
            color: '#888',
            fontSize: '12px',
            textTransform: 'none',
            '&:hover': {
              color: '#ccc',
              bgcolor: 'transparent',
            },
          }}
        >
          キャンセル
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          size="small"
          sx={{
            minWidth: 80,
            height: 30,
            fontSize: '12px',
            bgcolor: '#0078d4',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#106ebe',
            },
          }}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionEditDialog;
