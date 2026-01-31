import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Divider,
} from '@mui/material';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string;
  description: string;
}

interface ShortcutCategory {
  category: string;
  shortcuts: Shortcut[];
}

const KeyboardShortcutsDialog = ({ open, onClose }: KeyboardShortcutsDialogProps) => {
  const shortcutCategories: ShortcutCategory[] = [
    {
      category: 'ファイル操作',
      shortcuts: [
        { keys: 'Alt+N', description: '新規ファイル' },
        { keys: 'Alt+B', description: '新規フォルダー' },
        { keys: 'Alt+O', description: 'ファイルを開く' },
        { keys: 'Alt+U', description: 'フォルダを開く' },
        { keys: 'Alt+I', description: 'インポート' },
        { keys: 'Ctrl+S', description: '保存' },
        { keys: 'Alt+S', description: '名前を付けて保存' },
        { keys: 'Ctrl+Alt+S', description: 'すべて保存' },
        { keys: 'Alt+K', description: 'タブを閉じる' },
        { keys: 'Alt+J', description: '全てのタブを閉じる' },
        { keys: 'Alt+Z', description: '前のタブ' },
        { keys: 'Alt+X', description: '次のタブ' },
      ],
    },
    {
      category: '編集',
      shortcuts: [
        { keys: 'Ctrl+Z', description: '元に戻す' },
        { keys: 'Ctrl+Y', description: 'やり直し' },
        { keys: 'Ctrl+F', description: '検索' },
        { keys: 'Ctrl+R', description: '置換' },
        { keys: 'Ctrl+X', description: '切り取り' },
        { keys: 'Ctrl+C', description: 'コピー' },
        { keys: 'Ctrl+V', description: '貼り付け' },
        { keys: 'Ctrl+A', description: 'すべて選択' },
      ],
    },
    {
      category: '表示',
      shortcuts: [
        { keys: 'Alt+L', description: 'プレビュー切替' },
        { keys: 'Alt+M', description: 'マインドマップ切替' },
        { keys: 'Alt+G', description: '分割エディタ切替' },
        { keys: 'Alt+Y', description: '差分比較切替' },
      ],
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 600,
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
        キーボードショートカット
      </DialogTitle>
      <DialogContent sx={{ pt: 2, pb: 2, px: 2 }}>
        <Box>
          {shortcutCategories.map((category, index) => (
            <Box key={category.category} sx={{ mb: index < shortcutCategories.length - 1 ? 2 : 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#0078d4',
                  mb: 1,
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                {category.category}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {category.shortcuts.map((shortcut) => (
                      <TableRow
                        key={shortcut.keys}
                        sx={{
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.03)',
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            border: 'none',
                            color: '#fff',
                            fontSize: '12px',
                            py: 0.75,
                            px: 1,
                            width: '40%',
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              bgcolor: '#3C3C3C',
                              px: 1,
                              py: 0.5,
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              border: '1px solid #555',
                            }}
                          >
                            {shortcut.keys}
                          </Box>
                        </TableCell>
                        <TableCell
                          sx={{
                            border: 'none',
                            color: '#ccc',
                            fontSize: '12px',
                            py: 0.75,
                            px: 1,
                          }}
                        >
                          {shortcut.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {index < shortcutCategories.length - 1 && (
                <Divider sx={{ borderColor: '#3C3C3C', mt: 1.5 }} />
              )}
            </Box>
          ))}
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

export default KeyboardShortcutsDialog;
