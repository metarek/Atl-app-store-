export type AppCategory = 
  | 'Tools' 
  | 'Entertainment' 
  | 'Games' 
  | 'Productivity' 
  | 'Utilities' 
  | 'Other';

export interface AppItem {
  id: string;
  name: string;
  packageName: string;
  version: string;
  versionCode: number;
  fileSize: number; // in bytes
  fileSizeFormatted: string; // e.g. "18.5 MB"
  apkUrl: string; // Relative download URL or external storage link
  fileName: string; // original filename e.g. "ATL-Tools-v1.0.apk"
  sha256?: string; // APK SHA-256 integrity hash
  category: AppCategory;
  developer: string;
  iconUrl: string;
  shortDescription: string;
  fullDescription: string;
  changelog: string;
  screenshots: string[];
  minAndroid: string; // e.g. "Android 8.0+ (Oreo)"
  minSdk: number; // e.g. 26
  downloadCount: number;
  status: 'published' | 'draft';
  featured: boolean;
  rating: number; // e.g. 4.9
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DownloadStats {
  totalDownloads: number;
  totalApps: number;
  publishedApps: number;
  draftApps: number;
  totalStorageBytes: number;
  categoryBreakdown: Record<string, number>;
  topDownloaded: { id: string; name: string; downloads: number; iconUrl: string }[];
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}
