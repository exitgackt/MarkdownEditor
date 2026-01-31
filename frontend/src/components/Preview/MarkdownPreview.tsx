import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSettingsStore } from '../../stores';

interface MarkdownPreviewProps {
  content: string;
}

const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  const { colorTheme } = useSettingsStore();
  const isDark = colorTheme === 'vs-dark';

  return (
    <Box
      className="preview-panel"
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        bgcolor: isDark ? '#1E1E1E' : '#FFFFFF',
        color: isDark ? '#D4D4D4' : '#000000',
        p: 3,
        '&::-webkit-scrollbar': {
          width: 8,
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          borderRadius: 4,
          '&:hover': {
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
          },
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'transparent',
        },
        // Markdown スタイリング
        '& h1': {
          fontSize: '2rem',
          fontWeight: 600,
          borderBottom: isDark ? '1px solid #3C3C3C' : '1px solid #E0E0E0',
          pb: 1,
          mb: 2,
          mt: 0,
          color: isDark ? '#E0E0E0' : '#1A1A1A',
        },
        '& h2': {
          fontSize: '1.5rem',
          fontWeight: 600,
          borderBottom: isDark ? '1px solid #3C3C3C' : '1px solid #E0E0E0',
          pb: 0.5,
          mb: 2,
          mt: 3,
          color: isDark ? '#E0E0E0' : '#1A1A1A',
        },
        '& h3': {
          fontSize: '1.25rem',
          fontWeight: 600,
          mb: 1.5,
          mt: 2.5,
          color: isDark ? '#E0E0E0' : '#1A1A1A',
        },
        '& h4, & h5, & h6': {
          fontSize: '1rem',
          fontWeight: 600,
          mb: 1,
          mt: 2,
          color: isDark ? '#E0E0E0' : '#1A1A1A',
        },
        '& p': {
          mb: 2,
          lineHeight: 1.7,
        },
        '& a': {
          color: isDark ? '#4FC3F7' : '#0078D4',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
        '& code': {
          fontFamily: '"Fira Code", "Consolas", monospace',
          bgcolor: isDark ? '#2D2D2D' : '#F5F5F5',
          px: 0.75,
          py: 0.25,
          borderRadius: '4px',
          fontSize: '0.875em',
          color: isDark ? '#CE9178' : '#D73A49',
        },
        '& pre': {
          bgcolor: isDark ? '#2D2D2D' : '#F5F5F5',
          p: 2,
          borderRadius: '6px',
          overflow: 'auto',
          mb: 2,
          border: isDark ? '1px solid #3C3C3C' : '1px solid #E0E0E0',
          '& code': {
            bgcolor: 'transparent',
            p: 0,
            color: isDark ? '#D4D4D4' : '#24292E',
          },
        },
        '& blockquote': {
          borderLeft: '4px solid #007ACC',
          pl: 2,
          ml: 0,
          my: 2,
          color: isDark ? '#9E9E9E' : '#6A737D',
          fontStyle: 'italic',
        },
        '& ul, & ol': {
          pl: 3,
          mb: 2,
        },
        '& li': {
          mb: 0.5,
          lineHeight: 1.7,
        },
        '& ul li': {
          listStyleType: 'disc',
        },
        '& ol li': {
          listStyleType: 'decimal',
        },
        '& hr': {
          border: 'none',
          borderTop: isDark ? '1px solid #3C3C3C' : '1px solid #E0E0E0',
          my: 3,
        },
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          mb: 2,
        },
        '& th, & td': {
          border: isDark ? '1px solid #3C3C3C' : '1px solid #E0E0E0',
          p: 1,
          textAlign: 'left',
        },
        '& th': {
          bgcolor: isDark ? '#2D2D2D' : '#F5F5F5',
          fontWeight: 600,
        },
        '& tr:nth-of-type(even)': {
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
        },
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '4px',
        },
        // タスクリスト（GFM）
        '& input[type="checkbox"]': {
          mr: 1,
          accentColor: '#007ACC',
        },
        // インラインコードとの差別化
        '& :not(pre) > code': {
          bgcolor: isDark ? '#2D2D2D' : '#F5F5F5',
          color: isDark ? '#CE9178' : '#D73A49',
        },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownPreview;
