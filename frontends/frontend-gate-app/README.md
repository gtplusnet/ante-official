# School Gatekeep - Development Guide

## Overview

School Gatekeep is a comprehensive attendance management system developed as a **web application using Next.js**. It is designed to run in any modern web browser, providing a seamless experience on desktops, tablets, and mobile devices.

The application leverages **IndexedDB** for robust client-side storage, enabling offline functionality and fast data retrieval. While it is primarily a web-based solution, it is architected to be compatible with wrappers like Capacitor or Cordova, allowing it to be built into an **Android APK** for native deployment.

## Core Features

- **Web-First Architecture**: Built with Next.js for high performance and scalability.
- **Client-Side Storage**: Uses **IndexedDB** to store data locally, enabling offline access and reducing server load.
- **Optional Mobile Build**: Can be packaged into a native Android application for a store-friendly presence.
- **License Key Authentication**: Secure setup process to link the application to a specific account.
- **Real-time Data Sync**: Synchronizes attendance data with the central server at `https://ante.geertest.com/`.

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: JavaScript / TypeScript
- **Client-Side Storage**: [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- **Real-time Communication**: WebSockets
- **Mobile Packaging (Optional)**: Can be wrapped with [Capacitor](https://capacitorjs.com/) or similar tools.

## Modules

The application is composed of two primary modules, which are implemented as components within the Next.js architecture.

### 📱 Scan Module
This module uses the device's camera to scan QR codes for attendance.

- **QR Code Scanning**: Utilizes the browser's WebRTC API to access the camera and scan QR codes in real-time.
- **Instant Recognition**: By checking the scanned ID against the local IndexedDB, the app can immediately identify students, guardians, and teachers.
- **Offline-First Attendance Recording**: New scans are temporarily stored in the local IndexedDB, which is particularly useful when there is no internet. The application automatically syncs these records to the remote server as soon as an internet connection is detected.

### 📺 TV Module
This module displays attendance history on a large screen, perfect for tablets connected to projectors. **This module requires an active internet connection and is not accessible offline.**

- **Live Data Stream**: Connects directly to the server via a WebSocket to receive and display information in real-time as it is sent.
- **Real-time Display**: Shows the most recently scanned person and a history of recent scans.
- **Data-Driven**: Reads data directly from the server.
- **Responsive Design**: Adapts to various screen sizes and supports a full-screen display mode.

## Data Storage & Synchronization

### IndexedDB (Local Storage)
The application adopts a local-first approach for the Scan Module by using the browser's IndexedDB to store two main types of data:
1.  **User Profiles**: A local copy of student, guardian, and teacher information. This allows the Scan Module to instantly identify an individual when a QR code is scanned, providing a fast and reliable experience even without an internet connection.
2.  **Attendance Records**: All new time-in/time-out events are saved to IndexedDB immediately. This is useful when there is no internet, as records are temporarily stored locally and then synced automatically when a connection is re-established.

This design ensures the application remains functional and responsive regardless of network connectivity.

### Server Synchronization
A background process handles data synchronization with the central server at `https://ante.geertest.com/`:
-   **Uploading**: New attendance records that are temporarily stored in IndexedDB are automatically sent to the server as soon as an internet connection is detected.
-   **Downloading**: The local database of students, guardians, and teachers is kept up-to-date by periodically fetching changes from the server.

## Development Workflow

### Environment Setup

#### Prerequisites
- Node.js 20+
- Yarn package manager
- PM2 (installed globally): `npm install -g pm2`

#### Installation
```bash
yarn install
```

#### Development with PM2 (Recommended)
```bash
# From project root - starts all services including Gate App
cd ../..
yarn dev
# Gate App runs on http://localhost:9002

# View Gate App logs
yarn logs:gate-app

# Or start Gate App only (requires backend to be running)
yarn dev -p 9002
```

#### Legacy Development (Direct Next.js)
```bash
yarn dev -p 9002
# Runs on http://localhost:9002
```

#### Additional Setup
This is a standard Next.js project with Tailwind CSS configured. The setup involves:
1. Installing the required npm dependencies (done above)
2. Tailwind CSS is pre-configured with `tailwind.config.js` and `postcss.config.js`
3. Base directives are already added to the global stylesheet

The development server provides hot-reloading for rapid development.

### Building for Production
The project includes scripts to build an optimized version of the application for production deployment. This process bundles the code, optimizes assets, and prepares the application to be served statically or via a Node.js server.

## Optional Mobile Build

The web application is designed to be packaged into a native Android application using a web-to-native wrapper like Capacitor.

The general process involves:
1.  Generating a static export of the Next.js application.
2.  Using the Capacitor CLI to add the necessary Android platform configuration.
3.  Syncing the static web build with the native Android project.
4.  Building the final Android APK using Android Studio.

For detailed instructions, refer to the official documentation for Next.js and Capacitor.

## Browser Compatibility

- **Chrome** (version 60+)
- **Firefox** (version 55+)
- **Safari** (version 11+)
- **Edge** (Chromium, version 79+)

## Permissions (Browser)

The web application will request the following browser permissions:
- **Camera**: Required for the Scan Module to scan QR codes. Must be granted over an HTTPS connection.
- **Notifications**: Optional, for sending real-time updates.

---

**Note**: This is a web application designed for educational institutions and requires proper licensing.