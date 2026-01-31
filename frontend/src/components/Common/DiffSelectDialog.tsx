import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';

interface Tab {
  id: string;
  fileName: string;
  filePath: string;
}

interface DiffSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onCompare: (leftTabId: string, rightTabId: string) => void;
  tabs: Tab[];
}

const DiffSelectDialog = ({
  open,
  onClose,
  onCompare,
  tabs,
}: DiffSelectDialogProps) => {
  const [originalFile, setOriginalFile] = useState('');
  const [modifiedFile, setModifiedFile] = useState('');

  // ダイアログが開いた時に初期値を設定
  useEffect(() => {
    if (open && tabs.length >= 2) {
      setOriginalFile(tabs[0].fileName);
      setModifiedFile(tabs[1].fileName);
    } else if (open && tabs.length === 1) {
      setOriginalFile(tabs[0].fileName);
      setModifiedFile(tabs[0].fileName);
    }
  }, [open, tabs]);

  const handleCompare = () => {
    const leftTab = tabs.find((t) => t.fileName === originalFile);
    const rightTab = tabs.find((t) => t.fileName === modifiedFile);

    if (leftTab && rightTab) {
      onCompare(leftTab.id, rightTab.id);
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      className="diff-select-dialog"
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#2D2D2D',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
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
        差分比較ファイル選択
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
        {tabs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            比較するファイルがありません。<br />
            ファイルを開いてから差分比較を実行してください。
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 比較元ファイル */}
            <FormControl fullWidth>
              <InputLabel
                id="original-file-label"
                sx={{
                  color: 'text.secondary',
                  '&.Mui-focused': { color: '#0078d4' },
                }}
              >
                比較元ファイル
              </InputLabel>
              <Select
                labelId="original-file-label"
                name="originalFile"
                value={originalFile}
                onChange={(e) => setOriginalFile(e.target.value)}
                label="比較元ファイル"
                sx={{
                  bgcolor: '#1E1E1E',
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3C3C3C',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0078d4',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0078d4',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#fff',
                  },
                }}
              >
                {tabs.map((tab) => (
                  <MenuItem
                    key={tab.id}
                    value={tab.fileName}
                    sx={{
                      bgcolor: '#2D2D2D',
                      color: '#fff',
                      '&:hover': { bgcolor: '#3C3C3C' },
                      '&.Mui-selected': {
                        bgcolor: '#0078d4',
                        '&:hover': { bgcolor: '#005a9e' },
                      },
                    }}
                  >
                    {tab.fileName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 比較先ファイル */}
            <FormControl fullWidth>
              <InputLabel
                id="modified-file-label"
                sx={{
                  color: 'text.secondary',
                  '&.Mui-focused': { color: '#0078d4' },
                }}
              >
                比較先ファイル
              </InputLabel>
              <Select
                labelId="modified-file-label"
                name="modifiedFile"
                value={modifiedFile}
                onChange={(e) => setModifiedFile(e.target.value)}
                label="比較先ファイル"
                sx={{
                  bgcolor: '#1E1E1E',
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3C3C3C',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0078d4',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0078d4',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#fff',
                  },
                }}
              >
                {tabs.map((tab) => (
                  <MenuItem
                    key={tab.id}
                    value={tab.fileName}
                    sx={{
                      bgcolor: '#2D2D2D',
                      color: '#fff',
                      '&:hover': { bgcolor: '#3C3C3C' },
                      '&.Mui-selected': {
                        bgcolor: '#0078d4',
                        '&:hover': { bgcolor: '#005a9e' },
                      },
                    }}
                  >
                    {tab.fileName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          pt: 1,
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          sx={{
            color: 'text.secondary',
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
          }}
        >
          キャンセル
        </Button>
        <Button
          onClick={handleCompare}
          disabled={tabs.length === 0}
          variant="contained"
          sx={{
            bgcolor: '#0078d4',
            color: '#fff',
            textTransform: 'none',
            '&:hover': { bgcolor: '#005a9e' },
            '&.Mui-disabled': {
              bgcolor: '#3C3C3C',
              color: '#666',
            },
          }}
        >
          比較
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiffSelectDialog;
