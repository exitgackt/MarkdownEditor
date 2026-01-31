import mammoth from 'mammoth';

/**
 * HTMLをMarkdownに変換する簡易的な関数
 */
const convertHtmlToMarkdown = (html: string): string => {
  let markdown = html;

  // 見出し変換
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // 太字・イタリック
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // リスト
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  markdown = markdown.replace(/<\/?[ou]l[^>]*>/gi, '\n');

  // 段落
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // リンク
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // その他のタグを削除
  markdown = markdown.replace(/<[^>]+>/g, '');

  // HTML エンティティのデコード
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&quot;/g, '"');

  // 連続する空行を削除
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  return markdown.trim();
};

/**
 * Wordファイル(.docx)をマークダウンに変換してインポート
 *
 * 注意: mammoth.js は Markdown 変換を直接サポートしていないため、
 * HTML に変換してから簡易的に Markdown に変換しています。
 * 完全な変換が必要な場合は、Phase 4 で専用ライブラリの導入を検討してください。
 */
export const importWordFile = async (file: File): Promise<string> => {
  try {
    // FileをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();

    // mammoth.js はMarkdown変換をサポートしていないため、HTMLに変換
    const result = await mammoth.convertToHtml({ arrayBuffer });

    if (result.messages && result.messages.length > 0) {
      console.warn('Word変換時の警告:', result.messages);
    }

    // HTML を簡易的に Markdown に変換
    const markdown = convertHtmlToMarkdown(result.value);
    return markdown;
  } catch (error) {
    console.error('Word変換エラー:', error);
    throw new Error('Wordファイルの変換に失敗しました');
  }
};

/**
 * テキストファイル(.txt, .md)をインポート
 */
export const importTextFile = async (file: File): Promise<string> => {
  try {
    return await file.text();
  } catch (error) {
    console.error('テキスト読み込みエラー:', error);
    throw new Error('テキストファイルの読み込みに失敗しました');
  }
};

/**
 * ファイル拡張子から適切なインポート関数を選択
 */
export const importFile = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'docx':
      return await importWordFile(file);
    case 'md':
    case 'txt':
      return await importTextFile(file);
    default:
      throw new Error(`サポートされていないファイル形式です: .${extension}`);
  }
};
