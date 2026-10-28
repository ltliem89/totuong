import { AnimalId, StudioThemeId } from "../data/statuesData";

export interface SavedStatueVersion {
  id: string;
  versionName: string;
  animalId: AnimalId;
  animalNameVi: string;
  studioThemeId: StudioThemeId;
  paintedParts: Record<string, string>;
  partTextures: Record<string, string>;
  previewDataUrl: string;
  createdAt: number;
}

const DB_NAME = "BeMyToTuong3DDB";
const DB_VERSION = 1;
const STORE_VERSIONS = "statue_versions";
const STORE_DRAFT = "statue_draft";
const DRAFT_KEY = "current_working_draft";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_VERSIONS)) {
        const store = db.createObjectStore(STORE_VERSIONS, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_DRAFT)) {
        db.createObjectStore(STORE_DRAFT);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listSavedVersionsFromBrowser(): Promise<SavedStatueVersion[]> {
  try {
    const db = await openDatabase();
    return await new Promise<SavedStatueVersion[]>((resolve, reject) => {
      const tx = db.transaction(STORE_VERSIONS, "readonly");
      const store = tx.objectStore(STORE_VERSIONS);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as SavedStatueVersion[]) || [];
        items.sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveVersionToBrowser(version: SavedStatueVersion): Promise<SavedStatueVersion[]> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_VERSIONS, "readwrite");
      const store = tx.objectStore(STORE_VERSIONS);
      store.put(version);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore storage errors
  }
  return listSavedVersionsFromBrowser();
}

export async function deleteVersionFromBrowser(id: string): Promise<SavedStatueVersion[]> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_VERSIONS, "readwrite");
      const store = tx.objectStore(STORE_VERSIONS);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore storage errors
  }
  return listSavedVersionsFromBrowser();
}

export async function saveWorkingDraftToBrowser(draft: SavedStatueVersion): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFT, "readwrite");
      const store = tx.objectStore(STORE_DRAFT);
      store.put(draft, DRAFT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore storage errors
  }
}

export async function loadWorkingDraftFromBrowser(): Promise<SavedStatueVersion | null> {
  try {
    const db = await openDatabase();
    return await new Promise<SavedStatueVersion | null>((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFT, "readonly");
      const store = tx.objectStore(STORE_DRAFT);
      const req = store.get(DRAFT_KEY);
      req.onsuccess = () => resolve((req.result as SavedStatueVersion) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}
