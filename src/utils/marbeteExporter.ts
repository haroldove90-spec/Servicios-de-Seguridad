/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Marbete } from '../types';

/**
 * Renders a high-resolution, professional Marbete Digital image to a canvas
 * and initiates a JPEG file download of the pass.
 * 
 * @param marbete The Marbete details
 * @param qrCodeDataUrl The generated base64 QR Code image data url
 */
export function exportMarbeteToJPG(marbete: Marbete, qrCodeDataUrl: string): void {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Fill beautiful background (Dark Charcoal slate matching the uploaded image)
  ctx.fillStyle = '#111827'; // Dark slate/gray background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Load the crest logo and render it
  const logoImg = new Image();
  logoImg.crossOrigin = 'anonymous';
  
  logoImg.onload = () => {
    // Draw Logo Centered (top margin 50px, size 250px)
    const logoSize = 250;
    const logoX = (canvas.width - logoSize) / 2;
    const logoY = 60;
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

    // 3. Draw text and banners
    // Title "VALOR LEALTAD EXCELENCIA" is already inside the logo image, 
    // so we write "MARBETE DIGITAL" and "CONSECUTIVO"
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    // Aesthetic font sizing
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('MARBETE AUTORIZADO', canvas.width / 2, 375);

    ctx.fillStyle = '#ef4444'; // Red-500
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`CONSECUTIVO: #${marbete.consecutivo}`, canvas.width / 2, 415);

    // Draw White Container with rounded corners for the QR code
    const qrContainerSize = 340;
    const qrContainerX = (canvas.width - qrContainerSize) / 2;
    const qrContainerY = 460;
    const r = 24; // Rounded corners

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(qrContainerX + r, qrContainerY);
    ctx.lineTo(qrContainerX + qrContainerSize - r, qrContainerY);
    ctx.quadraticCurveTo(qrContainerX + qrContainerSize, qrContainerY, qrContainerX + qrContainerSize, qrContainerY + r);
    ctx.lineTo(qrContainerX + qrContainerSize, qrContainerY + qrContainerSize - r);
    ctx.quadraticCurveTo(qrContainerX + qrContainerSize, qrContainerY + qrContainerSize, qrContainerX + qrContainerSize - r, qrContainerY + qrContainerSize);
    ctx.lineTo(qrContainerX + r, qrContainerY + qrContainerSize);
    ctx.quadraticCurveTo(qrContainerX, qrContainerY + qrContainerSize, qrContainerX, qrContainerY + qrContainerSize - r);
    ctx.lineTo(qrContainerX, qrContainerY + r);
    ctx.quadraticCurveTo(qrContainerX, qrContainerY, qrContainerX + r, qrContainerY);
    ctx.closePath();
    ctx.fill();

    // Load QR Image and draw inside the container
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = qrContainerSize - 40;
      const qrX = qrContainerX + 20;
      const qrY = qrContainerY + 20;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Now draw resident and vehicle details below the QR container
      ctx.fillStyle = '#f8fafc'; // slate-50
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(marbete.residenteNombre.toUpperCase(), canvas.width / 2, 840);

      ctx.fillStyle = '#94a3b8'; // slate-400
      ctx.font = '18px sans-serif';
      ctx.fillText(marbete.residenciaNombre, canvas.width / 2, 875);

      if (marbete.vehiculoPlacas || marbete.vehiculoInfo) {
        ctx.fillStyle = '#cbd5e1'; // slate-300
        ctx.font = 'bold 20px monospace';
        const platesAndDetails = `${marbete.vehiculoPlacas ? `PLACAS: ${marbete.vehiculoPlacas}` : ''} ${marbete.vehiculoInfo ? `| ${marbete.vehiculoInfo}` : ''}`;
        ctx.fillText(platesAndDetails, canvas.width / 2, 915);
      }

      ctx.fillStyle = '#10b981'; // emerald-500
      ctx.font = 'bold 18px sans-serif';
      const validityDate = new Date(marbete.validUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      ctx.fillText(`VENCE: ${validityDate.toUpperCase()}`, canvas.width / 2, 955);

      // Trigger automatic browser download
      const link = document.createElement('a');
      link.download = `Marbete_${marbete.consecutivo}_${marbete.residenteNombre.toLowerCase().replace(/\s+/g, '_')}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    };
    qrImg.src = qrCodeDataUrl;
  };

  // We proxy through weserv.nl or load direct for canvas compatibility on local/remote domains
  const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent('https://cossma.com.mx/cnls.png')}`;
  
  logoImg.onerror = () => {
    // If proxy failed, draw direct fallback to avoid breaking flow
    logoImg.onload = null;
    const fallbackImg = new Image();
    fallbackImg.onload = () => {
      const logoSize = 250;
      const logoX = (canvas.width - logoSize) / 2;
      ctx.drawImage(fallbackImg, logoX, 60, logoSize, logoSize);
      
      // Draw subtitle & title
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('MARBETE AUTORIZADO', canvas.width / 2, 375);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`CONSECUTIVO: #${marbete.consecutivo}`, canvas.width / 2, 415);

      // Draw container and QR
      const qrContainerSize = 340;
      const qrContainerX = (canvas.width - qrContainerSize) / 2;
      const qrContainerY = 460;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrContainerX, qrContainerY, qrContainerSize, qrContainerSize);

      const qrImgFallback = new Image();
      qrImgFallback.onload = () => {
        ctx.drawImage(qrImgFallback, qrContainerX + 20, qrContainerY + 20, qrContainerSize - 40, qrContainerSize - 40);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(marbete.residenteNombre.toUpperCase(), canvas.width / 2, 840);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px sans-serif';
        ctx.fillText(marbete.residenciaNombre, canvas.width / 2, 875);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 20px monospace';
        const platesAndDetails = `${marbete.vehiculoPlacas ? `PLACAS: ${marbete.vehiculoPlacas}` : ''} ${marbete.vehiculoInfo ? `| ${marbete.vehiculoInfo}` : ''}`;
        ctx.fillText(platesAndDetails, canvas.width / 2, 915);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 18px sans-serif';
        const validityDate = new Date(marbete.validUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        ctx.fillText(`VENCE: ${validityDate.toUpperCase()}`, canvas.width / 2, 955);

        const link = document.createElement('a');
        link.download = `Marbete_${marbete.consecutivo}_${marbete.residenteNombre.toLowerCase().replace(/\s+/g, '_')}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
      };
      qrImgFallback.src = qrCodeDataUrl;
    };
    fallbackImg.src = 'https://cossma.com.mx/cnls.png';
  };

  logoImg.src = proxyUrl;
}
