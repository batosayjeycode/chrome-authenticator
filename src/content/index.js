/**
 * Content Script
 * Runs on all pages. Listens for messages from the popup
 * to scan QR codes found in the page's images.
 */
import jsQR from 'jsqr';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'SCAN_QR_FROM_PAGE') {
    scanAllImagesOnPage()
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }
});

async function scanAllImagesOnPage() {
  const images = Array.from(document.querySelectorAll('img'));
  if (images.length === 0) {
    return { success: false, error: 'No images found on this page' };
  }

  for (const img of images) {
    if (!img.complete || img.naturalWidth === 0) continue;
    try {
      const data = await decodeQrFromImgElement(img);
      if (data) return { success: true, data };
    } catch {
      continue;
    }
  }

  return { success: false, error: 'No QR code detected in page images' };
}

function decodeQrFromImgElement(imgEl) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = imgEl.naturalWidth;
    canvas.height = imgEl.naturalHeight;
    const ctx = canvas.getContext('2d');
    try {
      ctx.drawImage(imgEl, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, canvas.width, canvas.height);
      resolve(result ? result.data : null);
    } catch {
      resolve(null); // Cross-origin image, skip
    }
  });
}
