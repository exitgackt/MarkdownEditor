import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ReplaceDialogProps {
  open: boolean;
  onClose: () => void;
  onFindNext: (options: ReplaceOptions) => void;
  onFindPrevious: (options: ReplaceOptions) => void;
  onReplace: (options: ReplaceOptions) => void;
  onReplaceAll: (options: ReplaceOptions) => number;
  initialSearchText?: string;
}

export interface ReplaceOptions {
  searchText: string;
  replaceText: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  showNotFoundMessage: boolean;
}

const ReplaceDialog = ({
  open,
  onClose,
  onFindNext,
  onFindPrevious,
  onReplace,
  onReplaceAll,
  initialSearchText = '',
}: ReplaceDialogProps) => {
  const [searchText, setSearchText] = useState(initialSearchText);
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [showNotFoundMessage, setShowNotFoundMessage] = useState(true);
  const [autoClose, setAutoClose] = useState(false);
  const [wrapAround, setWrapAround] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ドラッグ用の状態
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // ダイアログが閉じたときに位置をリセット
  useEffect(() => {
    if (!open) {
      setPosition(null);
    }
  }, [open]);

  // ドラッグ開始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    const dialog = (e.target as HTMLElement).closest('.MuiDialog-paper') as HTMLElement;
    if (dialog) {
      const rect = dialog.getBoundingClientRect();
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position?.x ?? rect.left,
        posY: position?.y ?? rect.top,
      };
    }
  }, [position]);

  // ドラッグ中
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      setPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // ダイアログが開いたときに入力欄にフォーカス
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 100);
    }
  }, [open]);

  // 初期検索テキストが変わったら更新
  useEffect(() => {
    if (initialSearchText) {
      setSearchText(initialSearchText);
    }
  }, [initialSearchText]);

  const getReplaceOptions = useCallback((): ReplaceOptions => ({
    searchText,
    replaceText,
    caseSensitive,
    wholeWord,
    useRegex,
    showNotFoundMessage,
  }), [searchText, replaceText, caseSensitive, wholeWord, useRegex, showNotFoundMessage]);

  const handleFindNext = useCallback(() => {
    if (searchText) {
      onFindNext(getReplaceOptions());
      if (autoClose) {
        onClose();
      }
    }
  }, [searchText, onFindNext, getReplaceOptions, autoClose, onClose]);

  const handleFindPrevious = useCallback(() => {
    if (searchText) {
      onFindPrevious(getReplaceOptions());
      if (autoClose) {
        onClose();
      }
    }
  }, [searchText, onFindPrevious, getReplaceOptions, autoClose, onClose]);

  const handleReplace = useCallback(() => {
    if (searchText) {
      onReplace(getReplaceOptions());
    }
  }, [searchText, onReplace, getReplaceOptions]);

  const handleReplaceAll = useCallback(() => {
    if (searchText) {
      onReplaceAll(getReplaceOptions());
    }
  }, [searchText, onReplaceAll, getReplaceOptions]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handleFindPrevious();
      } else {
        handleFindNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleFindNext, handleFindPrevious, onClose]);

  // ボタンのスタイル
  const buttonSx = {
    width: 110,
    height: 23,
    fontSize: '12px',
    color: '#000',
    borderColor: '#adadad',
    bgcolor: '#f0f0f0',
    textTransform: 'none',
    '&:hover': {
      bgcolor: '#c7e0f4',
      borderColor: '#0078d4',
    },
    '&.Mui-disabled': {
      color: '#999',
      borderColor: '#ccc',
    },
  };

  // チェックボックスのスタイル
  const checkboxLabelSx = {
    m: 0,
    height: 22,
    '& .MuiFormControlLabel-label': {
      fontSize: '12px',
      color: '#000',
    },
  };

  const checkboxSx = {
    p: 0.25,
    mr: 0.5,
    '& .MuiSvgIcon-root': { fontSize: 16 },
  };

  // テキストフィールドのスタイル
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: '#fff',
      fontSize: '12px',
      borderRadius: 0,
      '& fieldset': {
        borderColor: '#7f9db9',
      },
      '&:hover fieldset': {
        borderColor: '#0078d4',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#0078d4',
        borderWidth: 1,
      },
    },
    '& .MuiOutlinedInput-input': {
      py: 0.5,
      px: 1,
      color: '#000',
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      hideBackdrop
      PaperProps={{
        sx: {
          width: 500,
          bgcolor: '#f0f0f0',
          borderRadius: '0px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          border: '1px solid #888',
          ...(position && {
            position: 'fixed',
            left: position.x,
            top: position.y,
            margin: 0,
            transform: 'none',
          }),
        },
      }}
    >
      <DialogTitle
        onMouseDown={handleMouseDown}
        sx={{
          bgcolor: '#f0f0f0',
          py: 0.25,
          px: 1,
          fontSize: '12px',
          fontWeight: 'normal',
          borderBottom: 'none',
          color: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 26,
          cursor: 'move',
          userSelect: 'none',
        }}
      >
        置換
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            p: 0.25,
            color: '#000',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1, pb: 1.5, px: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* 左側: 検索条件とオプション */}
          <Box sx={{ flex: 1 }}>
            {/* 置換前（検索文字列） */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box
                component="label"
                sx={{
                  fontSize: '12px',
                  color: '#000',
                  minWidth: 60,
                  flexShrink: 0,
                }}
              >
                置換前(N):
              </Box>
              <TextField
                inputRef={searchInputRef}
                fullWidth
                size="small"
                placeholder="検索"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                sx={textFieldSx}
              />
            </Box>

            {/* 置換後 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Box
                component="label"
                sx={{
                  fontSize: '12px',
                  color: '#000',
                  minWidth: 60,
                  flexShrink: 0,
                }}
              >
                置換後(P):
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="置換後"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                onKeyDown={handleKeyDown}
                sx={textFieldSx}
              />
            </Box>

            {/* オプション */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={wholeWord}
                    onChange={(e) => setWholeWord(e.target.checked)}
                    sx={checkboxSx}
                  />
                }
                label="単語単位で探す(W)"
                sx={checkboxLabelSx}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    sx={checkboxSx}
                  />
                }
                label="英大文字と小文字を区別する(C)"
                sx={checkboxLabelSx}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={useRegex}
                    onChange={(e) => setUseRegex(e.target.checked)}
                    sx={checkboxSx}
                  />
                }
                label="正規表現(E)"
                sx={checkboxLabelSx}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={showNotFoundMessage}
                    onChange={(e) => setShowNotFoundMessage(e.target.checked)}
                    sx={checkboxSx}
                  />
                }
                label="見つからないときにメッセージを表示(M)"
                sx={checkboxLabelSx}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={autoClose}
                    onChange={(e) => setAutoClose(e.target.checked)}
                    sx={checkboxSx}
                  />
                }
                label="置換ダイアログを自動的に閉じる(L)"
                sx={checkboxLabelSx}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={wrapAround}
                    onChange={(e) => setWrapAround(e.target.checked)}
                    sx={checkboxSx}
                  />
                }
                label="先頭(末尾)から再検索する(Z)"
                sx={checkboxLabelSx}
              />
            </Box>
          </Box>

          {/* 右側: ボタン */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, pt: 0.5 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleFindPrevious}
              disabled={!searchText}
              sx={buttonSx}
            >
              上検索(U)
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleFindNext}
              disabled={!searchText}
              sx={buttonSx}
            >
              下検索(D)
            </Button>
            <Box sx={{ height: 4 }} />
            <Button
              variant="outlined"
              size="small"
              onClick={handleReplace}
              disabled={!searchText}
              sx={buttonSx}
            >
              置換(R)
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleReplaceAll}
              disabled={!searchText}
              sx={{
                ...buttonSx,
                borderColor: '#0078d4',
                borderWidth: 2,
                '&:hover': {
                  bgcolor: '#c7e0f4',
                  borderColor: '#0078d4',
                  borderWidth: 2,
                },
              }}
            >
              すべて置換(A)
            </Button>
            <Box sx={{ height: 4 }} />
            <Button
              variant="outlined"
              size="small"
              onClick={onClose}
              sx={buttonSx}
            >
              キャンセル(X)
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ReplaceDialog;
