/**
 * Lazy Library Loader
 *
 * Utilities for lazy loading heavy libraries only when needed.
 * This reduces the initial bundle size significantly.
 *
 * Libraries:
 * - xlsx: ~7.3MB (Excel processing)
 * - jspdf: ~29MB (PDF generation)
 * - qrcode.vue: ~100KB (QR code generation)
 * - html2canvas: Large (HTML to canvas conversion)
 */

// Excel/Spreadsheet Libraries
let xlsxLib: any = null;
let xlsxStyleLib: any = null;

export async function loadExcelLibraries() {
  if (!xlsxLib) {
    const [xlsx, xlsxStyle] = await Promise.all([
      import('xlsx'),
      import('xlsx-js-style'),
    ]);
    xlsxLib = xlsx;
    xlsxStyleLib = xlsxStyle;
  }
  return { xlsx: xlsxLib, xlsxStyle: xlsxStyleLib };
}

// PDF Generation Libraries
let jsPDFLib: any = null;
let html2canvasLib: any = null;

export async function loadPDFLibraries() {
  if (!jsPDFLib) {
    const [jspdf, html2canvas] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    jsPDFLib = jspdf;
    html2canvasLib = html2canvas;
  }
  return { jsPDF: jsPDFLib, html2canvas: html2canvasLib };
}

// QR Code Library
let qrcodeLib: any = null;

export async function loadQRCodeLibrary() {
  if (!qrcodeLib) {
    qrcodeLib = await import('qrcode.vue');
  }
  return qrcodeLib;
}

// Draggable Library
let draggableLib: any = null;

export async function loadDraggableLibrary() {
  if (!draggableLib) {
    draggableLib = await import('vuedraggable');
  }
  return draggableLib;
}

// Combined loader for components that need multiple libraries
export async function loadImportDialogLibraries() {
  return await loadExcelLibraries();
}

export async function loadReportGenerationLibraries() {
  const [excel, pdf] = await Promise.all([
    loadExcelLibraries(),
    loadPDFLibraries(),
  ]);
  return { ...excel, ...pdf };
}

// Utility to check if a library is already loaded
export function isLibraryLoaded(libraryName: 'xlsx' | 'jspdf' | 'qrcode' | 'draggable'): boolean {
  switch (libraryName) {
    case 'xlsx':
      return xlsxLib !== null;
    case 'jspdf':
      return jsPDFLib !== null;
    case 'qrcode':
      return qrcodeLib !== null;
    case 'draggable':
      return draggableLib !== null;
    default:
      return false;
  }
}

// Reset cache (for testing/development)
export function resetLibraryCache() {
  xlsxLib = null;
  xlsxStyleLib = null;
  jsPDFLib = null;
  html2canvasLib = null;
  qrcodeLib = null;
  draggableLib = null;
}

export default {
  loadExcelLibraries,
  loadPDFLibraries,
  loadQRCodeLibrary,
  loadDraggableLibrary,
  loadImportDialogLibraries,
  loadReportGenerationLibraries,
  isLibraryLoaded,
  resetLibraryCache,
};
