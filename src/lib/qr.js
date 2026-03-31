/**
 * QR Code URI Parser
 * Parses otpauth://totp/... URIs from QR codes
 */

/**
 * Parse an otpauth:// URI into account data
 * @param {string} uri
 * @returns {{ type, issuer, label, secret, algorithm, digits, period }}
 */
export function parseOtpAuthUri(uri) {
  if (!uri.startsWith('otpauth://')) {
    throw new Error('Invalid OTP Auth URI — must start with otpauth://');
  }

  let url;
  try {
    url = new URL(uri);
  } catch {
    throw new Error('Malformed OTP Auth URI');
  }

  const type = url.hostname; // 'totp' or 'hotp'
  const rawLabel = decodeURIComponent(url.pathname.slice(1));

  let issuer = url.searchParams.get('issuer') || '';
  let label = rawLabel;

  // Label format: "Issuer:Account" or just "Account"
  if (rawLabel.includes(':')) {
    const colonIdx = rawLabel.indexOf(':');
    const labelIssuer = rawLabel.slice(0, colonIdx).trim();
    label = rawLabel.slice(colonIdx + 1).trim();
    if (!issuer) issuer = labelIssuer;
  }

  const secret = url.searchParams.get('secret') || '';
  if (!secret) throw new Error('Missing secret key in OTP URI');

  return {
    type,
    issuer,
    label,
    secret: secret.toUpperCase().replace(/\s/g, ''),
    algorithm: url.searchParams.get('algorithm') || 'SHA-1',
    digits: parseInt(url.searchParams.get('digits') || '6', 10),
    period: parseInt(url.searchParams.get('period') || '30', 10),
  };
}

/**
 * Decode QR Code from an ImageData using jsQR
 * @param {ImageData} imageData
 * @returns {string|null} QR code data string or null
 */
export async function decodeQrFromImageData(imageData) {
  const jsQR = (await import('jsqr')).default;
  const result = jsQR(imageData.data, imageData.width, imageData.height);
  return result ? result.data : null;
}

/**
 * Decode QR Code from an image URL (fetches and processes)
 * @param {string} url
 * @returns {string|null}
 */
export async function decodeQrFromUrl(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return decodeQrFromBlob(blob);
}

/**
 * Decode QR Code from a File or Blob
 * @param {Blob} blob
 * @returns {string|null}
 */
export function decodeQrFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        import('jsqr').then(({ default: jsQR }) => {
          const result = jsQR(imageData.data, canvas.width, canvas.height);
          resolve(result ? result.data : null);
        }).catch(reject);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
