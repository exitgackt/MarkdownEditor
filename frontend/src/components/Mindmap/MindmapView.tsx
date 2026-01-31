import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { useSettingsStore } from '../../stores';

interface MindmapViewProps {
  content: string;
}

export interface MindmapViewRef {
  exportSVG: (filename?: string) => void;
  exportPNG: (filename?: string) => void;
}

const MindmapView = forwardRef<MindmapViewRef, MindmapViewProps>(function MindmapView({ content }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colorTheme } = useSettingsStore();

  // テーマに応じた色設定
  const isDarkTheme = colorTheme === 'vs-dark';
  const bgColor = isDarkTheme ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDarkTheme ? '#E0E0E0' : '#333333';

  // SVGとしてダウンロード
  const handleDownloadSVG = (filename: string = 'mindmap.svg') => {
    if (!svgRef.current) {
      console.error('SVG要素が見つかりません');
      return;
    }

    try {
      const svgElement = svgRef.current;
      console.log('SVG export started for:', filename);

      // SVG要素をクローンして、foreignObjectをtextに変換
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

      // ルートのg要素のtransformをリセット（既存のtransformと二重適用を防ぐ）
      const rootG = clonedSvg.querySelector('g');
      if (rootG) {
        rootG.removeAttribute('transform');
      }

      // foreignObject要素をSVG text要素に変換
      const foreignObjects = clonedSvg.querySelectorAll('foreignObject');
      console.log('Converting foreignObject elements to text:', foreignObjects.length);

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

      // クリーンなSVGコンテンツを取得
      const svgContent = clonedSvg.innerHTML;
      console.log('Cleaned SVG innerHTML length:', svgContent.length, 'Child nodes:', clonedSvg.childNodes.length);

      // すべての子要素のバウンディングボックスを計算
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasContent = false;
      let elementCount = 0;

      // 元のSVG要素から全ての要素のバウンディングボックスを取得
      svgElement.querySelectorAll('g, path, circle, text, foreignObject').forEach(el => {
        try {
          const bbox = (el as SVGGraphicsElement).getBBox();
          elementCount++;
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

      console.log('Element count:', elementCount, 'Has content:', hasContent);
      console.log('BBox before padding:', minX, minY, maxX, maxY);

      // コンテンツが見つからない場合、またはInfinityが残っている場合はデフォルトサイズを使用
      if (!hasContent || !isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
        console.log('Using default size');
        minX = 0;
        minY = 0;
        maxX = 3000;
        maxY = 2000;
      }

      // パディングを追加
      const padding = 100;
      const viewBoxX = minX - padding;
      const viewBoxY = minY - padding;
      const viewBoxWidth = (maxX - minX) + padding * 2;
      const viewBoxHeight = (maxY - minY) + padding * 2;

      console.log('Calculated viewBox:', viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight);

      // viewBoxを0,0から始まるように正規化
      const normalizedWidth = Math.ceil(viewBoxWidth);
      const normalizedHeight = Math.ceil(viewBoxHeight);

      // コンテンツを移動させるためのtransform
      const translateX = -viewBoxX;
      const translateY = -viewBoxY;

      console.log('Transform translate:', translateX, translateY);

      // SVG文字列を直接構築（viewBoxを0,0から、コンテンツをtransformで移動）
      // 元のMarkmapのstyleとカラー情報を保持
      const exportBgColor = isDarkTheme ? '#1E1E1E' : '#FFFFFF';
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

      console.log('Final SVG string length:', svgString.length);
      console.log('SVG preview (first 1000 chars):', svgString.substring(0, 1000));
      console.log('SVG preview (last 500 chars):', svgString.substring(Math.max(0, svgString.length - 500)));

      // SVGデータをBlobに変換
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // ダウンロード
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      console.log('SVG export successful:', filename);
    } catch (err) {
      console.error('SVGダウンロードエラー:', err);
      alert(`SVGエクスポートに失敗しました: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // PNGとしてダウンロード
  const handleDownloadPNG = async (filename: string = 'mindmap.png') => {
    if (!svgRef.current) {
      console.error('SVG要素が見つかりません');
      return;
    }

    try {
      const svgElement = svgRef.current;
      console.log('PNG export started for:', filename);

      // すべての子要素のバウンディングボックスを計算
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasContent = false;

      svgElement.querySelectorAll('g, path, circle, text, foreignObject').forEach(el => {
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

      console.log('PNG BBox before padding:', minX, minY, maxX, maxY);

      // コンテンツが見つからない場合、またはInfinityが残っている場合はデフォルトサイズを使用
      if (!hasContent || !isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
        console.log('PNG using default size');
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

      console.log('PNG final size:', baseWidth, 'x', baseHeight, 'viewBox:', viewBoxX, viewBoxY);

      // 高解像度化のためのスケール（3倍で鮮明に）
      const scale = 3;

      // サイズチェック: スケール後のサイズがCanvas制限を超えないかチェック
      // Chrome/Edge: 16,384 x 16,384、安全のため 5,000px (スケール後 15,000px) を上限とする
      const MAX_BASE_DIMENSION = 5000; // スケール前の最大サイズ
      if (baseWidth > MAX_BASE_DIMENSION || baseHeight > MAX_BASE_DIMENSION) {
        const errorMessage =
          `マインドマップが大きすぎてPNG形式でエクスポートできません。\n\n` +
          `現在のサイズ: ${baseWidth} x ${baseHeight}px\n` +
          `PNG対応サイズ: ${MAX_BASE_DIMENSION} x ${MAX_BASE_DIMENSION}px 以下\n\n` +
          `【推奨】SVG形式でエクスポートしてください。\n` +
          `SVG形式はサイズ制限がなく、拡大しても高画質を保ちます。`;
        console.error('PNG export size limit exceeded:', baseWidth, 'x', baseHeight);
        throw new Error(errorMessage);
      }

      const width = baseWidth * scale;
      const height = baseHeight * scale;

      // Canvasを作成（高解像度）
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        console.error('Canvas contextの取得に失敗');
        alert('Canvas contextの取得に失敗しました');
        return;
      }

      // 背景をテーマに応じて設定
      const exportBgColorPng = isDarkTheme ? '#1E1E1E' : '#FFFFFF';
      ctx.fillStyle = exportBgColorPng;
      ctx.fillRect(0, 0, width, height);

      // スケーリング
      ctx.scale(scale, scale);

      // viewBoxを0,0から始まるように正規化
      const normalizedWidthPng = Math.ceil(baseWidth);
      const normalizedHeightPng = Math.ceil(baseHeight);
      const translateXPng = -viewBoxX;
      const translateYPng = -viewBoxY;

      // SVG要素をクローンして、foreignObjectをtextに変換
      const clonedSvgPng = svgElement.cloneNode(true) as SVGSVGElement;

      // ルートのg要素のtransformをリセット（既存のtransformと二重適用を防ぐ）
      const rootGPng = clonedSvgPng.querySelector('g');
      if (rootGPng) {
        rootGPng.removeAttribute('transform');
      }

      const foreignObjectsPng = clonedSvgPng.querySelectorAll('foreignObject');
      console.log('PNG: Converting foreignObject elements to text:', foreignObjectsPng.length);

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
      const svgContentPng = clonedSvgPng.innerHTML;
      const exportTextColorPngFinal = isDarkTheme ? '#FFFFFF' : '#000000';
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${normalizedWidthPng}" height="${normalizedHeightPng}" viewBox="0 0 ${normalizedWidthPng} ${normalizedHeightPng}">
  <style>
    text { font-size: 14px; font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; fill: ${exportTextColorPngFinal}; }
  </style>
  <rect x="0" y="0" width="${normalizedWidthPng}" height="${normalizedHeightPng}" fill="${exportBgColorPng}"/>
  <g transform="translate(${translateXPng}, ${translateYPng})">
${svgContentPng}
  </g>
</svg>`;

      console.log('SVG string length:', svgString.length);
      console.log('Canvas size:', width, 'x', height, `(scale: ${scale}x)`);

      // Base64エンコード
      const base64SVG = btoa(unescape(encodeURIComponent(svgString)));
      const dataUrl = `data:image/svg+xml;base64,${base64SVG}`;

      // 画像を読み込んで描画
      await new Promise<void>((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          console.log('Image loaded successfully');
          try {
            ctx.drawImage(img, 0, 0, baseWidth, baseHeight);
            console.log('Image drawn to canvas');

            // CanvasをPNGに変換してダウンロード
            canvas.toBlob((blob) => {
              if (blob) {
                console.log('Blob created, size:', blob.size);
                const pngUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(pngUrl);
                console.log('PNG export successful:', filename);
                resolve();
              } else {
                console.error('Blob生成に失敗');
                reject(new Error('PNG Blob生成に失敗しました'));
              }
            }, 'image/png');
          } catch (err) {
            console.error('Canvas描画エラー:', err);
            reject(err);
          }
        };

        img.onerror = (err) => {
          console.error('画像読み込みエラー:', err);
          console.log('Data URL length:', dataUrl.length);
          reject(new Error('画像の読み込みに失敗しました'));
        };

        img.src = dataUrl;
      });

    } catch (err) {
      console.error('PNGダウンロードエラー:', err);
      alert(`PNGエクスポートに失敗しました: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 親コンポーネントからアクセス可能なメソッドを公開
  useImperativeHandle(ref, () => ({
    exportSVG: handleDownloadSVG,
    exportPNG: handleDownloadPNG,
  }));

  useEffect(() => {
    if (!svgRef.current) return;

    const renderMindmap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Markdownをマインドマップデータに変換
        const transformer = new Transformer();
        const { root } = transformer.transform(content || '# マインドマップ');

        // 既存のマインドマップをクリア
        if (markmapRef.current) {
          // 既存のインスタンスを更新
          markmapRef.current.setData(root);
          markmapRef.current.fit();
        } else if (svgRef.current) {
          // 新しいインスタンスを作成
          svgRef.current.innerHTML = '';
          markmapRef.current = Markmap.create(svgRef.current, {
            autoFit: false,
            color: (node) => {
              // 深さに応じた色分け
              const colors = ['#4FC3F7', '#81C784', '#FFB74D', '#F06292', '#BA68C8', '#4DD0E1'];
              return colors[node.state?.depth % colors.length] || colors[0];
            },
            paddingX: 16,
            duration: 300,
            initialExpandLevel: -1, // 全ノードを展開
          }, root);
          // 初回のみフィット
          markmapRef.current.fit();

          // スクロール位置を中央に設定
          if (containerRef.current) {
            const container = containerRef.current;
            container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
            container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Mindmap rendering error:', err);
        setError('マインドマップの生成に失敗しました');
        setIsLoading(false);
      }
    };

    // デバウンス処理（頻繁な更新を防ぐ）
    const timeoutId = setTimeout(renderMindmap, 300);
    return () => clearTimeout(timeoutId);
  }, [content]);


  if (error) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: bgColor,
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      className="mindmap-container"
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: bgColor,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            zIndex: 10,
          }}
        >
          <CircularProgress size={40} sx={{ color: '#007ACC' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            マインドマップを生成中...
          </Typography>
        </Box>
      )}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '10px',
            height: '10px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: bgColor,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: isDarkTheme ? '#555' : '#CCC',
            borderRadius: '5px',
            '&:hover': {
              bgcolor: isDarkTheme ? '#666' : '#999',
            },
          },
        }}
      >
        <Box
          sx={{
            width: '3000px',
            height: '2000px',
            '& svg': {
              width: '100%',
              height: '100%',
              display: 'block',
            },
            '& text': {
              fill: `${textColor} !important`,
              fontSize: '14px !important',
              fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif !important',
            },
            '& .markmap-node text': {
              fill: `${textColor} !important`,
            },
            '& .markmap-foreign': {
              color: `${textColor} !important`,
              fontSize: '14px !important',
              fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif !important',
            },
            '& foreignObject': {
              color: `${textColor} !important`,
              overflow: 'visible',
            },
            '& foreignObject div': {
              color: `${textColor} !important`,
            },
            '& .markmap-node-circle': {
              strokeWidth: 1.5,
            },
            '& .markmap-link': {
              strokeWidth: 1.5,
            },
            '& circle': {
              fill: `${bgColor} !important`,
              stroke: isDarkTheme ? '#888' : '#666',
            },
          }}
        >
          <svg ref={svgRef} />
        </Box>
      </Box>
    </Box>
  );
});

MindmapView.displayName = 'MindmapView';

export default MindmapView;
