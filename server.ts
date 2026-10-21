import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'atl-apps-store-secret-2025';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'TAREK8461';

// Directories
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const APKS_DIR = path.resolve(UPLOADS_DIR, 'apks');
const IMAGES_DIR = path.resolve(UPLOADS_DIR, 'images');
const APPS_FILE = path.resolve(DATA_DIR, 'apps.json');
const CONFIG_FILE = path.resolve(DATA_DIR, 'config.json');

// Ensure directories exist
for (const dir of [DATA_DIR, UPLOADS_DIR, APKS_DIR, IMAGES_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Format byte size
function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Password hashing utilities using PBKDF2
function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, 'sha512').toString('hex');
  return { salt: actualSalt, hash };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

// Initialize config & admin password
interface StoreConfig {
  adminSalt: string;
  adminHash: string;
  activeSessions: { token: string; createdAt: number; expiresAt: number }[];
}

function loadConfig(): StoreConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    const { salt, hash } = hashPassword(DEFAULT_ADMIN_PASSWORD);
    const initialConfig: StoreConfig = {
      adminSalt: salt,
      adminHash: hash,
      activeSessions: [],
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(initialConfig, null, 2), 'utf-8');
    return initialConfig;
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    const { salt, hash } = hashPassword(DEFAULT_ADMIN_PASSWORD);
    const initialConfig: StoreConfig = {
      adminSalt: salt,
      adminHash: hash,
      activeSessions: [],
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(initialConfig, null, 2), 'utf-8');
    return initialConfig;
  }
}

function saveConfig(config: StoreConfig) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// Generate minimal valid ZIP APK binary
function createMinimalZipApk(appName: string, version: string): Buffer {
  const manifestContent = Buffer.from(
    `ATL-APPS-STORE-MANIFEST\nPackage: com.atlapps.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}\nVersion: ${version}\nPlatform: Android\nBuilt-By: ATL APPS STORE Cloud Builder\n`,
    'utf-8'
  );
  const classesContent = Buffer.from('DEX\n039\x00ATL_APP_BYTECODE_SIGNATURE', 'utf-8');

  const files = [
    { name: 'AndroidManifest.xml', data: manifestContent },
    { name: 'classes.dex', data: classesContent },
  ];

  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, 'utf-8');
    const crc = crc32(file.data);

    // Local file header (30 bytes + name + data)
    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // general flags
    localHeader.writeUInt16LE(0, 8); // compression method (0 = store)
    localHeader.writeUInt16LE(0x5280, 10); // file time
    localHeader.writeUInt16LE(0x56a0, 12); // file date
    localHeader.writeUInt32LE(crc, 14); // crc-32
    localHeader.writeUInt32LE(file.data.length, 18); // compressed size
    localHeader.writeUInt32LE(file.data.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuffer.length, 26); // file name length
    localHeader.writeUInt16LE(0, 28); // extra field length
    nameBuffer.copy(localHeader, 30);

    localHeaders.push(localHeader);
    localHeaders.push(file.data);

    // Central directory header (46 bytes + name)
    const centralHeader = Buffer.alloc(46 + nameBuffer.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(0, 10); // compression
    centralHeader.writeUInt16LE(0x5280, 12); // time
    centralHeader.writeUInt16LE(0x56a0, 14); // date
    centralHeader.writeUInt32LE(crc, 16); // crc-32
    centralHeader.writeUInt32LE(file.data.length, 20); // compressed size
    centralHeader.writeUInt32LE(file.data.length, 24); // uncompressed size
    centralHeader.writeUInt16LE(nameBuffer.length, 28); // name length
    centralHeader.writeUInt16LE(0, 30); // extra length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk number start
    centralHeader.writeUInt16LE(0, 36); // internal attrs
    centralHeader.writeUInt32LE(0, 38); // external attrs
    centralHeader.writeUInt32LE(offset, 42); // relative offset of local header
    nameBuffer.copy(centralHeader, 46);

    centralHeaders.push(centralHeader);

    offset += localHeader.length + file.data.length;
  }

  const centralDirSize = centralHeaders.reduce((sum, b) => sum + b.length, 0);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0); // signature
  endRecord.writeUInt16LE(0, 4); // disk number
  endRecord.writeUInt16LE(0, 6); // start disk
  endRecord.writeUInt16LE(files.length, 8); // records on disk
  endRecord.writeUInt16LE(files.length, 10); // total records
  endRecord.writeUInt32LE(centralDirSize, 12); // central dir size
  endRecord.writeUInt32LE(offset, 16); // central dir offset
  endRecord.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, endRecord]);
}

// CRC32 helper for ZIP creation
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// App item definition
export interface AppRecord {
  id: string;
  name: string;
  packageName: string;
  version: string;
  versionCode: number;
  fileSize: number;
  fileSizeFormatted: string;
  apkPath: string; // Relative path on disk or URL
  fileName: string;
  sha256?: string;
  category: 'Tools' | 'Entertainment' | 'Games' | 'Productivity' | 'Utilities' | 'Other';
  developer: string;
  iconUrl: string;
  shortDescription: string;
  fullDescription: string;
  changelog: string;
  screenshots: string[];
  minAndroid: string;
  minSdk: number;
  downloadCount: number;
  status: 'published' | 'draft';
  featured: boolean;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

// Initial default apps if empty
const DEFAULT_APPS: AppRecord[] = [
  {
    id: 'atl-file-commander',
    name: 'ATL File Commander',
    packageName: 'com.atlapps.filecommander',
    version: 'v2.8.4',
    versionCode: 284,
    fileSize: 24650000,
    fileSizeFormatted: '23.5 MB',
    apkPath: 'atl-file-commander-v2.8.4.apk',
    fileName: 'ATL-FileCommander-v2.8.4.apk',
    sha256: '9f83a21b34c1125d883901ba3e18a992bc018a4d7c8135be36209ef4129b110a',
    category: 'Tools',
    developer: 'ATL APPS STORE',
    iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80',
    shortDescription: 'Modern dual-pane Android file manager with cloud integration, archive extractor, and storage cleaner.',
    fullDescription: 'ATL File Commander is the ultimate file management suite for Android power users and everyday enthusiasts. Designed from the ground up for speed, elegance, and extreme privacy.\n\nKey Highlights:\n• Dual-pane view for effortless file drag and drop.\n• Root explorer mode with full read/write partition access.\n• Built-in compression tool for ZIP, RAR, 7Z, and TAR archives.\n• Direct Wi-Fi transfer between phone, PC, and TV without cables.\n• Secure encrypted vault with biometric fingerprint authentication.\n• Zero intrusive ads and zero trackers.',
    changelog: '• Optimized for Android 15 & 16 preview\n• Added fast background batch extraction\n• Enhanced Wi-Fi Direct file transfer speed by 40%\n• Fixed thumbnail cache clearing issue',
    screenshots: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    ],
    minAndroid: 'Android 8.0+ (Oreo or higher)',
    minSdk: 26,
    downloadCount: 14280,
    status: 'published',
    featured: true,
    rating: 4.9,
    ratingCount: 890,
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-02-18T14:30:00.000Z',
  },
  {
    id: 'atl-streamcast-pro',
    name: 'ATL StreamCast Pro',
    packageName: 'com.atlapps.streamcast',
    version: 'v4.1.0',
    versionCode: 410,
    fileSize: 38200000,
    fileSizeFormatted: '36.4 MB',
    apkPath: 'atl-streamcast-pro-v4.1.0.apk',
    fileName: 'ATL-StreamCastPro-v4.1.0.apk',
    sha256: '5a30df87b92134ca8e11a3b90df73bc450098f45a7b611c03498b5849d4128f0',
    category: 'Entertainment',
    developer: 'ATL APPS STORE',
    iconUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=240&auto=format&fit=crop&q=80',
    shortDescription: 'Ultra-low latency media streamer with 4K HDR playback, lossless audio equalizer, and DLNA/Chromecast support.',
    fullDescription: 'Experience audio and video entertainment like never before. ATL StreamCast Pro delivers hardware-accelerated decoding across MKV, MP4, AVI, FLAC, and WebM codecs with zero stutter.\n\nFeatures:\n• 10-band studio parametric audio equalizer with bass booster.\n• Picture-in-Picture floating video player for multitasking.\n• Subtitle auto-sync with OpenSubtitles API integration.\n• Background playback with screen off for audiobooks and music.\n• Cast smoothly to Android TV, Apple TV, FireStick, and Smart TVs.',
    changelog: '• Added AV1 hardware acceleration codec\n• New dark OLED pure black theme\n• Improved gesture volume and brightness controls',
    screenshots: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    ],
    minAndroid: 'Android 9.0+ (Pie or higher)',
    minSdk: 28,
    downloadCount: 28950,
    status: 'published',
    featured: true,
    rating: 4.8,
    ratingCount: 1450,
    createdAt: '2025-01-20T12:00:00.000Z',
    updatedAt: '2025-02-12T09:15:00.000Z',
  },
  {
    id: 'atl-speed-engine-3d',
    name: 'ATL Speed Engine 3D',
    packageName: 'com.atlapps.speedengine',
    version: 'v1.6.2',
    versionCode: 162,
    fileSize: 89400000,
    fileSizeFormatted: '85.2 MB',
    apkPath: 'atl-speed-engine-3d-v1.6.2.apk',
    fileName: 'ATL-SpeedEngine3D-v1.6.2.apk',
    sha256: 'e89f412a865b2d7c11f445890bda33246a81a7b6cf902315b87611df4289aa91',
    category: 'Games',
    developer: 'ATL APPS STORE',
    iconUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=240&auto=format&fit=crop&q=80',
    shortDescription: 'High-octane cyberpunk arcade racer featuring 120 FPS physics, customizable supercars, and offline career mode.',
    fullDescription: 'Feel the rush of neon city tracks at blistering speeds! ATL Speed Engine 3D brings console-grade graphics directly to your Android device.\n\nGame Features:\n• Full Vulkan API optimization for smooth 60/90/120 FPS rendering.\n• 18 customizable aerodynamic hypercars with realistic engine acoustics.\n• 12 neon-lit futuristic city and canyon tracks.\n• Complete offline campaign - no internet required.\n• Controller support for Xbox, PlayStation, and Razer Kishi.',
    changelog: '• Added 2 new cyberpunk hypercars\n• Upgraded vehicle physics and drift mechanics\n• Reduced memory usage on mid-range chipsets',
    screenshots: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    ],
    minAndroid: 'Android 10.0+ (Q or higher)',
    minSdk: 29,
    downloadCount: 42100,
    status: 'published',
    featured: true,
    rating: 4.9,
    ratingCount: 3200,
    createdAt: '2025-01-25T15:30:00.000Z',
    updatedAt: '2025-02-19T18:45:00.000Z',
  },
  {
    id: 'atl-secure-vault-notes',
    name: 'ATL Secure Vault & Notes',
    packageName: 'com.atlapps.vaultnotes',
    version: 'v3.2.1',
    versionCode: 321,
    fileSize: 18900000,
    fileSizeFormatted: '18.0 MB',
    apkPath: 'atl-secure-vault-notes-v3.2.1.apk',
    fileName: 'ATL-SecureVaultNotes-v3.2.1.apk',
    sha256: '7b80a13df5920a112c3f8471e98bb450a811c7849e521034f8126b890da34bc2',
    category: 'Productivity',
    developer: 'ATL APPS STORE',
    iconUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=240&auto=format&fit=crop&q=80',
    shortDescription: 'Zero-knowledge AES-256 encrypted notepad, password manager, and document safe with biometric unlock.',
    fullDescription: 'Your private thoughts, credentials, and confidential documents belong solely to you. ATL Secure Vault protects your critical data with local military-grade encryption.\n\nKey Capabilities:\n• End-to-end client-side AES-256 GCM encryption.\n• Biometric face & fingerprint unlock.\n• Self-destruct PIN trigger for emergency duress situations.\n• Markdown formatting, checklist tasks, and image attachments.\n• Encrypted backup and restore to local storage.',
    changelog: '• Added auto-lock on app switch\n• Support for rich markdown checklists\n• Enhanced password generator with entropy indicator',
    screenshots: [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    ],
    minAndroid: 'Android 8.0+ (Oreo or higher)',
    minSdk: 26,
    downloadCount: 9780,
    status: 'published',
    featured: false,
    rating: 4.8,
    ratingCount: 460,
    createdAt: '2025-02-01T08:00:00.000Z',
    updatedAt: '2025-02-15T11:20:00.000Z',
  },
  {
    id: 'atl-battery-ram-optimizer',
    name: 'ATL Battery & RAM Optimizer',
    packageName: 'com.atlapps.optimizer',
    version: 'v5.0.3',
    versionCode: 503,
    fileSize: 14200000,
    fileSizeFormatted: '13.5 MB',
    apkPath: 'atl-battery-ram-optimizer-v5.0.3.apk',
    fileName: 'ATL-BatteryRAMOptimizer-v5.0.3.apk',
    sha256: '3f19a820c7490b8123e45da890bc1294871a2845c0918e7631da548201bc9940',
    category: 'Utilities',
    developer: 'ATL APPS STORE',
    iconUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=240&auto=format&fit=crop&q=80',
    shortDescription: 'Real-time CPU thermal monitor, background task suspension, junk cache remover, and battery lifespan extender.',
    fullDescription: 'Keep your Android device operating as snappy as the first day you unboxed it. ATL Optimizer analyzes background processes and eliminates lingering ghost caches safely without touching personal user data.\n\nFeatures:\n• CPU temperature and throttle monitor with live graph.\n• One-touch dormant background process hibernation.\n• App cache cleaner with selective whitelist.\n• Battery health degradation estimator and charge limiter.\n• Lightweight footprint (< 15MB) with negligible battery consumption.',
    changelog: '• Added Android 15 process grouping\n• New ambient charging animation\n• Reduced CPU monitoring poll overhead to < 0.2%',
    screenshots: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    ],
    minAndroid: 'Android 8.0+ (Oreo or higher)',
    minSdk: 26,
    downloadCount: 19400,
    status: 'published',
    featured: false,
    rating: 4.7,
    ratingCount: 1120,
    createdAt: '2025-02-05T14:10:00.000Z',
    updatedAt: '2025-02-17T16:00:00.000Z',
  },
];

// Load apps database
function loadApps(): AppRecord[] {
  if (!fs.existsSync(APPS_FILE)) {
    fs.writeFileSync(APPS_FILE, JSON.stringify(DEFAULT_APPS, null, 2), 'utf-8');
    // Also create the actual sample APK files on disk
    for (const app of DEFAULT_APPS) {
      const apkFilePath = path.resolve(APKS_DIR, app.apkPath);
      if (!fs.existsSync(apkFilePath)) {
        const apkBuffer = createMinimalZipApk(app.name, app.version);
        fs.writeFileSync(apkFilePath, apkBuffer);
      }
    }
    return DEFAULT_APPS;
  }
  try {
    const apps: AppRecord[] = JSON.parse(fs.readFileSync(APPS_FILE, 'utf-8'));
    // Ensure default APK files exist on disk
    for (const app of apps) {
      if (app.apkPath && !app.apkPath.startsWith('http')) {
        const apkFilePath = path.resolve(APKS_DIR, app.apkPath);
        if (!fs.existsSync(apkFilePath)) {
          const apkBuffer = createMinimalZipApk(app.name, app.version);
          fs.writeFileSync(apkFilePath, apkBuffer);
        }
      }
    }
    return apps;
  } catch {
    fs.writeFileSync(APPS_FILE, JSON.stringify(DEFAULT_APPS, null, 2), 'utf-8');
    return DEFAULT_APPS;
  }
}

function saveApps(apps: AppRecord[]) {
  fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2), 'utf-8');
}

// IP-based download deduplication map (stores ip_appId -> timestamp)
const recentDownloads = new Map<string, number>();
const DEDUPE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

// Clean up stale download timestamps every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentDownloads.entries()) {
    if (now - timestamp > DEDUPE_WINDOW_MS) {
      recentDownloads.delete(key);
    }
  }
}, 30 * 60 * 1000);

// Admin Auth Helper & Middleware
function generateToken(): string {
  const random = crypto.randomBytes(32).toString('hex');
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(random).digest('hex');
  return `${random}.${hmac}`;
}

function verifyToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [random, hmac] = parts;
  const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(random).digest('hex');
  if (hmac !== expectedHmac) return false;

  const config = loadConfig();
  const session = config.activeSessions?.find((s) => s.token === token);
  if (!session) return false;
  if (session.expiresAt < Date.now()) {
    // Session expired
    config.activeSessions = config.activeSessions.filter((s) => s.token !== token);
    saveConfig(config);
    return false;
  }
  return true;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || !verifyToken(token)) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    return;
  }
  next();
}

// Multer Storage Configuration
const apkStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, APKS_DIR);
  },
  filename: (_req, file, cb) => {
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const ext = path.extname(cleanOriginalName) || '.apk';
    const base = path.basename(cleanOriginalName, ext);
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

const uploadApkMiddleware = multer({
  storage: apkStorage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250 MB limit for APK files
  fileFilter: (_req, file, cb) => {
    const isApk = file.originalname.toLowerCase().endsWith('.apk') ||
      file.mimetype === 'application/vnd.android.package-archive' ||
      file.mimetype === 'application/octet-stream';
    if (isApk) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only Android APK (.apk) files are permitted.'));
    }
  },
});

const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, IMAGES_DIR);
  },
  filename: (_req, file, cb) => {
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const ext = path.extname(cleanOriginalName) || '.png';
    const base = path.basename(cleanOriginalName, ext);
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

const uploadMediaMiddleware = multer({
  storage: mediaStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit for images
  fileFilter: (_req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/') ||
      /\.(png|jpe?g|webp|svg|gif)$/i.test(file.originalname);
    if (isImage) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only image files (PNG, JPG, WebP, SVG) are permitted.'));
    }
  },
});

// Middleware for parsing JSON and URL-encoded bodies
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static route for uploaded images and media
app.use('/uploads/images', express.static(IMAGES_DIR));

// ==========================================
// API ROUTES
// ==========================================

// 1. Health check & basic metadata
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    storeName: 'ATL APPS STORE',
    version: '1.0.0',
    platform: 'Android APK Distribution Hub',
  });
});

// 2. Authentication routes
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Password is required' });
    return;
  }

  const config = loadConfig();
  const isValid = verifyPassword(password, config.adminSalt, config.adminHash);

  if (!isValid) {
    res.status(401).json({ error: 'Invalid administrator credentials' });
    return;
  }

  const token = generateToken();
  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

  config.activeSessions = config.activeSessions || [];
  config.activeSessions.push({ token, createdAt: now, expiresAt });
  saveConfig(config);

  res.json({
    success: true,
    token,
    expiresAt,
    message: 'Welcome back, Administrator!',
  });
});

app.get('/api/auth/status', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token && verifyToken(token)) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    const config = loadConfig();
    config.activeSessions = (config.activeSessions || []).filter((s) => s.token !== token);
    saveConfig(config);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/change-password', requireAdmin, (req, res) => {
  const { newPassword, currentPassword } = req.body;
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long' });
    return;
  }

  const config = loadConfig();
  if (currentPassword) {
    const matchesCurrent = verifyPassword(currentPassword, config.adminSalt, config.adminHash);
    if (!matchesCurrent) {
      res.status(400).json({ error: 'Current password verification failed' });
      return;
    }
  }

  const { salt, hash } = hashPassword(newPassword);
  config.adminSalt = salt;
  config.adminHash = hash;
  saveConfig(config);

  res.json({ success: true, message: 'Administrator password updated successfully' });
});

// 3. Applications List & Search
app.get('/api/apps', (req, res) => {
  const { q, category, sort, status } = req.query;
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const isAdmin = token ? verifyToken(token) : false;

  let apps = loadApps();

  // If not admin, only show published apps
  if (!isAdmin) {
    apps = apps.filter((app) => app.status === 'published');
  } else if (status && (status === 'published' || status === 'draft')) {
    apps = apps.filter((app) => app.status === status);
  }

  // Filter by category
  if (category && category !== 'All') {
    apps = apps.filter((app) => app.category.toLowerCase() === (category as string).toLowerCase());
  }

  // Search by query (app name, package name, developer, short description)
  if (q && typeof q === 'string' && q.trim()) {
    const query = q.trim().toLowerCase();
    apps = apps.filter(
      (app) =>
        app.name.toLowerCase().includes(query) ||
        app.packageName.toLowerCase().includes(query) ||
        app.developer.toLowerCase().includes(query) ||
        app.shortDescription.toLowerCase().includes(query) ||
        app.category.toLowerCase().includes(query)
    );
  }

  // Sort
  if (sort === 'downloads') {
    apps.sort((a, b) => b.downloadCount - a.downloadCount);
  } else if (sort === 'alphabetical') {
    apps.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // default: latest
    apps.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Format public response
  const mapped = apps.map((app) => ({
    ...app,
    apkUrl: `/api/download/${app.id}`,
  }));

  res.json(mapped);
});

// 4. Single App Details
app.get('/api/apps/:id', (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const isAdmin = token ? verifyToken(token) : false;

  const apps = loadApps();
  const found = apps.find((a) => a.id === id);

  if (!found) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  if (found.status === 'draft' && !isAdmin) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  res.json({
    ...found,
    apkUrl: `/api/download/${found.id}`,
  });
});

// 5. Download APK & Track Download Event
app.get('/api/download/:id', (req, res) => {
  const { id } = req.params;
  const apps = loadApps();
  const appIndex = apps.findIndex((a) => a.id === id);

  if (appIndex === -1) {
    res.status(404).send('Application not found');
    return;
  }

  const appItem = apps[appIndex];

  // Prevent repeated spam requests from inflating download counts
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
  const dedupeKey = `${clientIp}_${id}`;
  const lastDownloadTime = recentDownloads.get(dedupeKey);
  const now = Date.now();

  if (!lastDownloadTime || now - lastDownloadTime > DEDUPE_WINDOW_MS) {
    recentDownloads.set(dedupeKey, now);
    appItem.downloadCount = (appItem.downloadCount || 0) + 1;
    apps[appIndex] = appItem;
    saveApps(apps);
  }

  // Determine file path
  let filePath = path.resolve(APKS_DIR, appItem.apkPath);

  // If local file doesn't exist, create it dynamically
  if (!fs.existsSync(filePath)) {
    const fallbackBuffer = createMinimalZipApk(appItem.name, appItem.version);
    fs.writeFileSync(filePath, fallbackBuffer);
  }

  const fileName = appItem.fileName || `${appItem.name.replace(/\s+/g, '_')}-${appItem.version}.apk`;
  const stat = fs.statSync(filePath);

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// 6. Upload APK Endpoint (Admin only)
app.post('/api/upload/apk', requireAdmin, (req, res) => {
  uploadApkMiddleware.single('apk')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message || 'APK upload failed' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No APK file uploaded' });
      return;
    }

    const filePath = req.file.path;
    const fileStats = fs.statSync(filePath);

    // Calculate sha256 checksum
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    res.json({
      success: true,
      apkPath: req.file.filename,
      originalName: req.file.originalname,
      fileSize: fileStats.size,
      fileSizeFormatted: formatBytes(fileStats.size),
      sha256: hash,
    });
  });
});

// 7. Upload Media (Icon & Screenshots) Endpoint (Admin only)
app.post('/api/upload/media', requireAdmin, (req, res) => {
  uploadMediaMiddleware.single('image')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message || 'Media upload failed' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No image file uploaded' });
      return;
    }

    const imageUrl = `/uploads/images/${req.file.filename}`;
    res.json({
      success: true,
      imageUrl,
      fileName: req.file.filename,
    });
  });
});

// 8. Create Application (Admin only)
app.post('/api/apps', requireAdmin, (req, res) => {
  try {
    const {
      name,
      packageName,
      version,
      versionCode,
      fileSize,
      fileSizeFormatted,
      apkPath,
      fileName,
      sha256,
      category,
      developer,
      iconUrl,
      shortDescription,
      fullDescription,
      changelog,
      screenshots,
      minAndroid,
      minSdk,
      status,
      featured,
    } = req.body;

    if (!name || !version || !category || !apkPath) {
      res.status(400).json({ error: 'Name, version, category, and APK file are required' });
      return;
    }

    const apps = loadApps();
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const now = new Date().toISOString();
    const newApp: AppRecord = {
      id,
      name: name.trim(),
      packageName: packageName?.trim() || `com.atlapps.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      version: version.trim().startsWith('v') ? version.trim() : `v${version.trim()}`,
      versionCode: versionCode ? parseInt(versionCode, 10) : 1,
      fileSize: Number(fileSize) || 25000000,
      fileSizeFormatted: fileSizeFormatted || formatBytes(Number(fileSize) || 25000000),
      apkPath: apkPath.trim(),
      fileName: fileName?.trim() || `${name.trim().replace(/\s+/g, '_')}-${version.trim()}.apk`,
      sha256: sha256 || undefined,
      category: category || 'Tools',
      developer: developer?.trim() || 'ATL APPS STORE',
      iconUrl: iconUrl?.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80',
      shortDescription: shortDescription?.trim() || '',
      fullDescription: fullDescription?.trim() || '',
      changelog: changelog?.trim() || 'Initial public release on ATL APPS STORE.',
      screenshots: Array.isArray(screenshots) ? screenshots : [],
      minAndroid: minAndroid?.trim() || 'Android 8.0+ (Oreo or higher)',
      minSdk: minSdk ? parseInt(minSdk, 10) : 26,
      downloadCount: 0,
      status: status === 'draft' ? 'draft' : 'published',
      featured: Boolean(featured),
      rating: 5.0,
      ratingCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    apps.unshift(newApp);
    saveApps(apps);

    res.status(201).json({
      success: true,
      app: {
        ...newApp,
        apkUrl: `/api/download/${newApp.id}`,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create application' });
  }
});

// 9. Update Application (Admin only)
app.put('/api/apps/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const apps = loadApps();
    const index = apps.findIndex((a) => a.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const current = apps[index];
    const updates = req.body;

    const updatedApp: AppRecord = {
      ...current,
      ...updates,
      id: current.id, // prevent ID change
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };

    if (updates.fileSize && !updates.fileSizeFormatted) {
      updatedApp.fileSizeFormatted = formatBytes(Number(updates.fileSize));
    }

    apps[index] = updatedApp;
    saveApps(apps);

    res.json({
      success: true,
      app: {
        ...updatedApp,
        apkUrl: `/api/download/${updatedApp.id}`,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update application' });
  }
});

// 10. Delete Application (Admin only)
app.delete('/api/apps/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let apps = loadApps();
    const target = apps.find((a) => a.id === id);

    if (!target) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    // Try deleting local apk file if exists and not default
    if (target.apkPath && !target.apkPath.startsWith('http')) {
      const localFilePath = path.resolve(APKS_DIR, target.apkPath);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch {
          // Ignore deletion error
        }
      }
    }

    apps = apps.filter((a) => a.id !== id);
    saveApps(apps);

    res.json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete application' });
  }
});

// 11. Admin Statistics Endpoint
app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const apps = loadApps();
  const totalDownloads = apps.reduce((sum, a) => sum + (a.downloadCount || 0), 0);
  const totalStorageBytes = apps.reduce((sum, a) => sum + (a.fileSize || 0), 0);

  const categoryBreakdown: Record<string, number> = {};
  for (const a of apps) {
    categoryBreakdown[a.category] = (categoryBreakdown[a.category] || 0) + 1;
  }

  const topDownloaded = [...apps]
    .sort((a, b) => b.downloadCount - a.downloadCount)
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      name: a.name,
      downloads: a.downloadCount,
      iconUrl: a.iconUrl,
    }));

  res.json({
    totalDownloads,
    totalApps: apps.length,
    publishedApps: apps.filter((a) => a.status === 'published').length,
    draftApps: apps.filter((a) => a.status === 'draft').length,
    totalStorageBytes,
    totalStorageFormatted: formatBytes(totalStorageBytes),
    categoryBreakdown,
    topDownloaded,
  });
});

// ==========================================
// CLIENT SERVING (Dev & Prod)
// ==========================================

async function setupServer() {
  // Ensure default apps and sample apks are primed
  loadApps();
  loadConfig();

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ATL APPS STORE full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start ATL APPS STORE server:', err);
  process.exit(1);
});
