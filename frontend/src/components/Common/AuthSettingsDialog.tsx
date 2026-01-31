import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
} from '@mui/material';
import type { AuthMethodSettings } from '../../types';

export interface AuthSettingsDialogProps {
  open: boolean;
  initialSettings: AuthMethodSettings;
  onClose: () => void;
  onSave: (settings: AuthMethodSettings) => Promise<boolean>;
}

const AuthSettingsDialog = ({
  open,
  initialSettings,
  onClose,
  onSave,
}: AuthSettingsDialogProps) => {
  const [settings, setSettings] = useState<AuthMethodSettings>(initialSettings);

  useEffect(() => {
    if (open) {
      setSettings(initialSettings);
    }
  }, [open, initialSettings]);

  const handleSave = async () => {
    const success = await onSave(settings);
    if (success) {
      onClose();
    }
  };

  const handleCancel = () => {
    setSettings(initialSettings);
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
        認証方式の編集
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mt: 2 }}>
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <FormLabel component="legend" sx={{ color: '#000', mb: 1 }}>
              有効な認証方式
            </FormLabel>
            <RadioGroup
              value={settings.mode}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  mode: e.target.value as 'email' | 'google' | 'both',
                })
              }
            >
              <FormControlLabel
                value="email"
                control={<Radio />}
                label="メール・パスワードのみ (推奨: 初期設定)"
                sx={{ color: '#000' }}
              />
              <FormControlLabel
                value="google"
                control={<Radio />}
                label="Google認証のみ"
                sx={{ color: '#000' }}
              />
              <FormControlLabel
                value="both"
                control={<Radio />}
                label="両方"
                sx={{ color: '#000' }}
              />
            </RadioGroup>
          </FormControl>

          <FormLabel component="legend" sx={{ color: '#000', mb: 2, display: 'block' }}>
            パスワードポリシー
          </FormLabel>

          <TextField
            fullWidth
            label="最小文字数"
            type="number"
            value={settings.password_min_length}
            onChange={(e) =>
              setSettings({
                ...settings,
                password_min_length: Number(e.target.value),
              })
            }
            inputProps={{ min: 6, max: 128 }}
            sx={{
              mb: 2,
              bgcolor: 'white',
              '& .MuiInputBase-input': {
                color: '#000',
              },
            }}
          />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.password_require_uppercase}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      password_require_uppercase: e.target.checked,
                    })
                  }
                />
              }
              label="大文字必須"
              sx={{ color: '#000' }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.password_require_lowercase}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      password_require_lowercase: e.target.checked,
                    })
                  }
                />
              }
              label="小文字必須"
              sx={{ color: '#000' }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.password_require_number}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      password_require_number: e.target.checked,
                    })
                  }
                />
              }
              label="数字必須"
              sx={{ color: '#000' }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.password_require_special}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      password_require_special: e.target.checked,
                    })
                  }
                />
              }
              label="特殊文字必須"
              sx={{ color: '#000' }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.email_verification_required}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email_verification_required: e.target.checked,
                    })
                  }
                />
              }
              label="メール検証必須"
              sx={{ color: '#000' }}
            />
          </Box>
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

export default AuthSettingsDialog;
