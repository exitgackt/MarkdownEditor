import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useState, type RefObject, useEffect } from 'react';
import { PictureAsPdf, Code, Description, Image } from '@mui/icons-material';
import type { ExportFormat } from '../../services/exportService';
import type { MindmapViewRef } from '../Mindmap/MindmapView';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { useSettingsStore } from '../../stores';

type MindmapExportFormat = 'svg' | 'png';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, fileName: string) => Promise<void>;
  defaultFileName?: string;
  viewMode?: 'preview' | 'mindmap';
  mindmapViewRef?: RefObject<MindmapViewRef | null>;
  content?: string;
}

const ExportDialog = ({
  open,
  onClose,
  onExport,
  defaultFileName = 'document',
  viewMode = 'preview',
  mindmapViewRef,
  content = '',
}: ExportDialogProps) => {
  const isMindmapMode = viewMode === 'mindmap';
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [mindmapFormat, setMindmapFormat] = useState<MindmapExportFormat>('svg');
  const [fileName, setFileName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colorTheme } = useSettingsStore();

  // テーマに応じた色設定
  const isDarkTheme = colorTheme === 'vs-dark';
  const exportBgColor = isDarkTheme ? '#1E1E1E' : '#FFFFFF';


  // ファイル名の初期化（viewModeまたはdefaultFileNameが変更されたとき）
  useEffect(() => {
    const baseName = defaultFileName.replace(/\.(pdf|html|docx|svg|png)$/i, '');
    if (isMindmapMode) {
      setFileName(`${baseName}.svg`);
      setMindmapFormat('svg');
    } else {
      setFileName(`${baseName}.pdf`);
      setFormat('pdf');
    }
  }, [defaultFileName, isMindmapMode]);

  const handleFormatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFormat = event.target.value as ExportFormat;
    setFormat(newFormat);

    // ファイル名の拡張子を更新
    const baseName = fileName.replace(/\.(pdf|html|docx)$/i, '');
    const extension = newFormat === 'word' ? 'docx' : newFormat;
    setFileName(`${baseName}.${extension}`);
  };

  const handleMindmapFormatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFormat = event.target.value as MindmapExportFormat;
    setMindmapFormat(newFormat);

    // ファイル名の拡張子を更新
    const baseName = fileName.replace(/\.(svg|png)$/i, '');
    setFileName(`${baseName}.${newFormat}`);
  };

  const handleFileNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.value);
  };

  // マインドマップを一時的に生成してエクスポート
  const exportMindmapDirectly = async () => {
    if (!content) {
      throw new Error('エクスポートするコンテンツがありません');
    }

    // 一時的なSVG要素を作成
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '3000');
    svg.setAttribute('height', '2000');
    svg.style.position = 'absolute';
    svg.style.left = '-9999px';
    document.body.appendChild(svg);

    try {
      // Markdownをマインドマップデータに変換
      const transformer = new Transformer();
      const { root } = transformer.transform(content || '# マインドマップ');

      // マインドマップを作成
      Markmap.create(svg, {
        autoFit: false,
        color: (node) => {
          const colors = ['#4FC3F7', '#81C784', '#FFB74D', '#F06292', '#BA68C8', '#4DD0E1'];
          return colors[node.state?.depth % colors.length] || colors[0];
        },
        paddingX: 16,
        duration: 0,
        initialExpandLevel: -1,
      }, root);

      // 少し待ってレンダリングを確実にする
      await new Promise(resolve => setTimeout(resolve, 100));

      if (mindmapFormat === 'svg') {
        // SVGとしてエクスポート
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // すべての子要素のバウンディングボックスを計算
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let hasContent = false;

        svg.querySelectorAll('g, path, circle, text, foreignObject').forEach(el => {
          try {
            const bbox = (el as SVGGraphicsElement).getBBox();
            if (bbox.width > 0 || bbox.height > 0) {
              minX = Math.min(minX, bbox.x);
              minY = Math.min(minY, bbox.y);
              maxX = Math.max(maxX, bbox.x + bbox.width);
              maxY = Math.max(maxY, bbox.y + bbox.height);
              hasContent = true;
            }
          } catch (e) {
            // 一部の要素でgetBBox()が失敗する場合がある
          }
        });

        // コンテンツが見つからない場合、またはInfinityが残っている場合はデフォルトサイズを使用
        if (!hasContent || !isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
          minX = 0;
          minY = 0;
          maxX = 3000;
          maxY = 2000;
        }

        // パディングを追加
        const padding = 100;
        const viewBoxX = minX - padding;
        const viewBoxY = minY - padding;
        const containerWidth = Math.ceil((maxX - minX) + padding * 2);
        const containerHeight = Math.ceil((maxY - minY) + padding * 2);

        // viewBoxを0,0から始まるように正規化
        const normalizedWidth = Math.ceil(containerWidth);
        const normalizedHeight = Math.ceil(containerHeight);
        const translateX = -viewBoxX;
        const translateY = -viewBoxY;

        // ルートのg要素のtransformをリセット（既存のtransformと二重適用を防ぐ）
        const rootG = svg.querySelector('g');
        if (rootG) {
          rootG.removeAttribute('transform');
        }

        // foreignObject要素をSVG text要素に変換
        const foreignObjects = svg.querySelectorAll('foreignObject');
        console.log('ExportDialog SVG: Converting foreignObject elements to text:', foreignObjects.length);

        foreignObjects.forEach(fo => {
          // foreignObjectの位置を取得
          const x = parseFloat(fo.getAttribute('x') || '0');
          const y = parseFloat(fo.getAttribute('y') || '0');

          // テーマに応じたテキスト色
          const exportTextColor = isDarkTheme ? '#FFFFFF' : '#000000';

          // foreignObject内のHTML構造を解析
          const foreignContent = fo.querySelector('div');
          if (!foreignContent) {
            fo.remove();
            return;
          }

          // SVG g要素を作成（複数のtext要素をグループ化）
          const gElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          gElement.setAttribute('transform', `translate(${x}, ${y})`);

          let currentY = 16; // 最初の行のY位置

          // テーブルが含まれている場合の処理
          const table = foreignContent.querySelector('table');
          if (table) {
            const rows = table.querySelectorAll('tr');

            // 各列の最大幅を事前に計算
            const columnWidths: number[] = [];
            rows.forEach((row) => {
              const cells = row.querySelectorAll('th, td');
              cells.forEach((cell, cellIndex) => {
                const cellText = cell.textContent?.trim() || '';
                // 日本語を考慮した幅計算（全角文字は英数字の約2倍の幅）
                const hasJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(cellText);
                const charWidth = hasJapanese ? 14 : 8;
                const cellWidth = Math.max(cellText.length * charWidth + 24, 100);
                columnWidths[cellIndex] = Math.max(columnWidths[cellIndex] || 0, cellWidth);
              });
            });

            rows.forEach((row) => {
              const cells = row.querySelectorAll('th, td');
              let currentX = 0;

              cells.forEach((cell, cellIndex) => {
                const cellText = cell.textContent?.trim() || '';
                if (cellText) {
                  const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  textElement.setAttribute('x', currentX.toString());
                  textElement.setAttribute('y', currentY.toString());
                  textElement.setAttribute('font-size', '11');
                  textElement.setAttribute('font-family', 'Segoe UI, Helvetica Neue, Arial, sans-serif');
                  textElement.setAttribute('font-weight', row.querySelector('th') && cellIndex < row.querySelectorAll('th').length ? '600' : '400');
                  textElement.setAttribute('fill', exportTextColor);
                  textElement.textContent = cellText;
                  gElement.appendChild(textElement);
                }

                // 次のセルのX位置（事前に計算した列幅を使用）
                currentX += columnWidths[cellIndex] || 100;
              });

              // 次の行のY位置（行間を広げる）
              currentY += 22;
            });
          } else {
            // テーブル以外の通常のコンテンツの処理
            const extractTextNodes = (element: Element, lines: string[] = []): string[] => {
              element.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                  const text = node.textContent?.trim();
                  if (text) {
                    lines.push(text);
                  }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  const el = node as Element;
                  // 改行を伴う要素
                  if (['BR', 'P', 'DIV', 'LI'].includes(el.tagName)) {
                    extractTextNodes(el, lines);
                    if (el.tagName !== 'SPAN') {
                      lines.push('\n');
                    }
                  } else {
                    extractTextNodes(el, lines);
                  }
                }
              });
              return lines;
            };

            const lines = extractTextNodes(foreignContent);
            const textLines: string[] = [];
            let currentLine = '';

            // 連続した空白行を削除し、テキストを行に分割
            lines.forEach(line => {
              if (line === '\n') {
                if (currentLine) {
                  textLines.push(currentLine);
                  currentLine = '';
                }
              } else {
                if (currentLine && !currentLine.endsWith(' ')) {
                  currentLine += ' ';
                }
                currentLine += line;
              }
            });
            if (currentLine) {
              textLines.push(currentLine);
            }

            // 各行をtext要素として追加
            textLines.forEach((line, index) => {
              if (line.trim()) {
                const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                textElement.setAttribute('x', '0');
                textElement.setAttribute('y', (currentY + index * 18).toString());
                textElement.setAttribute('font-size', '14');
                textElement.setAttribute('font-family', 'Segoe UI, Helvetica Neue, Arial, sans-serif');
                textElement.setAttribute('font-weight', '500');
                textElement.setAttribute('fill', exportTextColor);
                textElement.textContent = line;
                gElement.appendChild(textElement);
              }
            });
          }

          // foreignObjectをg要素に置き換え
          fo.parentNode?.replaceChild(gElement, fo);
        });

        // SVG文字列を直接構築
        // 元のMarkmapのstyleとカラー情報を保持
        const svgContent = svg.innerHTML;
        const exportTextColor = isDarkTheme ? '#FFFFFF' : '#000000';
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${normalizedWidth}" height="${normalizedHeight}" viewBox="0 0 ${normalizedWidth} ${normalizedHeight}">
  <style>
    text { font-size: 14px; font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; fill: ${exportTextColor}; }
  </style>
  <rect x="0" y="0" width="${normalizedWidth}" height="${normalizedHeight}" fill="${exportBgColor}"/>
  <g transform="translate(${translateX}, ${translateY})">
${svgContent}
  </g>
</svg>`;
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // PNGとしてエクスポート
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // すべての子要素のバウンディングボックスを計算
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let hasContent = false;

        svg.querySelectorAll('g, path, circle, text, foreignObject').forEach(el => {
          try {
            const bbox = (el as SVGGraphicsElement).getBBox();
            if (bbox.width > 0 || bbox.height > 0) {
              minX = Math.min(minX, bbox.x);
              minY = Math.min(minY, bbox.y);
              maxX = Math.max(maxX, bbox.x + bbox.width);
              maxY = Math.max(maxY, bbox.y + bbox.height);
              hasContent = true;
            }
          } catch (e) {
            // 一部の要素でgetBBox()が失敗する場合がある
          }
        });

        // コンテンツが見つからない場合、またはInfinityが残っている場合はデフォルトサイズを使用
        if (!hasContent || !isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
          minX = 0;
          minY = 0;
          maxX = 3000;
          maxY = 2000;
        }

        // パディングを追加
        const padding = 100;
        const viewBoxX = minX - padding;
        const viewBoxY = minY - padding;
        const baseWidth = Math.ceil((maxX - minX) + padding * 2);
        const baseHeight = Math.ceil((maxY - minY) + padding * 2);

        // 高解像度化のためのスケール（3倍で鮮明に）
        const scale = 3;

        // サイズチェック: スケール後のサイズがCanvas制限を超えないかチェック
        // Chrome/Edge: 16,384 x 16,384、安全のため 5,000px (スケール後 15,000px) を上限とする
        const MAX_BASE_DIMENSION = 5000; // スケール前の最大サイズ
        if (baseWidth > MAX_BASE_DIMENSION || baseHeight > MAX_BASE_DIMENSION) {
          throw new Error(
            `マインドマップが大きすぎてPNG形式でエクスポートできません。\n\n` +
            `現在のサイズ: ${baseWidth} x ${baseHeight}px\n` +
            `PNG対応サイズ: ${MAX_BASE_DIMENSION} x ${MAX_BASE_DIMENSION}px 以下\n\n` +
            `【推奨】SVG形式でエクスポートしてください。\n` +
            `SVG形式はサイズ制限がなく、拡大しても高画質を保ちます。`
          );
        }
        const width = baseWidth * scale;
        const height = baseHeight * scale;

        // viewBoxを0,0から始まるように正規化
        const normalizedWidth = Math.ceil(baseWidth);
        const normalizedHeight = Math.ceil(baseHeight);
        const translateX = -viewBoxX;
        const translateY = -viewBoxY;

        // ルートのg要素のtransformをリセット（既存のtransformと二重適用を防ぐ）
        const rootGPng = svg.querySelector('g');
        if (rootGPng) {
          rootGPng.removeAttribute('transform');
        }

        // foreignObject要素をSVG text要素に変換
        const foreignObjectsPng = svg.querySelectorAll('foreignObject');
        console.log('ExportDialog PNG: Converting foreignObject elements to text:', foreignObjectsPng.length);

        foreignObjectsPng.forEach(fo => {
          // foreignObjectの位置を取得
          const x = parseFloat(fo.getAttribute('x') || '0');
          const y = parseFloat(fo.getAttribute('y') || '0');

          // テーマに応じたテキスト色
          const exportTextColorPng = isDarkTheme ? '#FFFFFF' : '#000000';

          // foreignObject内のHTML構造を解析
          const foreignContent = fo.querySelector('div');
          if (!foreignContent) {
            fo.remove();
            return;
          }

          // SVG g要素を作成（複数のtext要素をグループ化）
          const gElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          gElement.setAttribute('transform', `translate(${x}, ${y})`);

          let currentY = 16; // 最初の行のY位置

          // テーブルが含まれている場合の処理
          const table = foreignContent.querySelector('table');
          if (table) {
            const rows = table.querySelectorAll('tr');

            // 各列の最大幅を事前に計算
            const columnWidths: number[] = [];
            rows.forEach((row) => {
              const cells = row.querySelectorAll('th, td');
              cells.forEach((cell, cellIndex) => {
                const cellText = cell.textContent?.trim() || '';
                // 日本語を考慮した幅計算（全角文字は英数字の約2倍の幅）
                const hasJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(cellText);
                const charWidth = hasJapanese ? 14 : 8;
                const cellWidth = Math.max(cellText.length * charWidth + 24, 100);
                columnWidths[cellIndex] = Math.max(columnWidths[cellIndex] || 0, cellWidth);
              });
            });

            rows.forEach((row, _rowIndex) => {
              const cells = row.querySelectorAll('th, td');
              let currentX = 0;

              cells.forEach((cell, cellIndex) => {
                const cellText = cell.textContent?.trim() || '';
                if (cellText) {
                  const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  textElement.setAttribute('x', currentX.toString());
                  textElement.setAttribute('y', currentY.toString());
                  textElement.setAttribute('font-size', '11');
                  textElement.setAttribute('font-family', 'Segoe UI, Helvetica Neue, Arial, sans-serif');
                  textElement.setAttribute('font-weight', row.querySelector('th') && cellIndex < row.querySelectorAll('th').length ? '600' : '400');
                  textElement.setAttribute('fill', exportTextColorPng);
                  textElement.textContent = cellText;
                  gElement.appendChild(textElement);
                }

                // 次のセルのX位置（事前に計算した列幅を使用）
                currentX += columnWidths[cellIndex] || 100;
              });

              // 次の行のY位置（行間を広げる）
              currentY += 22;
            });
          } else {
            // テーブル以外の通常のコンテンツの処理
            const extractTextNodes = (element: Element, lines: string[] = []): string[] => {
              element.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                  const text = node.textContent?.trim();
                  if (text) {
                    lines.push(text);
                  }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  const el = node as Element;
                  // 改行を伴う要素
                  if (['BR', 'P', 'DIV', 'LI'].includes(el.tagName)) {
                    extractTextNodes(el, lines);
                    if (el.tagName !== 'SPAN') {
                      lines.push('\n');
                    }
                  } else {
                    extractTextNodes(el, lines);
                  }
                }
              });
              return lines;
            };

            const lines = extractTextNodes(foreignContent);
            const textLines: string[] = [];
            let currentLine = '';

            // 連続した空白行を削除し、テキストを行に分割
            lines.forEach(line => {
              if (line === '\n') {
                if (currentLine) {
                  textLines.push(currentLine);
                  currentLine = '';
                }
              } else {
                if (currentLine && !currentLine.endsWith(' ')) {
                  currentLine += ' ';
                }
                currentLine += line;
              }
            });
            if (currentLine) {
              textLines.push(currentLine);
            }

            // 各行をtext要素として追加
            textLines.forEach((line, index) => {
              if (line.trim()) {
                const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                textElement.setAttribute('x', '0');
                textElement.setAttribute('y', (currentY + index * 18).toString());
                textElement.setAttribute('font-size', '14');
                textElement.setAttribute('font-family', 'Segoe UI, Helvetica Neue, Arial, sans-serif');
                textElement.setAttribute('font-weight', '500');
                textElement.setAttribute('fill', exportTextColorPng);
                textElement.textContent = line;
                gElement.appendChild(textElement);
              }
            });
          }

          // foreignObjectをg要素に置き換え
          fo.parentNode?.replaceChild(gElement, fo);
        });

        // SVG文字列を直接構築
        // 元のMarkmapのstyleとカラー情報を保持
        const svgContentPng = svg.innerHTML;
        const exportTextColorPng = isDarkTheme ? '#FFFFFF' : '#000000';
        const svgStringForPng = `<svg xmlns="http://www.w3.org/2000/svg" width="${normalizedWidth}" height="${normalizedHeight}" viewBox="0 0 ${normalizedWidth} ${normalizedHeight}">
  <style>
    text { font-size: 14px; font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; fill: ${exportTextColorPng}; }
  </style>
  <rect x="0" y="0" width="${normalizedWidth}" height="${normalizedHeight}" fill="${exportBgColor}"/>
  <g transform="translate(${translateX}, ${translateY})">
${svgContentPng}
  </g>
</svg>`;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });

        if (!ctx) throw new Error('Canvas context を取得できませんでした');

        ctx.fillStyle = exportBgColor;
        ctx.fillRect(0, 0, width, height);

        // スケーリング
        ctx.scale(scale, scale);

        // Base64エンコード
        const base64SVG = btoa(unescape(encodeURIComponent(svgStringForPng)));
        const dataUrl = `data:image/svg+xml;base64,${base64SVG}`;

        const img = new window.Image();

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            try {
              ctx.drawImage(img, 0, 0, baseWidth, baseHeight);
              canvas.toBlob((blob) => {
                if (blob) {
                  const pngUrl = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = pngUrl;
                  link.download = fileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(pngUrl);
                  resolve();
                } else {
                  reject(new Error('PNG生成に失敗しました'));
                }
              }, 'image/png');
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = (_err: Event | string) => {
            console.error('画像読み込みエラー:', _err);
            reject(new Error('画像の読み込みに失敗しました'));
          };
          img.src = dataUrl;
        });
      }
    } finally {
      // 一時的なSVG要素を削除
      document.body.removeChild(svg);
    }
  };

  const handleExport = async () => {
    if (!fileName.trim()) {
      setError('ファイル名を入力してください');
      return;
    }

    setError(null);
    setIsExporting(true);

    try {
      if (isMindmapMode) {
        // マインドマップのエクスポート
        // mindmapViewRefが利用可能な場合はそれを使用、それ以外は直接生成
        if (mindmapViewRef?.current) {
          if (mindmapFormat === 'svg') {
            mindmapViewRef.current.exportSVG(fileName);
          } else {
            mindmapViewRef.current.exportPNG(fileName);
          }
        } else {
          // 一時的にマインドマップを生成してエクスポート
          await exportMindmapDirectly();
        }
      } else {
        // 通常のエクスポート
        await onExport(format, fileName);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog
      className="export-dialog"
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 500,
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
        エクスポート
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* エクスポート形式 */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: '#ccc', mb: 1.5, fontSize: '13px' }}
          >
            エクスポート形式
          </Typography>
          <FormControl component="fieldset">
            {isMindmapMode ? (
              <RadioGroup name="format" value={mindmapFormat} onChange={handleMindmapFormatChange}>
                <FormControlLabel
                  value="svg"
                  control={
                    <Radio
                      sx={{
                        color: '#888',
                        '&.Mui-checked': { color: '#0078d4' },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image sx={{ fontSize: 18, color: '#4caf50' }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: '#fff', fontSize: '13px' }}>
                          SVG
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888', fontSize: '11px' }}>
                          ベクター形式（拡大しても高画質）
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  value="png"
                  control={
                    <Radio
                      sx={{
                        color: '#888',
                        '&.Mui-checked': { color: '#0078d4' },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image sx={{ fontSize: 18, color: '#2196f3' }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: '#fff', fontSize: '13px' }}>
                          PNG
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888', fontSize: '11px' }}>
                          画像形式（汎用性が高い）
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </RadioGroup>
            ) : (
              <RadioGroup name="format" value={format} onChange={handleFormatChange}>
                <FormControlLabel
                  value="pdf"
                  control={
                    <Radio
                      sx={{
                        color: '#888',
                        '&.Mui-checked': { color: '#0078d4' },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PictureAsPdf sx={{ fontSize: 18, color: '#d32f2f' }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: '#fff', fontSize: '13px' }}>
                          PDF
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888', fontSize: '11px' }}>
                          印刷や配布に適した形式
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  value="html"
                  control={
                    <Radio
                      sx={{
                        color: '#888',
                        '&.Mui-checked': { color: '#0078d4' },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Code sx={{ fontSize: 18, color: '#ff6d00' }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: '#fff', fontSize: '13px' }}>
                          HTML
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888', fontSize: '11px' }}>
                          Webページとして表示可能
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  value="word"
                  control={
                    <Radio
                      sx={{
                        color: '#888',
                        '&.Mui-checked': { color: '#0078d4' },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description sx={{ fontSize: 18, color: '#2b579a' }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: '#fff', fontSize: '13px' }}>
                          Word (DOCX)
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888', fontSize: '11px' }}>
                          Microsoft Word形式
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </RadioGroup>
            )}
          </FormControl>
        </Box>

        {/* ファイル名 */}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ color: '#ccc', mb: 1, fontSize: '13px' }}
          >
            ファイル名
          </Typography>
          <TextField
            fullWidth
            value={fileName}
            onChange={handleFileNameChange}
            placeholder="document.pdf"
            size="small"
            disabled={isExporting}
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
          variant="text"
          size="small"
          onClick={handleClose}
          disabled={isExporting}
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
          variant="contained"
          size="small"
          onClick={handleExport}
          disabled={isExporting}
          startIcon={isExporting ? <CircularProgress size={16} /> : null}
          sx={{
            minWidth: 100,
            height: 30,
            fontSize: '12px',
            bgcolor: '#0078d4',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#106ebe',
            },
            '&.Mui-disabled': {
              bgcolor: '#555',
              color: '#888',
            },
          }}
        >
          {isExporting ? 'エクスポート中...' : 'エクスポート'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
