import { createTheme, alpha } from '@mui/material/styles';

// VS Code風のダークテーマ - 細部までこだわった洗練されたデザイン
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0078D4',
      light: '#1a8cff',
      dark: '#005a9e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6B6B6B',
      light: '#8E8E8E',
      dark: '#4A4A4A',
    },
    background: {
      default: '#1E1E1E',
      paper: '#252526',
    },
    text: {
      primary: '#CCCCCC',
      secondary: '#858585',
      disabled: '#5A5A5A',
    },
    error: {
      main: '#F14C4C',
      light: '#FF6B6B',
      dark: '#D32F2F',
    },
    warning: {
      main: '#CCA700',
      light: '#FFCD39',
      dark: '#997A00',
    },
    success: {
      main: '#89D185',
      light: '#A8E6A3',
      dark: '#4CAF50',
    },
    info: {
      main: '#3794FF',
      light: '#75BEFF',
      dark: '#0066CC',
    },
    divider: '#404040',
    action: {
      hover: 'rgba(255, 255, 255, 0.05)',
      selected: 'rgba(255, 255, 255, 0.08)',
      active: 'rgba(255, 255, 255, 0.12)',
      focus: 'rgba(0, 120, 212, 0.3)',
    },
  },
  typography: {
    fontFamily: [
      '"Segoe UI"',
      '-apple-system',
      'BlinkMacSystemFont',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    fontSize: 13,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.005em',
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '0.875rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '0.8125rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.6875rem',
      lineHeight: 1.4,
    },
    button: {
      fontSize: '0.8125rem',
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 4,
  },
  shadows: [
    'none',
    '0 1px 2px rgba(0, 0, 0, 0.3)',
    '0 2px 4px rgba(0, 0, 0, 0.3)',
    '0 4px 8px rgba(0, 0, 0, 0.3)',
    '0 6px 12px rgba(0, 0, 0, 0.3)',
    '0 8px 16px rgba(0, 0, 0, 0.3)',
    '0 12px 24px rgba(0, 0, 0, 0.3)',
    '0 16px 32px rgba(0, 0, 0, 0.3)',
    '0 20px 40px rgba(0, 0, 0, 0.3)',
    '0 24px 48px rgba(0, 0, 0, 0.3)',
    '0 28px 56px rgba(0, 0, 0, 0.3)',
    '0 32px 64px rgba(0, 0, 0, 0.3)',
    '0 36px 72px rgba(0, 0, 0, 0.3)',
    '0 40px 80px rgba(0, 0, 0, 0.3)',
    '0 44px 88px rgba(0, 0, 0, 0.3)',
    '0 48px 96px rgba(0, 0, 0, 0.3)',
    '0 52px 104px rgba(0, 0, 0, 0.3)',
    '0 56px 112px rgba(0, 0, 0, 0.3)',
    '0 60px 120px rgba(0, 0, 0, 0.3)',
    '0 64px 128px rgba(0, 0, 0, 0.3)',
    '0 68px 136px rgba(0, 0, 0, 0.3)',
    '0 72px 144px rgba(0, 0, 0, 0.3)',
    '0 76px 152px rgba(0, 0, 0, 0.3)',
    '0 80px 160px rgba(0, 0, 0, 0.3)',
    '0 84px 168px rgba(0, 0, 0, 0.3)',
  ],
  transitions: {
    duration: {
      shortest: 100,
      shorter: 150,
      short: 200,
      standard: 250,
      complex: 300,
      enteringScreen: 200,
      leavingScreen: 150,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        body: {
          scrollbarColor: '#5A5A5A #2B2B2B',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: '12px',
            height: '12px',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            backgroundColor: '#5A5A5A',
            borderRadius: '6px',
            border: '3px solid transparent',
            backgroundClip: 'padding-box',
            '&:hover': {
              backgroundColor: '#6E6E6E',
            },
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
            backgroundColor: 'transparent',
          },
        },
        '::selection': {
          backgroundColor: alpha('#0078D4', 0.4),
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '4px',
          fontWeight: 400,
          transition: 'all 0.15s ease-in-out',
          '&:focus-visible': {
            outline: '1px solid #007ACC',
            outlineOffset: '2px',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          '&:focus-visible': {
            outline: '1px solid #007ACC',
            outlineOffset: '1px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'box-shadow 0.2s ease-in-out',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        },
        elevation2: {
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
        },
        elevation3: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#323233',
          boxShadow: 'none',
          borderBottom: '1px solid #3C3C3C',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#2D2D2D',
          border: '1px solid #454545',
          borderRadius: '6px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          marginTop: '2px',
        },
        list: {
          padding: '4px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          margin: '1px 0',
          padding: '6px 12px',
          minHeight: '32px',
          fontSize: '0.8125rem',
          transition: 'background-color 0.1s ease',
          '&:hover': {
            backgroundColor: '#094771',
          },
          '&.Mui-selected': {
            backgroundColor: '#094771',
            '&:hover': {
              backgroundColor: '#0a5a8a',
            },
          },
          '&.Mui-focusVisible': {
            backgroundColor: '#094771',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: '28px',
          color: '#CCCCCC',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.8125rem',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#454545',
          margin: '4px 8px',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#383838',
          border: '1px solid #454545',
          borderRadius: '4px',
          fontSize: '0.75rem',
          padding: '4px 8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
        },
        arrow: {
          color: '#383838',
          '&::before': {
            border: '1px solid #454545',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: '35px',
          fontSize: '0.8125rem',
          fontWeight: 400,
          transition: 'all 0.15s ease',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '0',
          transition: 'background-color 0.1s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 120, 212, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(0, 120, 212, 0.25)',
            },
          },
        },
      },
    },
    MuiCollapse: {
      styleOverrides: {
        root: {
          transition: 'height 0.15s ease-out',
        },
      },
    },
  },
});
