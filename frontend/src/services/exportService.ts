import html2pdf from 'html2pdf.js';
import { marked } from 'marked';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';

/**
 * マークダウンをHTMLに変換
 */
const markdownToHtml = async (markdown: string): Promise<string> => {
  // markedの設定
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  return await marked(markdown);
};

/**
 * HTMLにスタイルを適用
 */
const applyStylesToHtml = (html: string, title: string = 'Document'): string => {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fff;
    }
    h1 {
      border-bottom: 2px solid #333;
      padding-bottom: 0.3em;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    h2 {
      border-bottom: 1px solid #666;
      padding-bottom: 0.3em;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    h3, h4, h5, h6 {
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    code {
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #ddd;
      margin: 0;
      padding-left: 1em;
      color: #666;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    table th,
    table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    table th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    ul, ol {
      padding-left: 2em;
    }
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 2em 0;
    }
  </style>
</head>
<body>
${html}
</body>
</html>
  `;
};

/**
 * PDF形式でエクスポート
 */
export const exportToPDF = async (
  markdown: string,
  fileName: string = 'document.pdf'
): Promise<void> => {
  try {
    // マークダウンをHTMLに変換
    const htmlContent = await markdownToHtml(markdown);

    // 一時的なDIV要素を作成
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.padding = '20px';
    tempDiv.style.backgroundColor = '#fff';
    tempDiv.style.color = '#333';

    // html2pdfのオプション
    const options = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' as const
      },
    };

    // PDFを生成してダウンロード
    await html2pdf().set(options).from(tempDiv).save();
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('PDFのエクスポートに失敗しました');
  }
};

/**
 * HTML形式でエクスポート
 */
export const exportToHTML = async (
  markdown: string,
  fileName: string = 'document.html'
): Promise<void> => {
  try {
    // マークダウンをHTMLに変換
    const htmlContent = await markdownToHtml(markdown);
    const styledHtml = applyStylesToHtml(htmlContent, fileName.replace('.html', ''));

    // Blobを作成
    const blob = new Blob([styledHtml], { type: 'text/html;charset=utf-8' });

    // ダウンロードリンクを作成
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    // クリックしてダウンロード
    document.body.appendChild(link);
    link.click();

    // クリーンアップ
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('HTML export failed:', error);
    throw new Error('HTMLのエクスポートに失敗しました');
  }
};

/**
 * マークダウンをWord文書の段落に変換
 */
const markdownToDocx = (markdown: string): Paragraph[] => {
  const lines = markdown.split('\n');
  const paragraphs: Paragraph[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // コードブロックの処理
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // コードブロック終了
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: codeBlockContent.join('\n'),
                font: 'Courier New',
                size: 20,
              }),
            ],
            spacing: { before: 100, after: 100 },
          })
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // コードブロック開始
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // 見出しの処理
    if (line.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^# /, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (line.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^## /, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^### /, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
        })
      );
    } else if (line.startsWith('#### ')) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^#### /, ''),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 140, after: 70 },
        })
      );
    } else if (line.startsWith('##### ')) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^##### /, ''),
          heading: HeadingLevel.HEADING_5,
          spacing: { before: 120, after: 60 },
        })
      );
    } else if (line.startsWith('###### ')) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^###### /, ''),
          heading: HeadingLevel.HEADING_6,
          spacing: { before: 100, after: 50 },
        })
      );
    }
    // 箇条書きリスト
    else if (line.match(/^[*\-+] /)) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^[*\-+] /, ''),
          bullet: { level: 0 },
          spacing: { before: 50, after: 50 },
        })
      );
    }
    // 番号付きリスト
    else if (line.match(/^\d+\. /)) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^\d+\. /, ''),
          numbering: { reference: 'default-numbering', level: 0 },
          spacing: { before: 50, after: 50 },
        })
      );
    }
    // 水平線
    else if (line.match(/^[-*_]{3,}$/)) {
      paragraphs.push(
        new Paragraph({
          text: '',
          border: {
            bottom: {
              color: '000000',
              space: 1,
              style: 'single',
              size: 6,
            },
          },
          spacing: { before: 120, after: 120 },
        })
      );
    }
    // 引用
    else if (line.startsWith('> ')) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/^> /, ''),
              italics: true,
            }),
          ],
          indent: { left: 720 },
          spacing: { before: 100, after: 100 },
        })
      );
    }
    // 空行
    else if (line.trim() === '') {
      paragraphs.push(new Paragraph({ text: '' }));
    }
    // 通常のテキスト（太字、イタリック、コード、リンクの処理）
    else {
      const children: TextRun[] = [];
      let currentText = line;

      // シンプルな処理: 基本的なマークダウン記法をパース
      // **太字** または __太字__
      currentText = currentText.replace(/\*\*(.+?)\*\*/g, '<<BOLD>>$1<<BOLD>>');
      currentText = currentText.replace(/__(.+?)__/g, '<<BOLD>>$1<<BOLD>>');

      // *イタリック* または _イタリック_
      currentText = currentText.replace(/\*(.+?)\*/g, '<<ITALIC>>$1<<ITALIC>>');
      currentText = currentText.replace(/_(.+?)_/g, '<<ITALIC>>$1<<ITALIC>>');

      // `コード`
      currentText = currentText.replace(/`(.+?)`/g, '<<CODE>>$1<<CODE>>');

      // [リンク](URL) - リンクテキストのみ表示
      currentText = currentText.replace(/\[(.+?)\]\(.+?\)/g, '$1');

      // マーカーに基づいてTextRunを作成
      const parts = currentText.split(/(<<BOLD>>|<<ITALIC>>|<<CODE>>)/);
      let isBold = false;
      let isItalic = false;
      let isCode = false;

      for (const part of parts) {
        if (part === '<<BOLD>>') {
          isBold = !isBold;
        } else if (part === '<<ITALIC>>') {
          isItalic = !isItalic;
        } else if (part === '<<CODE>>') {
          isCode = !isCode;
        } else if (part) {
          children.push(
            new TextRun({
              text: part,
              bold: isBold,
              italics: isItalic,
              font: isCode ? 'Courier New' : undefined,
              size: isCode ? 20 : undefined,
            })
          );
        }
      }

      paragraphs.push(
        new Paragraph({
          children: children.length > 0 ? children : [new TextRun({ text: line })],
          spacing: { before: 100, after: 100 },
        })
      );
    }
  }

  return paragraphs;
};

/**
 * Word形式でエクスポート（.docx形式）
 */
export const exportToWord = async (
  markdown: string,
  fileName: string = 'document.docx'
): Promise<void> => {
  try {
    // マークダウンをWord段落に変換
    const paragraphs = markdownToDocx(markdown);

    // Word文書を作成
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
      numbering: {
        config: [
          {
            reference: 'default-numbering',
            levels: [
              {
                level: 0,
                format: 'decimal',
                text: '%1.',
                alignment: AlignmentType.LEFT,
              },
            ],
          },
        ],
      },
    });

    // Blobを生成
    const blob = await Packer.toBlob(doc);

    // ダウンロードリンクを作成
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;

    // クリックしてダウンロード
    document.body.appendChild(link);
    link.click();

    // クリーンアップ
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Word export failed:', error);
    throw new Error('Wordのエクスポートに失敗しました');
  }
};

/**
 * エクスポート形式の型定義
 */
export type ExportFormat = 'pdf' | 'html' | 'word';

/**
 * 汎用エクスポート関数
 */
export const exportDocument = async (
  markdown: string,
  format: ExportFormat,
  fileName?: string
): Promise<void> => {
  const defaultFileName = `document_${Date.now()}`;

  switch (format) {
    case 'pdf':
      await exportToPDF(markdown, fileName || `${defaultFileName}.pdf`);
      break;
    case 'html':
      exportToHTML(markdown, fileName || `${defaultFileName}.html`);
      break;
    case 'word':
      await exportToWord(markdown, fileName || `${defaultFileName}.docx`);
      break;
    default:
      throw new Error(`未対応のエクスポート形式: ${format}`);
  }
};
