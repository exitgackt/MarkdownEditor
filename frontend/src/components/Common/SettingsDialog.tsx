import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import { useSettingsStore } from '../../stores';
import type { ColorTheme, WordWrap, LineNumbers } from '../../stores';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SettingsDialog = ({ open, onClose }: SettingsDialogProps) => {
  const {
    fontSize,
    wordWrap,
    minimap,
    lineNumbers,
    colorTheme,
    setFontSize,
    setWordWrap,
    setMinimap,
    setLineNumbers,
    setColorTheme,
    resetToDefaults,
  } = useSettingsStore();

  const handleFontSizeChange = (_: Event, value: number | number[]) => {
    setFontSize(value as number);
  };

  const handleWordWrapChange = (event: { target: { value: string } }) => {
    setWordWrap(event.target.value as WordWrap);
  };

  const handleMinimapChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMinimap(event.target.checked);
  };

  const handleLineNumbersChange = (event: { target: { value: string } }) => {
    setLineNumbers(event.target.value as LineNumbers);
  };

  const handleColorThemeChange = (event: { target: { value: string } }) => {
    const newTheme = event.target.value as ColorTheme;
    console.log('[SettingsDialog] テーマを変更します:', colorTheme, '→', newTheme);
    setColorTheme(newTheme);
    console.log('[SettingsDialog] setColorTheme を呼び出しました');
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 450,
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
        設定
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
        {/* エディタ設定セクション */}
        <Typography
          variant="subtitle2"
          sx={{ color: '#0078d4', mb: 2, fontWeight: 600 }}
        >
          エディタ設定
        </Typography>

        {/* フォントサイズ */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            sx={{ color: '#fff', mb: 1, fontSize: '13px' }}
          >
            フォントサイズ: {fontSize}px
          </Typography>
          <Slider
            value={fontSize}
            onChange={handleFontSizeChange}
            min={10}
            max={24}
            step={1}
            marks={[
              { value: 10, label: '10' },
              { value: 14, label: '14' },
              { value: 18, label: '18' },
              { value: 24, label: '24' },
            ]}
            sx={{
              color: '#0078d4',
              '& .MuiSlider-markLabel': {
                color: '#fff',
                fontSize: '11px',
              },
            }}
          />
        </Box>

        {/* 折り返し */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel
              sx={{
                color: '#fff',
                '&.MuiInputLabel-shrink': { color: '#fff' },
                '&.Mui-focused': { color: '#0078d4' },
              }}
            >
              折り返し
            </InputLabel>
            <Select
              value={wordWrap}
              onChange={handleWordWrapChange}
              label="折り返し"
              sx={{
                color: '#fff',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: '#555',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#777',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#0078d4',
                },
                '.MuiSvgIcon-root': {
                  color: '#ccc',
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#2D2D2D',
                    '& .MuiMenuItem-root': {
                      color: '#fff',
                      '&:hover': {
                        bgcolor: '#3C3C3C',
                      },
                      '&.Mui-selected': {
                        bgcolor: '#0078d4',
                        '&:hover': {
                          bgcolor: '#0078d4',
                        },
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="on">ON（ウィンドウ幅で折り返し）</MenuItem>
              <MenuItem value="off">OFF（折り返さない）</MenuItem>
              <MenuItem value="wordWrapColumn">指定カラムで折り返し</MenuItem>
              <MenuItem value="bounded">最小幅で折り返し</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* ミニマップ */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={minimap}
                onChange={handleMinimapChange}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#0078d4',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#0078d4',
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: '#fff', fontSize: '13px' }}>
                ミニマップを表示
              </Typography>
            }
          />
        </Box>

        {/* 行番号 */}
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel
              sx={{
                color: '#fff',
                '&.MuiInputLabel-shrink': { color: '#fff' },
                '&.Mui-focused': { color: '#0078d4' },
              }}
            >
              行番号
            </InputLabel>
            <Select
              value={lineNumbers}
              onChange={handleLineNumbersChange}
              label="行番号"
              sx={{
                color: '#fff',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: '#555',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#777',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#0078d4',
                },
                '.MuiSvgIcon-root': {
                  color: '#ccc',
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#2D2D2D',
                    '& .MuiMenuItem-root': {
                      color: '#fff',
                      '&:hover': {
                        bgcolor: '#3C3C3C',
                      },
                      '&.Mui-selected': {
                        bgcolor: '#0078d4',
                        '&:hover': {
                          bgcolor: '#0078d4',
                        },
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="on">ON（通常）</MenuItem>
              <MenuItem value="off">OFF（非表示）</MenuItem>
              <MenuItem value="relative">相対行番号</MenuItem>
              <MenuItem value="interval">間隔表示</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ borderColor: '#3C3C3C', my: 2 }} />

        {/* テーマ設定セクション */}
        <Typography
          variant="subtitle2"
          sx={{ color: '#0078d4', mb: 2, fontWeight: 600 }}
        >
          テーマ設定
        </Typography>

        {/* カラーテーマ */}
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel
              sx={{
                color: '#fff',
                '&.MuiInputLabel-shrink': { color: '#fff' },
                '&.Mui-focused': { color: '#0078d4' },
              }}
            >
              カラーテーマ
            </InputLabel>
            <Select
              value={colorTheme}
              onChange={handleColorThemeChange}
              label="カラーテーマ"
              sx={{
                color: '#fff',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: '#555',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#777',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#0078d4',
                },
                '.MuiSvgIcon-root': {
                  color: '#ccc',
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#2D2D2D',
                    '& .MuiMenuItem-root': {
                      color: '#fff',
                      '&:hover': {
                        bgcolor: '#3C3C3C',
                      },
                      '&.Mui-selected': {
                        bgcolor: '#0078d4',
                        '&:hover': {
                          bgcolor: '#0078d4',
                        },
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="vs-dark">ダーク</MenuItem>
              <MenuItem value="vs-light">ライト</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          px: 2,
          pb: 2,
          pt: 1,
          justifyContent: 'space-between',
          borderTop: '1px solid #3C3C3C',
        }}
      >
        <Button
          variant="text"
          size="small"
          onClick={handleResetToDefaults}
          sx={{
            color: '#fff',
            fontSize: '12px',
            textTransform: 'none',
            '&:hover': {
              color: '#fff',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          デフォルトに戻す
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={onClose}
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
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
