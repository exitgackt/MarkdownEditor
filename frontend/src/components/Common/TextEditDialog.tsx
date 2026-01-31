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

export interface TextEditDialogProps {
  open: boolean;
  title: string;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
  maxLength?: number;
}

const TextEditDialog = ({
  open,
  title,
  initialValue,
  onClose,
  onSave,
  maxLength = 10000,
}: TextEditDialogProps) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [open, initialValue]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const handleCancel = () => {
    setValue(initialValue);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      disableScrollLock={true}
      PaperProps={{
        sx: {
          bgcolor: '#f0f0f0',
          minHeight: '500px',
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
        {title}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <TextField
          multiline
          fullWidth
          rows={15}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="内容を入力してください"
          sx={{
            mt: 2,
            bgcolor: 'white',
            '& .MuiOutlinedInput-root': {
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#000',
            },
            '& .MuiInputBase-input': {
              color: '#000',
            },
          }}
          inputProps={{
            maxLength,
          }}
        />
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant="caption" color="text.secondary">
            {value.length} / {maxLength} 文字
          </Typography>
        </Box>
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
          onClick={handleSave}
          variant="contained"
          sx={{
            minWidth: 100,
            bgcolor: '#0078d4',
            '&:hover': {
              bgcolor: '#006cbd',
            },
          }}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TextEditDialog;
