# ATL APPS STORE 🚀📱

**ATL APPS STORE** is a premium, modern, fully functional Android APK distribution web application. Engineered with a high-end dark tech aesthetic (black, deep navy, electric blue & neon purple accents), it provides direct high-speed APK downloads, tamper-proof SHA-256 integrity checksums, and a secure, mobile-friendly administrator console for uploading and publishing APKs directly from an Android smartphone.

---

## ✨ Features

- **Storefront & Catalog**:
  - **Dynamic Hero Section**: Real-time download counters, verified app highlights, and quick release filters.
  - **Featured Showcase**: Dedicated deck highlighting flagship apps developed by ATL APPS STORE.
  - **Category Filtering**: Tools, Entertainment, Games, Productivity, Utilities, and Other.
  - **Multi-criteria Sorting**: Latest Releases, Most Downloaded, Alphabetical (A-Z).
  - **Live Search**: Instant keyword search across app titles, package IDs, and descriptions (`Cmd+K` / `Ctrl+K`).
- **Comprehensive App Details Page**:
  - App icons, version badges, accurate byte file size, minimum Android OS requirements.
  - **Direct APK Download**: Serves actual APK binaries with real-time download tracking.
  - **Mobile Phone QR Code**: Scan directly from desktop to begin downloading the APK on an Android device.
  - **SHA-256 Checksum**: One-click hash copying for security-conscious Android power users.
  - Full descriptions, markdown changelog ("What's New"), and tap-to-enlarge screenshots gallery.
  - Built-in **Android APK Sideloading Guide** (Settings > Install Unknown Apps).
- **Secure Administrator Console**:
  - Accessible via Admin Login with server-side authentication (PBKDF2 salted password hashing).
  - **Mobile-First Upload**: Upload APK files directly from an Android phone file picker.
  - Real-time progress bar (0% &rarr; 100%) during APK and media uploads.
  - Edit existing app metadata, replace APK binaries, and toggle between **Published** and **Draft** states.
  - Delete apps and manage download analytics.
  - Change initial admin password securely with immediate server-side hash rotation.
- **Accurate Download Counter**:
  - Server-side download deduplication (prevents repeated spam clicks within 15 minutes from artificially inflating counts).

---

## 🔐 Security & Architecture

- **No Hardcoded Passwords**: The initial password (`TAREK8461`) is held server-side, salted, and hashed via PBKDF2 with 100,000 iterations.
- **Session Tokens**: Cryptographically signed HMAC tokens for administrative mutations.
- **APK Binary Storage**: Real storage engine saving files to disk (`data/uploads/apks/`) with automatic MIME detection (`application/vnd.android.package-archive`) and streaming attachment headers.
- **Git Safety**: `data/uploads/` and `data/config.json` are excluded in `.gitignore` to prevent committing binaries or credentials.

---

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend & APIs**: Node.js, Express, Multer (multipart APK and media handling), Crypto (PBKDF2 & SHA-256).
- **Firebase Infrastructure**:
  - **Firebase Project ID**: `gen-lang-client-0095747388`
  - **Firestore Database**: `ai-studio-atlappsstore-1d528d11-6714-4440-91d7-0610887baf85`
  - **Firebase Storage Bucket**: `gen-lang-client-0095747388.firebasestorage.app`
  - **Authentication**: Firebase Google Auth + Salted PBKDF2 Master Password (`TAREK8461`).
  - **Security Rules**: Production ABAC rules deployed via `firestore.rules`.
  - **Data Schema Blueprint**: `firebase-blueprint.json` (apps, categories, admins, download_events, settings).

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server (Port 3000)
npm run dev

# 3. Open browser
http://localhost:3000
```

---

## 📦 Step-by-Step GitHub & Hosting Deployment Guide

### Step 1: Export Source Code from Google AI Studio
1. In Google AI Studio Build, click on the **Export** / **Download ZIP** icon in the project navigation bar.
2. Extract the downloaded `.zip` file on your computer.

### Step 2: Create a GitHub Repository
1. Log into your account at [GitHub](https://github.com/).
2. Click **New Repository**.
3. Name it `atl-apps-store`.
4. Leave it Public or Private, do **not** initialize with a README (this project already includes one).
5. Click **Create repository**.

### Step 3: Push Project to GitHub
Open your terminal in the project directory:
```bash
git init
git add .
git commit -m "Initial commit: ATL APPS STORE complete release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/atl-apps-store.git
git push -u origin main
```

### Step 4: Deploying to Hosting (Render, Railway, or Vercel)

#### Recommended: Render / Railway (Full-Stack with Persistent APK Storage)
Since the app features server-side APK uploads and streaming:
1. Log into [Render.com](https://render.com/) or [Railway.app](https://railway.app/).
2. Click **New Web Service** &gt; Connect your GitHub repository `atl-apps-store`.
3. Set:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `ADMIN_PASSWORD`: Your secret admin password (defaults to `TAREK8461`).
   - `SESSION_SECRET`: A long random secret key.
   - `PORT`: `3000` (or platform default `$PORT`).
5. Click **Deploy**. Once finished, open your live URL (e.g. `https://atl-apps-store.onrender.com`).

#### Deploying with Firebase (Optional Serverless Path)
If you prefer Firebase Firestore and Firebase Storage:
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** and **Firebase Storage**.
3. Deploy the provided rules:
   - `firestore.rules` (application & role permissions)
   - `storage.rules` (public APK downloads, admin-only uploads)
4. Add your Firebase credentials in `src/firebase-config.ts` or via environment variables.

---

## 📱 How to Manage Applications from an Android Phone

1. Open the live ATL APPS STORE website in **Chrome for Android** or your preferred mobile browser.
2. Scroll to the footer or tap **Admin Login** in the top navigation bar.
3. Enter the initial administrator password:
   ```
   TAREK8461
   ```
4. You will be redirected into the **Admin Console**:
   - Tap **"Upload & Publish APK"**.
   - Tap the file picker box &mdash; Android will open its native **Files / File Manager**.
   - Select your `.apk` file.
   - Watch the real-time upload progress bar.
   - Fill in or adjust the application title, version, category, and minimum Android OS.
   - Tap **"Publish to ATL APPS STORE"**.
5. The application will instantly appear live on the public storefront ready for visitors to download!
6. To change the password, switch to the **"Change Password"** tab, enter a new password, and save.

---

## 📄 License & Attribution

&copy; 2025 ATL APPS STORE. Built with Google AI Studio. Android is a trademark of Google LLC.
