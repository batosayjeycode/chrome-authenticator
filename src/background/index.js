/**
 * Background Service Worker (MV3)
 * Responsibilities:
 * - Register context menu "Scan QR Code" on right-click images
 * - Store pending QR scan image URL in session storage
 */

const CONTEXT_MENU_ID = 'authenticator_scan_qr';

// Register context menu on install and startup
function registerContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: '🔐 Scan QR Code (Authenticator)',
      contexts: ['image'],
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  registerContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  registerContextMenu();
});

// Handle context menu click — store image URL for popup to pick up
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === CONTEXT_MENU_ID && info.srcUrl) {
    chrome.storage.session.set({
      pendingQrScan: {
        url: info.srcUrl,
        timestamp: Date.now(),
      },
    });
  }
});
