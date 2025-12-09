# MediaPicGen (AI Text Gen Tool)

This is a desktop application developed with Electron, React, and Fabric.js, designed to provide convenient image text editing and batch processing capabilities.

## ✨ Key Features

*   **Visual Canvas Editing**: Drag and drop to import images, freely add and edit text objects.
*   **Text Property Adjustment**: Real-time adjustment of text font, size, color, position, etc.
*   **Batch Processing**: Support importing multiple images at once, automatically applying the designed text template to all images.
*   **One-Click Export**:
    *   Single Export: Save the currently edited image directly.
    *   Batch Export: Automatically packaged as a ZIP file for download after processing.

## 🛠️ Tech Stack

*   **Core Framework**: [Electron](https://www.electronjs.org/) + [React](https://react.dev/)
*   **Backend Logic**: [n8n](https://n8n.io/) (Workflow Orchestration)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Language**: TypeScript
*   **Graphics Processing**: [Fabric.js](http://fabricjs.com/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) (Icons)
*   **Utilities**:
    *   `jszip`: For file compression during batch export.
    *   `file-saver`: For file saving.

## 🚀 Quick Start

### Prerequisites

*   Node.js (v16+ recommended)
*   pnpm (recommended) or npm/yarn

### Install Dependencies

```bash
pnpm install
```

### Development

Start both Vite dev server and Electron app:

```bash
pnpm run dev
```

### Build & Package

#### Windows One-Click Build (Recommended)

A `build.bat` script is provided in the project root. Simply double-click it to complete the entire build process.

1.  Double-click `build.bat`.
2.  The script will automatically clean old files, compile code, and package the application.
3.  Upon completion, the executable is located at `release-packager/MediaPicGen-win32-x64/MediaPicGen.exe`.

#### Manual Build

If you prefer to run steps manually:

```bash
# 1. Compile source code
pnpm run compile

# 2. Package application
# Ensure electron-packager is installed
pnpm exec electron-packager . MediaPicGen --platform=win32 --arch=x64 --out=release-packager --overwrite
```

## 📂 Project Structure

```
├── electron/        # Electron main process code
├── src/             # React renderer process code
│   ├── components/  # UI Components (Sidebar, PropertyPanel, BatchPanel)
│   ├── hooks/       # Custom Hooks (useFabric)
│   ├── App.tsx      # Main application logic
│   └── main.tsx     # Entry file
├── dist-electron/   # Electron compilation output
├── package.json     # Project dependencies and scripts
└── README.md        # Project documentation
```

## 📝 Usage Guide

1.  **Import Base Image**: Click the "Upload Image" button on the left sidebar to select an image as the background.
2.  **Add Text**: Click the "Add Text" button to create an editable text box on the canvas.
3.  **Adjust Styles**: Select text and adjust size, color, font, etc., in the right property panel.
4.  **Batch Processing**:
    *   Switch to the "Batch" panel.
    *   Import multiple images to be processed.
    *   Click "Start Batch Processing". The program will apply the current text styles to all imported images and automatically download a ZIP package.

## 📄 License

MIT
