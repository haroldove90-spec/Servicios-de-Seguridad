/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';

/**
 * Generates a high-quality QR code data URL with a custom logo embedded in the center.
 * Uses High error correction level ('H') to ensure readability even with the logo overlay.
 * 
 * @param text The payload content of the QR code.
 * @param logoUrl The absolute URL pointing to the logo image.
 * @returns A promise that resolves to the Base64 image data URL.
 */
export async function generateQRWithLogo(
  text: string, 
  logoUrl: string = 'https://cossma.com.mx/cnls.png'
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create an offline canvas
    const canvas = document.createElement('canvas');
    
    // 1. Generate the base QR code onto the canvas
    // We use errorCorrectionLevel 'H' (High - up to 30% of data damage/overlay resistance)
    QRCode.toCanvas(canvas, text, {
      width: 480,
      margin: 2,
      color: {
        dark: '#0f172a',  // slate-900 (deep aesthetic charcoal)
        light: '#ffffff', // white background
      },
      errorCorrectionLevel: 'H'
    }, (error) => {
      if (error) {
        reject(error);
        return;
      }
      
      // 2. Load the logo image
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Gracefully support CORS
      
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(canvas.toDataURL('image/png'));
          return;
        }
        
        const qrSize = canvas.width;
        // Perfect proportional size for 22% of QR code size, leaving the outer patterns fully readable
        const logoSize = qrSize * 0.22; 
        const x = (qrSize - logoSize) / 2;
        const y = (qrSize - logoSize) / 2;
        
        // Draw a soft rounded, clean white container for the logo shielding key QR pixels
        const padding = 8;
        const bgX = x - padding;
        const bgY = y - padding;
        const bgSize = logoSize + padding * 2;
        const r = 10; // Rounded corners radius
        
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        // Draw rounded rectangle
        ctx.beginPath();
        ctx.moveTo(bgX + r, bgY);
        ctx.lineTo(bgX + bgSize - r, bgY);
        ctx.quadraticCurveTo(bgX + bgSize, bgY, bgX + bgSize, bgY + r);
        ctx.lineTo(bgX + bgSize, bgY + bgSize - r);
        ctx.quadraticCurveTo(bgX + bgSize, bgY + bgSize, bgX + bgSize - r, bgY + bgSize);
        ctx.lineTo(bgX + r, bgY + bgSize);
        ctx.quadraticCurveTo(bgX, bgY + bgSize, bgX, bgY + bgSize - r);
        ctx.lineTo(bgX, bgY + r);
        ctx.quadraticCurveTo(bgX, bgY, bgX + r, bgY);
        ctx.closePath();
        ctx.fill();
        
        // Clean shadow to prevent affecting the logo drawing
        ctx.restore();
        
        // 3. Draw the actual logo in the center
        ctx.drawImage(img, x, y, logoSize, logoSize);
        
        resolve(canvas.toDataURL('image/png'));
      };
      
      // Since cossma.com.mx doesn't send wild-card CORS headers, we proxy through images.weserv.nl
      // which loads and serves the image with fully open CORS header support.
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(logoUrl)}`;
      
      img.onerror = () => {
        console.warn('Could not load proxied QR logo from:', proxyUrl, '- trying direct load...');
        
        // Final fallback: try direct load if proxy is blocked or down
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const qrSize = canvas.width;
            const logoSize = qrSize * 0.22;
            const x = (qrSize - logoSize) / 2;
            const y = (qrSize - logoSize) / 2;
            ctx.drawImage(fallbackImg, x, y, logoSize, logoSize);
          }
          resolve(canvas.toDataURL('image/png'));
        };
        fallbackImg.onerror = () => {
          console.error('Failed to load direct logo fallback as well.');
          resolve(canvas.toDataURL('image/png'));
        };
        fallbackImg.src = logoUrl;
      };
      
      img.src = proxyUrl;
    });
  });
}
