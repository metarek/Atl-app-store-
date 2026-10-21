import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  increment,
  onSnapshot
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { db, auth, storage } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { AppItem, AppCategory } from '../types/app';

const APPS_PATH = 'apps';
const DOWNLOAD_EVENTS_PATH = 'download_events';
const ADMINS_PATH = 'admins';

// Format bytes
function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const firebaseService = {
  // ==========================================
  // AUTHENTICATION
  // ==========================================
  
  async loginWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  onAuthState(callback: (user: User | null, isAdmin: boolean) => void) {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null, false);
        return;
      }

      // Check if user is bootstrapped admin or in admins collection
      const isSuperAdminEmail = user.email === 'mrbanana8461@gmail.com';
      if (isSuperAdminEmail) {
        callback(user, true);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, ADMINS_PATH, user.uid));
        const hasAdminRole = adminDoc.exists();
        callback(user, hasAdminRole);
      } catch {
        callback(user, false);
      }
    });
  },

  // ==========================================
  // APPLICATIONS (FIRESTORE)
  // ==========================================

  async getPublishedApps(): Promise<AppItem[]> {
    try {
      const q = query(collection(db, APPS_PATH), where('status', '==', 'published'));
      const snapshot = await getDocs(q);
      const items: AppItem[] = [];
      snapshot.forEach((d) => items.push(d.data() as AppItem));
      return items;
    } catch (error) {
      console.warn('Firestore published apps query notice:', error);
      return [];
    }
  },

  async getAllApps(): Promise<AppItem[]> {
    // If not signed in to Firebase, only query published apps to respect security rules
    if (!auth.currentUser) {
      return this.getPublishedApps();
    }
    try {
      const snapshot = await getDocs(collection(db, APPS_PATH));
      const items: AppItem[] = [];
      snapshot.forEach((d) => items.push(d.data() as AppItem));
      return items;
    } catch {
      return this.getPublishedApps();
    }
  },

  subscribeToPublishedApps(
    onSuccess: (apps: AppItem[]) => void,
    onError?: (err: any) => void
  ) {
    const q = query(collection(db, APPS_PATH), where('status', '==', 'published'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: AppItem[] = [];
        snapshot.forEach((d) => items.push(d.data() as AppItem));
        onSuccess(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, APPS_PATH);
      }
    );
  },

  async createApp(appData: Partial<AppItem>): Promise<AppItem> {
    const id = appData.id || (
      appData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)
    );

    const fullApp: AppItem = {
      id,
      name: appData.name || 'Untitled App',
      packageName: appData.packageName || `com.atlapps.${id.replace(/[^a-z0-9]/g, '')}`,
      version: appData.version || 'v1.0.0',
      versionCode: appData.versionCode || 1,
      fileSize: appData.fileSize || 25000000,
      fileSizeFormatted: appData.fileSizeFormatted || formatBytes(appData.fileSize || 25000000),
      apkUrl: appData.apkUrl || `/api/download/${id}`,
      fileName: appData.fileName || `${id}.apk`,
      sha256: appData.sha256 || undefined,
      category: appData.category || 'Tools',
      developer: appData.developer || 'ATL APPS STORE',
      iconUrl: appData.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80',
      shortDescription: appData.shortDescription || '',
      fullDescription: appData.fullDescription || '',
      changelog: appData.changelog || 'Initial release on ATL APPS STORE.',
      screenshots: appData.screenshots || [],
      minAndroid: appData.minAndroid || 'Android 8.0+ (Oreo or higher)',
      minSdk: appData.minSdk || 26,
      downloadCount: 0,
      status: appData.status || 'published',
      featured: Boolean(appData.featured),
      rating: 5.0,
      ratingCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, APPS_PATH, id), fullApp);
      return fullApp;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${APPS_PATH}/${id}`);
      throw error;
    }
  },

  async updateApp(id: string, updates: Partial<AppItem>): Promise<void> {
    try {
      const docRef = doc(db, APPS_PATH, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${APPS_PATH}/${id}`);
    }
  },

  async deleteApp(id: string, storagePath?: string): Promise<void> {
    try {
      await deleteDoc(doc(db, APPS_PATH, id));
      if (storagePath) {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef).catch(() => {});
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${APPS_PATH}/${id}`);
    }
  },

  async recordDownload(appId: string): Promise<void> {
    try {
      // Increment app download counter in Firestore
      const appRef = doc(db, APPS_PATH, appId);
      await updateDoc(appRef, {
        downloadCount: increment(1),
      }).catch(() => {});

      // Record telemetry event in download_events
      const eventId = `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      await setDoc(doc(db, DOWNLOAD_EVENTS_PATH, eventId), {
        id: eventId,
        appId,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    } catch {
      // Non-blocking download tracking
    }
  },

  // ==========================================
  // FIREBASE STORAGE (APKs & IMAGES)
  // ==========================================

  uploadApkToStorage(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ downloadUrl: string; storagePath: string; fileSize: number; fileSizeFormatted: string }> {
    return new Promise((resolve, reject) => {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueSuffix = `${Date.now()}_${cleanName}`;
      const storagePath = `apks/${uniqueSuffix}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: 'application/vnd.android.package-archive',
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(progress);
        },
        (error) => reject(error),
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              downloadUrl,
              storagePath,
              fileSize: file.size,
              fileSizeFormatted: formatBytes(file.size),
            });
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  },

  uploadMediaToStorage(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ downloadUrl: string; storagePath: string }> {
    return new Promise((resolve, reject) => {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `media/${Date.now()}_${cleanName}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'image/png',
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(progress);
        },
        (error) => reject(error),
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ downloadUrl, storagePath });
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  },

  // ==========================================
  // INITIAL SEEDING HELPER
  // ==========================================

  async seedInitialAppsIfEmpty(defaultApps: AppItem[]): Promise<void> {
    try {
      const q = query(collection(db, APPS_PATH), where('status', '==', 'published'));
      const existing = await getDocs(q);
      if (existing.empty && auth.currentUser) {
        for (const app of defaultApps) {
          await setDoc(doc(db, APPS_PATH, app.id), app).catch(() => {});
        }
      }
    } catch {
      // Ignore
    }
  },
};
