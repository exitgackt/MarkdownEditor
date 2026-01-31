// IndexedDBでお気に入りのファイルハンドルを管理するユーティリティ

const DB_NAME = 'FavoriteHandlesDB';
const STORE_NAME = 'handles';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

// データベースを開く
const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    };
  });

  return dbPromise;
};

// ファイルハンドルを保存
export const saveFileHandle = async (
  path: string,
  handle: FileSystemFileHandle
): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ path, handle });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// ファイルハンドルを取得
export const getFileHandle = async (
  path: string
): Promise<FileSystemFileHandle | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(path);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.handle : null);
    };
  });
};

// ファイルハンドルを削除
export const removeFileHandle = async (path: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(path);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// ファイルハンドルの権限を確認・要求
export const verifyPermission = async (
  handle: FileSystemFileHandle,
  mode: 'read' | 'readwrite' = 'read'
): Promise<boolean> => {
  // queryPermissionとrequestPermissionはまだ一部ブラウザでサポートされていない
  if ('queryPermission' in handle) {
    const options = { mode };
    // @ts-ignore - File System Access API の拡張
    const permission = await handle.queryPermission(options);
    if (permission === 'granted') {
      return true;
    }
    // @ts-ignore
    const requestResult = await handle.requestPermission(options);
    return requestResult === 'granted';
  }
  // queryPermissionがサポートされていない場合は、getFileを試みる
  try {
    await handle.getFile();
    return true;
  } catch {
    return false;
  }
};
