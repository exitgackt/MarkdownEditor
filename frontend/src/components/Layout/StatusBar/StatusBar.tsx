import { Box, Typography, Tooltip, keyframes } from '@mui/material';
import {
  Error,
  Warning,
  Sync,
} from '@mui/icons-material';

// スピンアニメーション
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

interface StatusBarProps {
  line?: number;
  column?: number;
  encoding?: string;
  lineEnding?: 'LF' | 'CRLF';
  language?: string;
  isDirty?: boolean;
  isSaving?: boolean;
  errorCount?: number;
  warningCount?: number;
}

// ステータスアイテムのスタイル
const statusItemSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  px: 1,
  py: 0.25,
  borderRadius: '3px',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
  '&:hover': {
    bgcolor: 'rgba(255, 255, 255, 0.1)',
  },
};

const StatusBar = ({
  line = 1,
  column = 1,
  encoding = 'UTF-8',
  lineEnding = 'LF',
  language = 'Markdown',
  isDirty = false,
  isSaving = false,
  errorCount = 0,
  warningCount = 0,
}: StatusBarProps) => {
  return (
    <Box
      sx={{
        height: 24,
        bgcolor: '#007ACC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 0.5,
        flexShrink: 0,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* 左側のステータス */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        {/* エラー/警告カウント（エラーまたは警告がある場合のみ表示） */}
        {(errorCount > 0 || warningCount > 0) && (
          <Tooltip title={`エラー: ${errorCount}, 警告: ${warningCount}`} arrow>
            <Box sx={statusItemSx}>
              {errorCount > 0 && (
                <>
                  <Error sx={{ fontSize: 14, color: '#fff' }} />
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.6875rem', color: '#fff', fontWeight: 500 }}
                  >
                    {errorCount}
                  </Typography>
                </>
              )}
              {warningCount > 0 && (
                <>
                  <Warning sx={{ fontSize: 14, color: '#fff', ml: errorCount > 0 ? 0.5 : 0 }} />
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.6875rem', color: '#fff', fontWeight: 500 }}
                  >
                    {warningCount}
                  </Typography>
                </>
              )}
            </Box>
          </Tooltip>
        )}

        {/* 保存状態 */}
        {isSaving && (
          <Box sx={{ ...statusItemSx, cursor: 'default' }}>
            <Sync
              sx={{
                fontSize: 14,
                color: '#fff',
                animation: `${spin} 1s linear infinite`,
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontSize: '0.6875rem', color: '#fff' }}
            >
              保存中...
            </Typography>
          </Box>
        )}
        {isDirty && !isSaving && (
          <Box sx={{ ...statusItemSx, cursor: 'default' }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#fff',
                opacity: 0.9,
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontSize: '0.6875rem', color: '#fff' }}
            >
              未保存
            </Typography>
          </Box>
        )}
      </Box>

      {/* 右側のステータス */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        {/* カーソル位置 */}
        <Tooltip title="カーソル位置に移動" arrow>
          <Box sx={statusItemSx}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6875rem',
                color: '#fff',
                fontFamily: '"SF Mono", "Consolas", monospace',
              }}
            >
              行 {line}, 列 {column}
            </Typography>
          </Box>
        </Tooltip>

        {/* エンコーディング */}
        <Tooltip title="エンコーディングを変更" arrow>
          <Box sx={statusItemSx}>
            <Typography
              variant="caption"
              sx={{ fontSize: '0.6875rem', color: '#fff' }}
            >
              {encoding}
            </Typography>
          </Box>
        </Tooltip>

        {/* 改行コード */}
        <Tooltip title="改行コードを変更" arrow>
          <Box sx={statusItemSx}>
            <Typography
              variant="caption"
              sx={{ fontSize: '0.6875rem', color: '#fff' }}
            >
              {lineEnding}
            </Typography>
          </Box>
        </Tooltip>

        {/* 言語モード */}
        <Tooltip title="言語モードを選択" arrow>
          <Box sx={statusItemSx}>
            <Typography
              variant="caption"
              sx={{ fontSize: '0.6875rem', color: '#fff' }}
            >
              {language}
            </Typography>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default StatusBar;
