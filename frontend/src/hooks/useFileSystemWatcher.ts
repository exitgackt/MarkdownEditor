import { useEffect, useRef, useCallback } from 'react';
import type { FileNode } from '../types';

/**
 * ファイルシステムの変更を監視するフック
 *
 * @param rootHandle ルートディレクトリハンドル
 * @param onUpdate 変更検出時のコールバック
 * @param interval 監視間隔（ミリ秒）デフォルト: 5000ms (5秒)
 */
export const useFileSystemWatcher = (
  rootHandle: FileSystemDirectoryHandle | null,
  onUpdate: (newFileTree: FileNode) => void,
  interval: number = 5000
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousTreeRef = useRef<string | null>(null);

  // ディレクトリツリーをスキャン（EditorPageと同じ形式で）
  const scanDirectory = useCallback(
    async (
      dirHandle: FileSystemDirectoryHandle,
      path: string
    ): Promise<FileNode> => {
      const children: FileNode[] = [];

      try {
        for await (const entry of dirHandle.values()) {
          const entryPath = `${path}/${entry.name}`;

          if (entry.kind === 'directory') {
            // サブディレクトリを再帰的にスキャン
            const childDir = await scanDirectory(
              entry as FileSystemDirectoryHandle,
              entryPath
            );
            children.push(childDir);
          } else {
            const fileHandle = entry as FileSystemFileHandle;

            children.push({
              id: `file-${entryPath}`,
              name: entry.name,
              path: entryPath,
              type: 'file',
              handle: fileHandle,
            });
          }
        }

        // フォルダーを先に、ファイルを後に、それぞれアルファベット順でソート
        children.sort((a, b) => {
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
        });

        return {
          id: `folder-${path}`,
          name: dirHandle.name,
          path: path,
          type: 'folder',
          children,
          handle: dirHandle,
          isExpanded: false, // 展開状態は後で適用
        };
      } catch (error) {
        console.error(`Error scanning directory ${dirHandle.name}:`, error);
        return {
          id: dirHandle.name,
          name: dirHandle.name,
          path: dirHandle.name,
          type: 'folder',
          children: [],
          handle: dirHandle,
        };
      }
    },
    []
  );

  // ファイルツリーをシリアライズして比較用の文字列を生成
  const serializeTree = useCallback((node: FileNode): string => {
    const serialize = (n: FileNode): any => ({
      name: n.name,
      path: n.path,
      type: n.type,
      children: n.children?.map(serialize).sort((a, b) => a.path.localeCompare(b.path)),
    });

    return JSON.stringify(serialize(node));
  }, []);

  // 変更をチェック
  const checkForChanges = useCallback(async () => {
    if (!rootHandle) return;

    try {
      // EditorPageと同じパス形式を使用
      const rootPath = `/${rootHandle.name}`;
      const newTree = await scanDirectory(rootHandle, rootPath);
      const newTreeStr = serializeTree(newTree);

      // 前回のツリーと比較
      if (previousTreeRef.current !== null && previousTreeRef.current !== newTreeStr) {
        console.log('📁 ファイルシステムの変更を検出しました');
        onUpdate(newTree);
      }

      previousTreeRef.current = newTreeStr;
    } catch (error) {
      console.error('ファイルシステムのスキャンエラー:', error);
    }
  }, [rootHandle, scanDirectory, serializeTree, onUpdate]);

  // 監視開始
  useEffect(() => {
    if (!rootHandle) {
      // ルートハンドルがない場合は監視停止
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      previousTreeRef.current = null;
      return;
    }

    // 初回スキャン
    checkForChanges();

    // 定期的にスキャン
    intervalRef.current = setInterval(checkForChanges, interval);

    // クリーンアップ
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [rootHandle, checkForChanges, interval]);

  // 手動リフレッシュ用の関数を返す
  return { refresh: checkForChanges };
};
