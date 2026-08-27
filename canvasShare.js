/**
 * Generador de Tarjetas de Batalla con HTML5 Canvas (1200x630 OpenGraph / Twitter)
 * Renderizado procedural Cyber-Anime y descarga instantánea en PNG
 */

/**
 * Carga una imagen de forma segura con timeout y soporte CORS.
 * Si falla por CORS o red, retorna null para dibujar un avatar procedural de respaldo.
 * @param {string} url - URL de la imagen a cargar.
 * @returns {Promise<HTMLImageElement|null>}
 */
function cargarImagenSegura(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timer = setTimeout(() => {
      resolve(null);
    }, 2500);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Dibuja un retrato de personaje con esquinas redondeadas o fallback procedural.
 */
function dibujarRetrato(ctx, img, x, y, width, height, colorBorde, nombre) {
  ctx.save();

  // Crear máscara con esquinas redondeadas
  const radio = 18;
  ctx.beginPath();
  ctx.moveTo(x + radio, y);
  ctx.lineTo(x + width - radio, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radio);
  ctx.lineTo(x + width, y + height - radio);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radio, y + height);
  ctx.lineTo(x + radio, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radio);
  ctx.lineTo(x, y + radio);
  ctx.quadraticCurveTo(x, y, x + radio, y);
  ctx.closePath();
  ctx.clip();

  if (img) {
    // Dibujar imagen cubriendo el espacio con aspect ratio correcto
    const imgAspect = img.width / img.height;
    const boxAspect = width / height;
    let renderW, renderH, offsetX, offsetY;

    if (imgAspect > boxAspect) {
      renderH = height;
      renderW = height * imgAspect;
      offsetX = x - (renderW - width) / 2;
      offsetY = y;
    } else {
      renderW = width;
      renderH = width / imgAspect;
      offsetX = x;
      offsetY = y - (renderH - height) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  } else {
    // Fallback procedural cyber si la imagen está bloqueada por CORS
    const grad = ctx.createLinearGradient(x, y, x + width, y + height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, width, height);

    // Iniciales
    ctx.fillStyle = colorBorde;
    ctx.font = 'bold 54px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const iniciales = (nombre || 'VS')
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
    ctx.fillText(iniciales, x + width / 2, y + height / 2);
  }

  // Gradiente oscuro inferior para mejorar legibilidad
  const overlayGrad = ctx.createLinearGradient(x, y + height * 0.4, x, y + height);
  overlayGrad.addColorStop(0, 'rgba(6, 8, 13, 0)');
  overlayGrad.addColorStop(1, 'rgba(6, 8, 13, 0.85)');
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(x, y, width, height);

  ctx.restore();

  // Marco exterior con resplandor
  ctx.save();
  ctx.shadowColor = colorBorde;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = colorBorde;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(x + radio, y);
  ctx.lineTo(x + width - radio, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radio);
  ctx.lineTo(x + width, y + height - radio);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radio, y + height);
  ctx.lineTo(x + radio, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radio);
  ctx.lineTo(x, y + radio);
  ctx.quadraticCurveTo(x, y, x + radio, y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

/**
 * Genera y descarga la tarjeta de batalla en alta definición (1200x630).
 * @param {Object} p1 - Objeto del personaje 1.
 * @param {Object} p2 - Objeto del personaje 2.
 * @param {string} winnerText - Texto del ganador o vencedor.
 * @param {string} marginText - Texto del margen o diferencial de victoria.
 * @returns {Promise<void>}
 */
export async function descargarTarjetaBatalla(p1, p2, winnerText, marginText) {
  if (!p1 || !p2) return;

  const width = 1200;
  const height = 630;

  // Crear canvas offscreen
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Fondo base oscuro con textura cyber
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#06080d');
  bgGrad.addColorStop(0.5, '#0a0f1d');
  bgGrad.addColorStop(1, '#05070c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Resplandor radial Cyan (Izquierda)
  const cyanRadial = ctx.createRadialGradient(250, 315, 50, 250, 315, 450);
  cyanRadial.addColorStop(0, 'rgba(0, 243, 255, 0.18)');
  cyanRadial.addColorStop(1, 'rgba(0, 243, 255, 0)');
  ctx.fillStyle = cyanRadial;
  ctx.fillRect(0, 0, width, height);

  // Resplandor radial Magenta (Derecha)
  const magRadial = ctx.createRadialGradient(950, 315, 50, 950, 315, 450);
  magRadial.addColorStop(0, 'rgba(255, 0, 85, 0.18)');
  magRadial.addColorStop(1, 'rgba(255, 0, 85, 0)');
  ctx.fillStyle = magRadial;
  ctx.fillRect(0, 0, width, height);

  // Rejilla táctica cyber
  ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. Cabecera y Marca Oficial
  ctx.save();
  ctx.textAlign = 'center';

  // Logo GEEKVS
  ctx.font = '900 32px Orbitron, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 243, 255, 0.6)';
  ctx.shadowBlur = 15;
  ctx.fillText('GEEK', 565, 55);

  ctx.fillStyle = '#ff0055';
  ctx.shadowColor = 'rgba(255, 0, 85, 0.8)';
  ctx.shadowBlur = 15;
  ctx.fillText('VS', 640, 55);

  // Subtítulo
  ctx.font = '700 11px Orbitron, sans-serif';
  ctx.fillStyle = '#00f3ff';
  ctx.shadowBlur = 0;
  ctx.fillText('CANONICAL COMBAT ARCHIVE • 1v1 VERSUS ARENA', 600, 80);
  ctx.restore();

  // 3. Cargar imágenes de P1 y P2 en paralelo
  const [imgP1, imgP2] = await Promise.all([
    cargarImagenSegura(p1.imagen || p1.gif_collage),
    cargarImagenSegura(p2.imagen || p2.gif_collage)
  ]);

  // 4. Dibujar retratos
  const cardW = 340;
  const cardH = 340;
  const cardY = 115;
  const xP1 = 70;
  const xP2 = width - cardW - 70;

  dibujarRetrato(ctx, imgP1, xP1, cardY, cardW, cardH, '#00f3ff', p1.nombre);
  dibujarRetrato(ctx, imgP2, xP2, cardY, cardW, cardH, '#ff0055', p2.nombre);

  // 5. Textos y Estadísticas P1 (Izquierda)
  ctx.save();
  ctx.textAlign = 'left';

  // Tag P1
  ctx.fillStyle = '#00f3ff';
  ctx.font = '800 12px Orbitron, sans-serif';
  ctx.fillText('JUGADOR 1 (P1)', xP1 + 10, cardY + cardH - 85);

  // Nombre P1
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px Orbitron, sans-serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  const nombreP1 = p1.nombre.length > 20 ? p1.nombre.substring(0, 18) + '...' : p1.nombre;
  ctx.fillText(nombreP1, xP1 + 10, cardY + cardH - 55);

  // Obra P1
  ctx.fillStyle = '#00f3ff';
  ctx.font = '600 13px Outfit, sans-serif';
  ctx.fillText(p1.obra.toUpperCase(), xP1 + 10, cardY + cardH - 32);

  // Score P1
  ctx.fillStyle = '#ffc800';
  ctx.font = '900 18px Orbitron, sans-serif';
  ctx.fillText(`⚡ ${Number(p1.scoreFinal || 0).toLocaleString('es-ES')} PTS`, xP1 + 10, cardY + cardH - 8);
  ctx.restore();

  // 6. Textos y Estadísticas P2 (Derecha)
  ctx.save();
  ctx.textAlign = 'right';

  // Tag P2
  ctx.fillStyle = '#ff0055';
  ctx.font = '800 12px Orbitron, sans-serif';
  ctx.fillText('JUGADOR 2 (P2)', xP2 + cardW - 10, cardY + cardH - 85);

  // Nombre P2
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px Orbitron, sans-serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  const nombreP2 = p2.nombre.length > 20 ? p2.nombre.substring(0, 18) + '...' : p2.nombre;
  ctx.fillText(nombreP2, xP2 + cardW - 10, cardY + cardH - 55);

  // Obra P2
  ctx.fillStyle = '#ff0055';
  ctx.font = '600 13px Outfit, sans-serif';
  ctx.fillText(p2.obra.toUpperCase(), xP2 + cardW - 10, cardY + cardH - 32);

  // Score P2
  ctx.fillStyle = '#ffc800';
  ctx.font = '900 18px Orbitron, sans-serif';
  ctx.fillText(`⚡ ${Number(p2.scoreFinal || 0).toLocaleString('es-ES')} PTS`, xP2 + cardW - 10, cardY + cardH - 8);
  ctx.restore();

  // 7. Insignia Central VS
  ctx.save();
  ctx.beginPath();
  ctx.arc(600, 240, 48, 0, Math.PI * 2);
  ctx.fillStyle = '#0b0f19';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(0, 243, 255, 0.7)';
  ctx.shadowBlur = 20;
  ctx.stroke();

  ctx.font = 'italic 900 36px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('VS', 600, 240);
  ctx.restore();

  // 8. Barra de Dominancia de Combate en el Centro
  const totalScore = Math.max((p1.scoreFinal || 0) + (p2.scoreFinal || 0), 1);
  const pct1 = Math.max(Math.round(((p1.scoreFinal || 0) / totalScore) * 100), 1);
  const pct2 = 100 - pct1;

  const barX = 460;
  const barY = 325;
  const barW = 280;
  const barH = 14;

  // Fondo barra
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 7);
  ctx.fill();

  // Relleno P1 (Cyan)
  const fillW1 = (barW * pct1) / 100;
  ctx.fillStyle = '#00f3ff';
  ctx.shadowColor = '#00f3ff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(barX, barY, fillW1, barH, [7, 0, 0, 7]);
  ctx.fill();

  // Relleno P2 (Magenta)
  const fillW2 = barW - fillW1;
  ctx.fillStyle = '#ff0055';
  ctx.shadowColor = '#ff0055';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(barX + fillW1, barY, fillW2, barH, [0, 7, 7, 0]);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Etiquetas de porcentaje
  ctx.font = '800 12px Orbitron, sans-serif';
  ctx.fillStyle = '#00f3ff';
  ctx.textAlign = 'left';
  ctx.fillText(`${pct1}%`, barX, barY - 8);

  ctx.fillStyle = '#ff0055';
  ctx.textAlign = 'right';
  ctx.fillText(`${pct2}%`, barX + barW, barY - 8);

  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.font = '600 10px Outfit, sans-serif';
  ctx.fillText('RATIO DE DOMINIO', 600, barY - 8);

  // 9. Banner Inferior de Proclamación de Victoria
  const bannerY = 485;
  const bannerH = 105;
  const bannerW = 1060;
  const bannerX = 70;

  const bannerGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW, bannerY);
  bannerGrad.addColorStop(0, 'rgba(0, 243, 255, 0.15)');
  bannerGrad.addColorStop(0.5, 'rgba(14, 20, 32, 0.95)');
  bannerGrad.addColorStop(1, 'rgba(255, 0, 85, 0.15)');

  ctx.fillStyle = bannerGrad;
  ctx.strokeStyle = 'rgba(255, 200, 0, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 16);
  ctx.fill();
  ctx.stroke();

  // Texto Ganador Proclamado
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '800 12px Orbitron, sans-serif';
  ctx.fillStyle = '#ffc800';
  ctx.shadowColor = 'rgba(255, 200, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText('★ RESOLUCIÓN CANÓNICA OFICIAL ★', 600, bannerY + 30);

  ctx.font = '900 22px Orbitron, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
  ctx.shadowBlur = 12;
  const cleanWinner = (winnerText || 'VICTORIA DECLARADA').toUpperCase();
  ctx.fillText(`VICTORIA: ${cleanWinner}`, 600, bannerY + 60);

  ctx.font = '600 13px Outfit, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.shadowBlur = 0;
  ctx.fillText(marginText || 'Calculado mediante algoritmo recursivo GeekVS', 600, bannerY + 86);
  ctx.restore();

  // 10. Watermark & Pie
  ctx.font = '500 10px Orbitron, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.textAlign = 'center';
  ctx.fillText('GEEKVS.APP • CANONICAL POWER ENGINE • FACTOR TRANSITIVO α = 0.5', 600, 615);

  // 11. Descargar imagen PNG directamente
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `geekvs-duel-${p1.id}-vs-${p2.id}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('[GeekVS CanvasShare] Error exportando imagen:', err);
  }
}
