import React, { useState, useEffect, useRef, useCallback } from 'react';
import { filters, filterList, applyFilterToImage, generateFilterThumbnail } from '../effects/filters';

const STICKERS = [
  { id: 'hat_party', emoji: '🎩' },
  { id: 'glasses', emoji: '🕶️' },
  { id: 'mustache', emoji: '🥸' },
  { id: 'crown', emoji: '👑' },
  { id: 'lips', emoji: '💋' },
  { id: 'star', emoji: '⭐' },
  { id: 'heart', emoji: '❤️' },
  { id: 'fire', emoji: '🔥' },
  { id: 'sparkle', emoji: '✨' },
  { id: 'rainbow', emoji: '🌈' },
  { id: 'party', emoji: '🎉' },
  { id: 'balloon', emoji: '🎈' },
  { id: 'music', emoji: '🎵' },
  { id: 'cool', emoji: '😎' },
  { id: 'kiss', emoji: '😘' },
  { id: 'laugh', emoji: '😂' },
  { id: 'devil', emoji: '😈' },
  { id: 'angel', emoji: '😇' },
  { id: 'ghost', emoji: '👻' },
  { id: 'alien', emoji: '👽' },
  { id: 'clown', emoji: '🤡' },
  { id: 'rocket', emoji: '🚀' },
  { id: 'beer', emoji: '🍺' },
  { id: 'wine', emoji: '🍷' },
];

const FRAMES = [
  { id: 'none', name: 'Sin marco', type: 'none', thumb: '✕' },
  { id: 'classic_white', name: 'Clásico', type: 'solid', color: '#ffffff', textColor: '#555', thumb: '⬜' },
  { id: 'fiesta', name: 'Fiesta', type: 'fiesta', textColor: '#fff', thumb: '🎉' },
  { id: 'globos', name: 'Globos', type: 'balloons', textColor: '#333', thumb: '🎈' },
  { id: 'dulces', name: 'Dulces', type: 'candy', textColor: '#fff', thumb: '🍭' },
  { id: 'corazones', name: 'Corazones', type: 'hearts', textColor: '#c71585', thumb: '❤️' },
  { id: 'estrellas', name: 'Estrellas', type: 'stars', textColor: '#ffd700', thumb: '⭐' },
  { id: 'arcoiris', name: 'Arcoíris', type: 'rainbow', textColor: '#fff', thumb: '🌈' },
  { id: 'flores', name: 'Flores', type: 'flowers', textColor: '#2d5a27', thumb: '🌸' },
  { id: 'vintage_film', name: 'Película', type: 'filmstrip', textColor: '#fff', thumb: '🎬' },
];

// --- Decorative frame helper drawing functions ---

function drawBalloon(ctx, x, y, r, color) {
  ctx.save();
  // Balloon body (ellipse)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.75, r, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shine highlight
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.3, r * 0.15, r * 0.25, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Knot triangle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.12, y + r);
  ctx.lineTo(x + r * 0.12, y + r);
  ctx.lineTo(x, y + r * 1.18);
  ctx.closePath();
  ctx.fill();
  // String
  ctx.strokeStyle = 'rgba(200,200,200,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 1.18);
  ctx.quadraticCurveTo(x + r * 0.3, y + r * 1.6, x - r * 0.1, y + r * 2);
  ctx.stroke();
  ctx.restore();
}

function drawStar5(ctx, cx, cy, outerR, innerR, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(255,215,0,0.4)';
  ctx.shadowBlur = outerR * 0.4;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const aOuter = (i * 72 - 90) * Math.PI / 180;
    const aInner = ((i * 72) + 36 - 90) * Math.PI / 180;
    ctx.lineTo(cx + outerR * Math.cos(aOuter), cy + outerR * Math.sin(aOuter));
    ctx.lineTo(cx + innerR * Math.cos(aInner), cy + innerR * Math.sin(aInner));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeart(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  const s = size / 2;
  ctx.beginPath();
  // Two arcs for the top lobes + line to bottom point
  ctx.arc(cx - s / 2, cy - s * 0.1, s / 2, Math.PI, 0, false);
  ctx.arc(cx + s / 2, cy - s * 0.1, s / 2, Math.PI, 0, false);
  ctx.lineTo(cx, cy + s * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLightBulb(ctx, x, y, r, color) {
  ctx.save();
  // Glow
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = r * 2.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // Inner bright spot
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLollipop(ctx, x, y, size, c1, c2) {
  ctx.save();
  const r = size * 0.4;
  ctx.strokeStyle = '#D2691E'; ctx.lineWidth = size * 0.07; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x, y + size); ctx.stroke();
  ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = c2; ctx.lineWidth = size * 0.05;
  ctx.beginPath(); ctx.arc(x, y, r * 0.25, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 1.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.82, Math.PI * 0.3, Math.PI * 1.3); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.17, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPartyHat(ctx, x, y, size, c1, c2) {
  ctx.save();
  const h = size, w = size * 0.65;
  ctx.fillStyle = c1;
  ctx.beginPath(); ctx.moveTo(x, y - h * 0.5); ctx.lineTo(x - w / 2, y + h * 0.5); ctx.lineTo(x + w / 2, y + h * 0.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = c2; ctx.lineWidth = size * 0.05;
  for (let i = 1; i <= 3; i++) { const t = i / 4, sw = w / 2 * (1 - t * 0.85), sy = y - h * 0.5 + h * t; ctx.beginPath(); ctx.moveTo(x - sw, sy); ctx.lineTo(x + sw, sy); ctx.stroke(); }
  ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(x, y - h * 0.52, size * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c1; ctx.globalAlpha = 0.5;
  const dotR = size * 0.04;
  ctx.beginPath(); ctx.arc(x - w * 0.15, y + h * 0.15, dotR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w * 0.1, y - h * 0.05, dotR, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawCupcake(ctx, x, y, size, baseColor, frostColor) {
  ctx.save();
  const bw = size * 0.4, bh = size * 0.32;
  ctx.fillStyle = baseColor;
  ctx.beginPath(); ctx.moveTo(x - bw * 0.85, y); ctx.lineTo(x - bw * 0.6, y + bh); ctx.lineTo(x + bw * 0.6, y + bh); ctx.lineTo(x + bw * 0.85, y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { const lx = x - bw * 0.5 + bw * (i / 4); ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx, y + bh); ctx.stroke(); }
  ctx.fillStyle = frostColor;
  ctx.beginPath(); ctx.moveTo(x - bw * 0.9, y); ctx.quadraticCurveTo(x - bw * 0.3, y - bh * 0.8, x, y - bh * 0.2); ctx.quadraticCurveTo(x + bw * 0.3, y - bh * 0.8, x + bw * 0.9, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff0055'; ctx.beginPath(); ctx.arc(x, y - bh * 0.45, size * 0.06, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCandy(ctx, x, y, size, c1, c2) {
  ctx.save();
  const bw = size * 0.32, bh = size * 0.22;
  ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(x, y, bw, bh, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c2; ctx.fillRect(x - size * 0.03, y - bh, size * 0.06, bh * 2);
  ctx.fillStyle = c1;
  ctx.beginPath(); ctx.moveTo(x - bw, y - bh * 0.5); ctx.lineTo(x - bw - size * 0.2, y - size * 0.15); ctx.lineTo(x - bw - size * 0.2, y + size * 0.15); ctx.lineTo(x - bw, y + bh * 0.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + bw, y - bh * 0.5); ctx.lineTo(x + bw + size * 0.2, y - size * 0.15); ctx.lineTo(x + bw + size * 0.2, y + size * 0.15); ctx.lineTo(x + bw, y + bh * 0.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(x - bw * 0.3, y - bh * 0.3, bw * 0.15, bh * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawGift(ctx, x, y, size, boxC, ribC) {
  ctx.save();
  const bw = size * 0.5, bh = size * 0.38;
  ctx.fillStyle = boxC; ctx.fillRect(x - bw / 2, y - bh * 0.1, bw, bh);
  ctx.fillRect(x - bw * 0.55, y - bh * 0.35, bw * 1.1, bh * 0.28);
  ctx.fillStyle = ribC;
  ctx.fillRect(x - size * 0.03, y - bh * 0.35, size * 0.06, bh * 1.25);
  ctx.fillRect(x - bw / 2, y + bh * 0.1, bw, size * 0.05);
  ctx.beginPath(); ctx.ellipse(x - size * 0.09, y - bh * 0.42, size * 0.09, size * 0.05, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + size * 0.09, y - bh * 0.42, size * 0.09, size * 0.05, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawFlower(ctx, x, y, size, petalC, centerC) {
  ctx.save();
  const pr = size * 0.19, cr = size * 0.35;
  ctx.fillStyle = petalC;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * cr, y + Math.sin(a) * cr, pr, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = centerC; ctx.beginPath(); ctx.arc(x, y, size * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Draw decorative frame on canvas - patterned borders
function drawFrameOnCanvas(ctx, frameId, w, h, fw, eventName) {
  const frame = FRAMES.find(f => f.id === frameId);
  if (!frame || frame.type === 'none') return;

  ctx.save();

  switch (frame.type) {
    case 'solid': {
      ctx.fillStyle = frame.color;
      ctx.fillRect(0, 0, w, h);
      break;
    }

    case 'fiesta': {
      // Diagonal rainbow stripes
      ctx.save();
      const stripeColors = ['#ff4444', '#ff8800', '#ffdd00', '#44dd44', '#4488ff', '#aa44ff', '#ff69b4'];
      const stripeW = fw * 0.35;
      const diag = Math.sqrt(w * w + h * h) * 1.5;
      const totalStripes = Math.ceil(diag / stripeW);
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 4);
      for (let i = -totalStripes; i < totalStripes; i++) {
        ctx.fillStyle = stripeColors[((i % stripeColors.length) + stripeColors.length) % stripeColors.length];
        ctx.fillRect(-diag / 2, i * stripeW, diag, stripeW);
      }
      ctx.restore();
      break;
    }

    case 'balloons': {
      // Sky blue with colorful polka dots
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, w, h);
      const dotColors = ['#ff4444', '#ffdd00', '#44dd44', '#ff69b4', '#aa44ff', '#ff8800', '#4488ff'];
      const dotR = fw * 0.12;
      const spacing = fw * 0.4;
      let di = 0;
      for (let dy = 0; dy < h + spacing; dy += spacing) {
        const off = (Math.floor(dy / spacing) % 2) * (spacing / 2);
        for (let dx = off; dx < w + spacing; dx += spacing) {
          ctx.fillStyle = dotColors[di++ % dotColors.length];
          ctx.beginPath();
          ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'candy': {
      // Pink/yellow zigzag pattern
      ctx.fillStyle = '#ff69b4';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffdd00';
      const zigH = fw * 0.22;
      const zigW = fw * 0.28;
      for (let by = 0; by < h; by += zigH * 2) {
        ctx.beginPath();
        ctx.moveTo(0, by);
        for (let bx = 0; bx <= w + zigW; bx += zigW) {
          ctx.lineTo(bx, by + ((Math.round(bx / zigW) % 2) === 0 ? 0 : zigH));
        }
        ctx.lineTo(w, by + zigH * 2);
        ctx.lineTo(0, by + zigH * 2);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'hearts': {
      // Pink background with small heart pattern
      ctx.fillStyle = '#ffe0ec';
      ctx.fillRect(0, 0, w, h);
      const hSize = fw * 0.18;
      const hSpacing = fw * 0.42;
      const hColors = ['#ff69b4', '#ff1493', '#ff4081', '#e91e63'];
      let hi = 0;
      for (let hy = hSize; hy < h; hy += hSpacing) {
        const off = (Math.floor(hy / hSpacing) % 2) * (hSpacing / 2);
        for (let hx = off + hSize; hx < w; hx += hSpacing) {
          if (hx > fw * 1.1 && hx < w - fw * 1.1 && hy > fw * 1.1 && hy < h - fw * 1.1) { hi++; continue; }
          drawHeart(ctx, hx, hy, hSize, hColors[hi++ % hColors.length]);
        }
      }
      break;
    }

    case 'stars': {
      // Dark purple with sparkle pattern
      ctx.fillStyle = '#1a1a3e';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,215,0,0.4)';
      for (let i = 0; i < 120; i++) {
        const sx = ((i * 7919 + 31) % w);
        const sy = ((i * 104729 + 31) % h);
        if (sx > fw && sx < w - fw && sy > fw && sy < h - fw) continue;
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      const sOuter = fw * 0.18, sInner = sOuter * 0.4;
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 3571 + 17) % (w - fw * 0.4)) + fw * 0.2;
        const sy = ((i * 2731 + 23) % (h - fw * 0.4)) + fw * 0.2;
        if (sx > fw && sx < w - fw && sy > fw && sy < h - fw) continue;
        drawStar5(ctx, sx, sy, sOuter, sInner, i % 2 === 0 ? '#ffd700' : '#ffed85');
      }
      break;
    }

    case 'rainbow': {
      // Thick concentric rainbow gradient
      const rainbowColors = ['#ff0000', '#ff8800', '#ffff00', '#00cc00', '#0088ff', '#8800ff', '#ff00ff'];
      const stripeW = fw / rainbowColors.length;
      for (let i = 0; i < rainbowColors.length; i++) {
        ctx.fillStyle = rainbowColors[i];
        const off = stripeW * i;
        ctx.fillRect(off, off, w - off * 2, h - off * 2);
      }
      break;
    }

    case 'flowers': {
      // Warm yellow with green chevron/leaf pattern
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(0, 0, w, h);
      const leafColors = ['#2d8a4e', '#3cb371', '#228B22'];
      for (let i = 0; i < 80; i++) {
        const lx = ((i * 7919 + 31) % w);
        const ly = ((i * 104729 + 31) % h);
        if (lx > fw * 1.1 && lx < w - fw * 1.1 && ly > fw * 1.1 && ly < h - fw * 1.1) continue;
        ctx.fillStyle = leafColors[i % leafColors.length];
        if (i % 3 === 0) {
          ctx.beginPath(); ctx.arc(lx, ly, fw * 0.06, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.save(); ctx.translate(lx, ly); ctx.rotate((i * 0.7) % (Math.PI * 2));
          ctx.beginPath(); ctx.ellipse(0, 0, fw * 0.04, fw * 0.1, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }
      ctx.strokeStyle = '#4CAF50'; ctx.lineWidth = 2;
      for (let i = 0; i < 20; i++) {
        const ax = fw * 0.2 + ((i * 3 + 5) % 17) / 17 * (w - fw * 0.4);
        const ay = fw * 0.2 + ((i * 7 + 3) % 13) / 13 * (h - fw * 0.4);
        if (ax > fw * 1.1 && ax < w - fw * 1.1 && ay > fw * 1.1 && ay < h - fw * 1.1) continue;
        ctx.beginPath(); ctx.moveTo(ax - fw * 0.07, ay - fw * 0.03); ctx.lineTo(ax, ay + fw * 0.03); ctx.lineTo(ax + fw * 0.07, ay - fw * 0.03); ctx.stroke();
      }
      break;
    }

    case 'filmstrip': {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, w, h);
      const holeW = fw * 0.38, holeH = fw * 0.5;
      const spacing = holeW * 2.2;
      ctx.fillStyle = '#333';
      for (let x = spacing; x < w - spacing / 2; x += spacing) {
        const rx = x - holeW / 2;
        ctx.beginPath(); ctx.rect(rx, fw * 0.18, holeW, holeH); ctx.fill();
        ctx.beginPath(); ctx.rect(rx, h - fw * 0.18 - holeH, holeW, holeH); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
      ctx.strokeRect(fw * 0.92, fw * 0.92, w - fw * 1.84, h - fw * 1.84);
      break;
    }
  }

  ctx.restore();

  // Event name at bottom of frame
  if (fw > 20 && eventName) {
    ctx.save();
    ctx.fillStyle = frame.textColor || '#fff';
    ctx.font = `bold ${Math.round(fw * 0.5)}px "Fredoka", sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;
    ctx.fillText(eventName, w / 2, h - fw * 0.25);
    ctx.restore();
  }
}

// Draw protruding cartoon elements ON TOP of the image - party style! BIG & FUN!
function drawFrameOverlays(ctx, frameId, w, h, fw) {
  const frame = FRAMES.find(f => f.id === frameId);
  if (!frame || frame.type === 'none' || frame.type === 'solid' || frame.type === 'filmstrip') return;

  ctx.save();

  switch (frame.type) {
    case 'fiesta': {
      const sz = fw * 5.5;
      // BIG party hats at corners
      drawPartyHat(ctx, fw * 2.0, fw * 2.5, sz, '#ff4444', '#ffdd00');
      drawPartyHat(ctx, w - fw * 2.0, fw * 2.5, sz * 0.9, '#4488ff', '#ffffff');
      drawPartyHat(ctx, fw * 2.2, h - fw * 2.0, sz * 0.85, '#44dd44', '#ff69b4');
      drawPartyHat(ctx, w - fw * 2.2, h - fw * 2.0, sz * 0.9, '#ff69b4', '#ffdd00');
      // Lollipops at mid-edges - bigger
      drawLollipop(ctx, w * 0.3, fw * 0.5, sz * 0.65, '#ff69b4', '#ffffff');
      drawLollipop(ctx, w * 0.7, fw * 0.5, sz * 0.55, '#44dd44', '#ffdd00');
      drawLollipop(ctx, w * 0.35, h - fw * 0.3, sz * 0.6, '#aa44ff', '#ffdd00');
      drawLollipop(ctx, w * 0.65, h - fw * 0.3, sz * 0.55, '#ff8800', '#ffffff');
      drawLollipop(ctx, fw * 0.5, h * 0.35, sz * 0.55, '#ffdd00', '#ff4444');
      drawLollipop(ctx, w - fw * 0.5, h * 0.65, sz * 0.55, '#4488ff', '#ffffff');
      // Gifts between corners
      drawGift(ctx, fw * 0.5, h * 0.6, sz * 0.5, '#ff4444', '#ffdd00');
      drawGift(ctx, w - fw * 0.5, h * 0.4, sz * 0.5, '#4488ff', '#ffffff');
      // Stars scattered along edges
      for (let i = 0; i < 12; i++) {
        const sx = fw + ((i * 1733 + 11) % (w - fw * 2));
        const sy = i < 6 ? fw * 0.3 : h - fw * 0.3;
        drawStar5(ctx, sx, sy, fw * 0.7, fw * 0.28, '#ffd700');
      }
      break;
    }

    case 'balloons': {
      const bColors = ['#ff4444', '#4488ff', '#ffdd00', '#44dd44', '#ff69b4', '#ff8800', '#aa44ff'];
      const bigR = fw * 5.5;
      // Large balloons at corners and along top/bottom
      drawBalloon(ctx, fw * 1.5, fw * 0.5, bigR, bColors[0]);
      drawBalloon(ctx, fw * 4.0, fw * 0.2, bigR * 0.75, bColors[1]);
      drawBalloon(ctx, w - fw * 1.5, fw * 0.5, bigR, bColors[3]);
      drawBalloon(ctx, w - fw * 4.0, fw * 0.2, bigR * 0.75, bColors[4]);
      drawBalloon(ctx, w / 2, fw * 0.3, bigR * 0.65, bColors[2]);
      // Bottom balloons
      drawBalloon(ctx, fw * 2.0, h - fw * 1.0, bigR * 0.9, bColors[5]);
      drawBalloon(ctx, w - fw * 2.0, h - fw * 1.0, bigR * 0.9, bColors[6]);
      drawBalloon(ctx, w / 2, h - fw * 0.8, bigR * 0.6, bColors[0]);
      // Side balloons
      drawBalloon(ctx, fw * 0.5, h * 0.4, bigR * 0.7, bColors[2]);
      drawBalloon(ctx, w - fw * 0.5, h * 0.6, bigR * 0.7, bColors[5]);
      // Confetti pieces - bigger and more
      const cColors = ['#ff6b6b', '#ffd700', '#00d4ff', '#39ff14', '#ff69b4', '#ff8800', '#aa44ff'];
      for (let i = 0; i < 50; i++) {
        const cx = ((i * 2731 + 17) % w);
        const cy = ((i * 3571 + 23) % h);
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = cColors[i % cColors.length];
        ctx.translate(cx, cy); ctx.rotate(i * 0.6);
        ctx.fillRect(-4, -8, 8, 16);
        ctx.restore();
      }
      break;
    }

    case 'candy': {
      const sz = fw * 5;
      // BIG cupcakes at corners
      drawCupcake(ctx, fw * 2.5, fw * 2.8, sz, '#DEB887', '#ff69b4');
      drawCupcake(ctx, w - fw * 2.5, fw * 2.8, sz * 0.9, '#DEB887', '#87CEEB');
      drawCupcake(ctx, fw * 3.0, h - fw * 2.2, sz * 0.85, '#DEB887', '#ff4444');
      drawCupcake(ctx, w - fw * 3.0, h - fw * 2.2, sz * 0.85, '#DEB887', '#aa44ff');
      // BIG lollipops at top/bottom mid
      drawLollipop(ctx, w * 0.35, fw * 0.5, sz * 0.75, '#ff4444', '#ffffff');
      drawLollipop(ctx, w * 0.65, fw * 0.5, sz * 0.7, '#44dd44', '#ffdd00');
      drawLollipop(ctx, w / 2, h - fw * 0.3, sz * 0.7, '#aa44ff', '#ffffff');
      // BIG candy at sides
      drawCandy(ctx, fw * 1.0, h * 0.35, sz * 0.9, '#ff69b4', '#ffffff');
      drawCandy(ctx, fw * 1.0, h * 0.65, sz * 0.8, '#44dd44', '#ffdd00');
      drawCandy(ctx, w - fw * 1.0, h * 0.35, sz * 0.8, '#4488ff', '#ffdd00');
      drawCandy(ctx, w - fw * 1.0, h * 0.65, sz * 0.9, '#ff8800', '#ffffff');
      // Stars
      for (let i = 0; i < 10; i++) {
        const sx = fw + ((i * 2311 + 7) % (w - fw * 2));
        const sy = i < 5 ? fw * 0.25 : h - fw * 0.25;
        drawStar5(ctx, sx, sy, fw * 0.6, fw * 0.24, '#ffd700');
      }
      break;
    }

    case 'hearts': {
      const hColors = ['#ff1744', '#e91e63', '#f44336', '#ff4081', '#c71585'];
      const bigS = fw * 5;
      // HUGE hearts at corners
      drawHeart(ctx, fw * 1.5, fw * 1.5, bigS, hColors[0]);
      drawHeart(ctx, w - fw * 1.5, fw * 1.5, bigS * 0.9, hColors[1]);
      drawHeart(ctx, fw * 1.5, h - fw * 1.5, bigS * 0.85, hColors[2]);
      drawHeart(ctx, w - fw * 1.5, h - fw * 1.5, bigS * 0.9, hColors[3]);
      // Mid-edge hearts - bigger
      drawHeart(ctx, w * 0.3, fw * 0.5, bigS * 0.5, hColors[4]);
      drawHeart(ctx, w * 0.7, fw * 0.5, bigS * 0.45, hColors[0]);
      drawHeart(ctx, w * 0.4, h - fw * 0.5, bigS * 0.5, hColors[1]);
      drawHeart(ctx, w * 0.6, h - fw * 0.5, bigS * 0.45, hColors[3]);
      drawHeart(ctx, fw * 0.5, h * 0.35, bigS * 0.4, hColors[2]);
      drawHeart(ctx, fw * 0.5, h * 0.65, bigS * 0.4, hColors[4]);
      drawHeart(ctx, w - fw * 0.5, h * 0.35, bigS * 0.4, hColors[0]);
      drawHeart(ctx, w - fw * 0.5, h * 0.65, bigS * 0.4, hColors[1]);
      break;
    }

    case 'stars': {
      const goldA = '#ffd700', goldB = '#ffed85', silv = '#c0c0c0';
      const bigR = fw * 4, bigIR = bigR * 0.4;
      // HUGE corner stars
      drawStar5(ctx, fw * 1.5, fw * 1.5, bigR, bigIR, goldA);
      drawStar5(ctx, w - fw * 1.5, fw * 1.5, bigR * 0.9, bigIR * 0.9, goldB);
      drawStar5(ctx, fw * 1.5, h - fw * 1.5, bigR * 0.9, bigIR * 0.9, goldB);
      drawStar5(ctx, w - fw * 1.5, h - fw * 1.5, bigR, bigIR, goldA);
      // Mid-edge stars - bigger
      drawStar5(ctx, w * 0.3, fw * 0.4, bigR * 0.6, bigIR * 0.6, goldA);
      drawStar5(ctx, w * 0.7, fw * 0.4, bigR * 0.55, bigIR * 0.55, silv);
      drawStar5(ctx, w / 2, h - fw * 0.4, bigR * 0.6, bigIR * 0.6, goldB);
      drawStar5(ctx, fw * 0.5, h * 0.35, bigR * 0.5, bigIR * 0.5, goldA);
      drawStar5(ctx, fw * 0.5, h * 0.65, bigR * 0.45, bigIR * 0.45, silv);
      drawStar5(ctx, w - fw * 0.5, h * 0.35, bigR * 0.5, bigIR * 0.5, goldB);
      drawStar5(ctx, w - fw * 0.5, h * 0.65, bigR * 0.45, bigIR * 0.45, goldA);
      // Sparkle dots
      ctx.fillStyle = 'rgba(255,215,0,0.6)';
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 7919 + 31) % w);
        const sy = ((i * 104729 + 31) % h);
        ctx.beginPath(); ctx.arc(sx, sy, 2 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
      break;
    }

    case 'rainbow': {
      // Large colorful circles/blobs at corners - BIGGER
      const circleR = fw * 4.5;
      const colors = ['#ff0000', '#ff8800', '#ffff00', '#00cc00', '#0088ff', '#8800ff', '#ff00ff'];
      const cornerPositions = [[fw * 0.5, fw * 0.5], [w - fw * 0.5, fw * 0.5], [fw * 0.5, h - fw * 0.5], [w - fw * 0.5, h - fw * 0.5]];
      for (let ci = 0; ci < cornerPositions.length; ci++) {
        const [cx, cy] = cornerPositions[ci];
        for (let j = 0; j < 4; j++) {
          const offX = ((ci * 3 + j) * 37 % 9 - 4) * fw * 0.5;
          const offY = ((ci * 3 + j) * 41 % 9 - 4) * fw * 0.5;
          ctx.fillStyle = colors[(ci * 4 + j) % colors.length];
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.arc(cx + offX, cy + offY, circleR * (0.5 + (j % 4) * 0.15), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Mid-edge blobs
      for (let i = 0; i < 4; i++) {
        const mx = i < 2 ? w / 2 + (i === 0 ? -fw * 2 : fw * 2) : fw * 0.5 * (i === 2 ? 1 : -1) + (i === 2 ? 0 : w);
        const my = i < 2 ? (i === 0 ? fw * 0.3 : h - fw * 0.3) : h / 2;
        ctx.fillStyle = colors[(i * 2) % colors.length];
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(mx, my, circleR * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }

    case 'flowers': {
      const sz = fw * 4.5;
      const petalColors = ['#ff69b4', '#ff4444', '#aa44ff', '#ff8800', '#4488ff', '#44dd44'];
      const centerColors = ['#ffdd00', '#ffd700', '#ffaa00'];
      // BIG flowers at corners
      drawFlower(ctx, fw * 2.0, fw * 2.0, sz, petalColors[0], centerColors[0]);
      drawFlower(ctx, w - fw * 2.0, fw * 2.0, sz * 0.9, petalColors[1], centerColors[1]);
      drawFlower(ctx, fw * 2.2, h - fw * 1.8, sz * 0.85, petalColors[2], centerColors[2]);
      drawFlower(ctx, w - fw * 2.2, h - fw * 1.8, sz * 0.9, petalColors[3], centerColors[0]);
      // Medium flowers at mid-edges
      drawFlower(ctx, w * 0.3, fw * 0.4, sz * 0.5, petalColors[4], centerColors[1]);
      drawFlower(ctx, w * 0.7, fw * 0.4, sz * 0.45, petalColors[5], centerColors[2]);
      drawFlower(ctx, w / 2, h - fw * 0.4, sz * 0.5, petalColors[0], centerColors[0]);
      drawFlower(ctx, fw * 0.4, h * 0.35, sz * 0.45, petalColors[1], centerColors[1]);
      drawFlower(ctx, fw * 0.4, h * 0.65, sz * 0.4, petalColors[3], centerColors[2]);
      drawFlower(ctx, w - fw * 0.4, h * 0.35, sz * 0.45, petalColors[2], centerColors[0]);
      drawFlower(ctx, w - fw * 0.4, h * 0.65, sz * 0.4, petalColors[4], centerColors[1]);
      // Leaf accents - bigger
      ctx.fillStyle = '#2d8a4e';
      for (let i = 0; i < 18; i++) {
        const lx = fw * 0.5 + ((i * 1733 + 11) % (w - fw));
        const ly = fw * 0.5 + ((i * 2311 + 7) % (h - fw));
        ctx.save();
        ctx.translate(lx, ly); ctx.rotate((i * 0.9) % (Math.PI * 2));
        ctx.beginPath(); ctx.ellipse(0, 0, fw * 0.18, fw * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      break;
    }
  }

  ctx.restore();
}

// Thumbnail background for frame selector
function getFrameThumbStyle(frame) {
  switch (frame.type) {
    case 'none': return { background: 'var(--glass)' };
    case 'solid': return { background: frame.color };
    case 'fiesta': return { background: 'repeating-linear-gradient(-45deg, #ff4444, #ff4444 3px, #ffdd00 3px, #ffdd00 6px, #44dd44 6px, #44dd44 9px, #4488ff 9px, #4488ff 12px)' };
    case 'balloons': return { background: '#87CEEB' };
    case 'candy': return { background: 'linear-gradient(135deg, #ff69b4, #ffdd00)' };
    case 'hearts': return { background: '#ffe0ec' };
    case 'stars': return { background: '#1a1a3e' };
    case 'rainbow': return { background: 'linear-gradient(135deg, #ff0000, #ff8800, #ffff00, #00cc00, #0088ff, #8800ff)' };
    case 'flowers': return { background: '#ffe066' };
    case 'filmstrip': return { background: '#1a1a1a' };
    default: return { background: 'var(--glass)' };
  }
}

export default function EditorScreen({ config, image, frames: capturedFrames, mode, onDone, onRetake }) {
  const [activeTab, setActiveTab] = useState('filters');
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [selectedFrame, setSelectedFrame] = useState('none');
  const [placedStickers, setPlacedStickers] = useState([]);
  const [filterThumbs, setFilterThumbs] = useState({});
  const [filteredImage, setFilteredImage] = useState(image);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const frameCanvasRef = useRef(null);

  // Drag state for stickers
  const [dragging, setDragging] = useState(null); // { index, startX, startY }
  const [selectedSticker, setSelectedSticker] = useState(null); // index or null

  // Generate filter thumbnails
  useEffect(() => {
    if (!image) return;
    const gen = async () => {
      const thumbs = {};
      for (const f of filterList) {
        thumbs[f.id] = await generateFilterThumbnail(image, f.id);
      }
      setFilterThumbs(thumbs);
    };
    gen();
  }, [image]);

  // Apply filter when selection changes
  useEffect(() => {
    if (!image) return;
    const apply = async () => {
      const result = await applyFilterToImage(image, selectedFilter);
      setFilteredImage(result);
    };
    apply();
  }, [image, selectedFilter]);

  // Draw frame preview on canvas when frame selection changes
  useEffect(() => {
    const canvas = frameCanvasRef.current;
    if (!canvas) return;

    if (selectedFrame === 'none') {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }

    // Wait for image to render in DOM
    const timer = setTimeout(() => {
      const imgEl = previewRef.current?.querySelector('img');
      if (!imgEl || !imgEl.clientWidth) return;

      const imgW = imgEl.clientWidth;
      const imgH = imgEl.clientHeight;
      const fw = 16; // preview frame width in CSS pixels

      canvas.width = imgW + fw * 2;
      canvas.height = imgH + fw * 2;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw full frame background + decorations
      drawFrameOnCanvas(ctx, selectedFrame, canvas.width, canvas.height, fw, config.eventName);

      // Clear center (transparent) so photo shows through
      ctx.clearRect(fw, fw, imgW, imgH);

      // Draw protruding overlay elements on top
      drawFrameOverlays(ctx, selectedFrame, canvas.width, canvas.height, fw);
    }, 120);

    return () => clearTimeout(timer);
  }, [selectedFrame, filteredImage, config.eventName]);

  // Add sticker at center
  const addSticker = (emoji) => {
    setPlacedStickers(prev => [...prev, {
      emoji,
      x: 50, // % position
      y: 50,
      size: 60, // px
      id: Date.now(),
    }]);
  };

  // Sticker touch/drag handlers
  const handleStickerStart = (e, index) => {
    e.stopPropagation();
    const touch = e.touches ? e.touches[0] : e;
    setDragging({
      index,
      offsetX: touch.clientX,
      offsetY: touch.clientY,
    });
  };

  const handleStickerMove = useCallback((e) => {
    if (dragging === null) return;
    const touch = e.touches ? e.touches[0] : e;
    const preview = previewRef.current;
    if (!preview) return;
    const rect = preview.getBoundingClientRect();

    setPlacedStickers(prev => {
      const copy = [...prev];
      const dx = touch.clientX - dragging.offsetX;
      const dy = touch.clientY - dragging.offsetY;
      copy[dragging.index] = {
        ...copy[dragging.index],
        x: copy[dragging.index].x + (dx / rect.width) * 100,
        y: copy[dragging.index].y + (dy / rect.height) * 100,
      };
      return copy;
    });
    setDragging(prev => ({ ...prev, offsetX: touch.clientX, offsetY: touch.clientY }));
  }, [dragging]);

  const handleStickerEnd = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleStickerMove);
    window.addEventListener('mouseup', handleStickerEnd);
    window.addEventListener('touchmove', handleStickerMove, { passive: false });
    window.addEventListener('touchend', handleStickerEnd);
    return () => {
      window.removeEventListener('mousemove', handleStickerMove);
      window.removeEventListener('mouseup', handleStickerEnd);
      window.removeEventListener('touchmove', handleStickerMove);
      window.removeEventListener('touchend', handleStickerEnd);
    };
  }, [handleStickerMove, handleStickerEnd]);

  const removeSticker = (index) => {
    setPlacedStickers(prev => prev.filter((_, i) => i !== index));
    if (selectedSticker === index) setSelectedSticker(null);
  };

  const resizeSticker = (index, delta) => {
    setPlacedStickers(prev => {
      const copy = [...prev];
      const newSize = Math.max(20, Math.min(200, copy[index].size + delta));
      copy[index] = { ...copy[index], size: newSize };
      return copy;
    });
  };

  // Compose final image with filter + frame + stickers
  const composeFinal = useCallback(async () => {
    setProcessing(true);
    try {
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = filteredImage;
      });

      const canvas = document.createElement('canvas');
      const frameWidth = selectedFrame !== 'none' ? 60 : 0;
      canvas.width = img.width + frameWidth * 2;
      canvas.height = img.height + frameWidth * 2;
      const ctx = canvas.getContext('2d');

      // Draw glamorous frame
      if (selectedFrame !== 'none') {
        drawFrameOnCanvas(ctx, selectedFrame, canvas.width, canvas.height, frameWidth, config.eventName);
      }

      // Draw filtered image
      ctx.drawImage(img, frameWidth, frameWidth);

      // Draw protruding frame overlays ON TOP of the image
      if (selectedFrame !== 'none') {
        drawFrameOverlays(ctx, selectedFrame, canvas.width, canvas.height, frameWidth);
      }

      // Draw stickers (scale size from preview to actual image resolution)
      const previewImg = previewRef.current?.querySelector('img');
      const scaleRatio = previewImg ? (img.width / previewImg.clientWidth) : 1;
      for (const s of placedStickers) {
        const sx = frameWidth + (s.x / 100) * img.width;
        const sy = frameWidth + (s.y / 100) * img.height;
        const scaledSize = Math.round(s.size * scaleRatio);
        ctx.font = `${scaledSize}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.emoji, sx, sy);
      }

      return canvas.toDataURL('image/png');
    } finally {
      setProcessing(false);
    }
  }, [filteredImage, selectedFrame, placedStickers, config.eventName]);

  const handleDone = async () => {
    const finalImage = await composeFinal();
    onDone(finalImage);
  };

  return (
    <div className="editor-container">
      {/* Top toolbar */}
      <div className="editor-toolbar">
        <div className="editor-tabs">
          {[
            { id: 'filters', label: '🎨 Filtros' },
            ...(config.enableFrames !== false ? [{ id: 'frames', label: '🖼️ Marcos' }] : []),
            ...(config.enableStickers !== false ? [{ id: 'stickers', label: '⭐ Stickers' }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              className={`editor-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="editor-panel">
          {/* Filters - horizontal scroll */}
          {activeTab === 'filters' && (
            <div className="filter-grid">
              {filterList.map(f => (
                <div
                  key={f.id}
                  className={`filter-item ${selectedFilter === f.id ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(f.id)}
                >
                  {filterThumbs[f.id] ? (
                    <img src={filterThumbs[f.id]} className="filter-thumb" alt={f.name} />
                  ) : (
                    <div className="filter-thumb flex-center">{f.emoji}</div>
                  )}
                  <span className="filter-name">{f.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Frames - horizontal scroll */}
          {activeTab === 'frames' && (
            <div className="filter-grid">
              {FRAMES.map(f => (
                <div
                  key={f.id}
                  className={`filter-item ${selectedFrame === f.id ? 'active' : ''}`}
                  onClick={() => setSelectedFrame(f.id)}
                >
                  <div
                    className="filter-thumb"
                    style={{
                      ...getFrameThumbStyle(f),
                      border: f.type === 'neon' ? `2px solid ${f.neonColor || '#ff00ff'}` : '2px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      color: f.textColor || '#fff',
                      fontWeight: 600,
                    }}
                  >
                    {f.thumb || '🖼️'}
                  </div>
                  <span className="filter-name">{f.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Stickers - horizontal scroll */}
          {activeTab === 'stickers' && (
            <div className="sticker-grid">
              {STICKERS.map(s => (
                <div
                  key={s.id}
                  className="sticker-item"
                  onClick={() => addSticker(s.emoji)}
                >
                  {s.emoji}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo preview - full width */}
      <div className="editor-preview" ref={previewRef} onClick={() => setSelectedSticker(null)}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Frame canvas - draws full frame with decorative elements */}
          <canvas
            ref={frameCanvasRef}
            style={{
              position: 'absolute',
              left: '-16px',
              top: '-16px',
              pointerEvents: 'none',
              zIndex: 2,
              display: selectedFrame !== 'none' ? 'block' : 'none',
            }}
          />

          {/* Photo */}
          <img
            src={filteredImage || image}
            alt="Preview"
            style={{
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              display: 'block',
              position: 'relative',
              zIndex: 1,
            }}
          />

          {/* Placed stickers */}
          {placedStickers.map((s, i) => (
            <div
              key={s.id}
              style={{
                position: 'absolute',
                left: `${s.x}%`,
                top: `${s.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${s.size}px`,
                cursor: 'grab',
                zIndex: 5,
                lineHeight: 1,
                outline: selectedSticker === i ? '2px dashed var(--primary)' : 'none',
                outlineOffset: '4px',
                borderRadius: '8px',
              }}
              onMouseDown={(e) => { e.stopPropagation(); handleStickerStart(e, i); setSelectedSticker(i); }}
              onTouchStart={(e) => { handleStickerStart(e, i); setSelectedSticker(i); }}
              onDoubleClick={() => removeSticker(i)}
            >
              {s.emoji}
              {selectedSticker === i && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-60px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '18px',
                    zIndex: 10,
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <button
                    style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.75)', border: '2px solid rgba(255,255,255,0.4)',
                      color: '#fff', fontSize: '1.5rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(8px)',
                    }}
                    onClick={(e) => { e.stopPropagation(); resizeSticker(i, -15); }}
                  >−</button>
                  <button
                    style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.75)', border: '2px solid rgba(255,255,255,0.4)',
                      color: '#fff', fontSize: '1.5rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(8px)',
                    }}
                    onClick={(e) => { e.stopPropagation(); resizeSticker(i, 15); }}
                  >+</button>
                  <button
                    style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: 'rgba(231,76,60,0.9)', border: '2px solid rgba(255,255,255,0.3)',
                      color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onClick={(e) => { e.stopPropagation(); removeSticker(i); }}
                  >✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="editor-actions">
        <button
          className="touch-btn touch-btn-ghost touch-btn-sm"
          onClick={onRetake}
          style={{ flex: 1 }}
        >
          🔄 Repetir
        </button>
        <button
          className="touch-btn touch-btn-primary touch-btn-sm"
          onClick={handleDone}
          disabled={processing}
          style={{ flex: 2 }}
        >
          {processing ? '⏳ Procesando...' : '✓ Listo'}
        </button>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
