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
  { id: 'elegant_black', name: 'Elegante', type: 'solid', color: '#1a1a1a', textColor: '#d4af37', thumb: '⬛' },
  { id: 'fiesta_globos', name: 'Globos', type: 'balloons', borderColor: '#daa520', textColor: '#1a1a1a', thumb: '🎈' },
  { id: 'estrellas_glam', name: 'Estrellas', type: 'stars', borderColor: '#1a1a2e', textColor: '#ffd700', thumb: '⭐' },
  { id: 'neon_party', name: 'Neon', type: 'neon', borderColor: '#0a0a1a', neonColor: '#ff00ff', glowColor: 'rgba(255,0,255,0.6)', textColor: '#fff', thumb: '💜' },
  { id: 'confetti', name: 'Confetti', type: 'confetti', borderColor: '#2c003e', textColor: '#ffd700', thumb: '🎊' },
  { id: 'corazones', name: 'Corazones', type: 'hearts', borderColor: '#ffe0ec', textColor: '#c71585', thumb: '❤️' },
  { id: 'vintage_film', name: 'Película', type: 'filmstrip', borderColor: '#1a1a1a', textColor: '#fff', thumb: '🎬' },
  { id: 'luces_fiesta', name: 'Luces', type: 'lights', borderColor: '#1a1a2e', textColor: '#ffdd44', thumb: '💡' },
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

// Draw decorative frame on canvas for final composition
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

    case 'balloons': {
      // Golden gradient border
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#b8860b');
      grad.addColorStop(0.5, '#ffd700');
      grad.addColorStop(1, '#daa520');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Balloons in corners and along edges
      const bColors = ['#ff4444', '#4488ff', '#ffdd00', '#44dd44', '#ff69b4', '#ff8800', '#aa44ff'];
      const bR = fw * 0.42;
      // Top-left cluster
      drawBalloon(ctx, fw * 0.45, fw * 0.3, bR, bColors[0]);
      drawBalloon(ctx, fw * 1.15, fw * 0.18, bR * 0.78, bColors[1]);
      // Top-right cluster
      drawBalloon(ctx, w - fw * 0.45, fw * 0.3, bR, bColors[2]);
      drawBalloon(ctx, w - fw * 1.15, fw * 0.18, bR * 0.78, bColors[3]);
      // Bottom-left cluster
      drawBalloon(ctx, fw * 0.5, h - fw * 0.55, bR * 0.85, bColors[4]);
      drawBalloon(ctx, fw * 1.25, h - fw * 0.45, bR * 0.65, bColors[5]);
      // Bottom-right cluster
      drawBalloon(ctx, w - fw * 0.5, h - fw * 0.55, bR * 0.85, bColors[6]);
      drawBalloon(ctx, w - fw * 1.25, h - fw * 0.45, bR * 0.65, bColors[0]);
      // Along top edge
      for (let i = 0; i < 5; i++) {
        const bx = fw * 2 + (w - fw * 4) * (i / 4);
        drawBalloon(ctx, bx, fw * 0.28, bR * 0.6, bColors[(i + 2) % bColors.length]);
      }
      // Along bottom edge
      for (let i = 0; i < 4; i++) {
        const bx = fw * 2.5 + (w - fw * 5) * (i / 3);
        drawBalloon(ctx, bx, h - fw * 0.5, bR * 0.55, bColors[(i + 4) % bColors.length]);
      }
      break;
    }

    case 'stars': {
      // Dark blue border
      ctx.fillStyle = frame.borderColor;
      ctx.fillRect(0, 0, w, h);
      // Subtle shimmer
      ctx.fillStyle = 'rgba(255,215,0,0.03)';
      ctx.fillRect(0, 0, w, h);
      // Golden stars along all edges
      const sOuter = fw * 0.32;
      const sInner = sOuter * 0.4;
      const goldA = '#ffd700';
      const goldB = '#ffed85';
      // Top
      for (let i = 0; i < 9; i++) {
        const sx = fw * 0.4 + (w - fw * 0.8) * (i / 8);
        drawStar5(ctx, sx, fw * 0.42, sOuter * (0.7 + (i % 3) * 0.15), sInner * (0.7 + (i % 3) * 0.15), i % 2 === 0 ? goldA : goldB);
      }
      // Bottom
      for (let i = 0; i < 9; i++) {
        const sx = fw * 0.4 + (w - fw * 0.8) * (i / 8);
        drawStar5(ctx, sx, h - fw * 0.42, sOuter * (0.8 + (i % 2) * 0.2), sInner * (0.8 + (i % 2) * 0.2), i % 2 === 0 ? goldB : goldA);
      }
      // Left
      for (let i = 1; i < 6; i++) {
        const sy = fw + (h - fw * 2) * (i / 6);
        drawStar5(ctx, fw * 0.42, sy, sOuter * (0.6 + (i % 3) * 0.2), sInner * (0.6 + (i % 3) * 0.2), goldA);
      }
      // Right
      for (let i = 1; i < 6; i++) {
        const sy = fw + (h - fw * 2) * (i / 6);
        drawStar5(ctx, w - fw * 0.42, sy, sOuter * (0.7 + (i % 2) * 0.15), sInner * (0.7 + (i % 2) * 0.15), goldB);
      }
      // Tiny sparkle dots scattered
      ctx.fillStyle = 'rgba(255,215,0,0.5)';
      for (let i = 0; i < 60; i++) {
        const px = ((i * 7919 + 31) % w);
        const py = ((i * 104729 + 31) % h);
        if (px > fw && px < w - fw && py > fw && py < h - fw) continue;
        ctx.beginPath();
        ctx.arc(px, py, 1 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'neon': {
      ctx.fillStyle = frame.borderColor;
      ctx.fillRect(0, 0, w, h);
      // Multiple neon lines with glow effect
      const neonPairs = [
        { color: '#ff00ff', blur: 18 },
        { color: '#00ffff', blur: 14 },
        { color: '#ff00ff', blur: 8 },
      ];
      for (let line = 0; line < neonPairs.length; line++) {
        ctx.save();
        ctx.strokeStyle = neonPairs[line].color;
        ctx.shadowColor = neonPairs[line].color;
        ctx.shadowBlur = neonPairs[line].blur;
        ctx.lineWidth = 3 - line;
        const offset = fw * (0.2 + line * 0.15);
        ctx.strokeRect(offset, offset, w - offset * 2, h - offset * 2);
        ctx.restore();
      }
      // Corner accent circles
      const cornerR = fw * 0.5;
      const corners = [[0, 0], [w, 0], [w, h], [0, h]];
      for (const [cx, cy] of corners) {
        ctx.save();
        ctx.strokeStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, cornerR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      break;
    }

    case 'confetti': {
      ctx.fillStyle = frame.borderColor;
      ctx.fillRect(0, 0, w, h);
      const cColors = ['#ff6b6b', '#ffd700', '#00d4ff', '#39ff14', '#ff69b4', '#a855f7', '#ff8800', '#ffffff'];
      for (let i = 0; i < 200; i++) {
        const px = ((i * 7919 + 31) % w);
        const py = ((i * 104729 + 31) % h);
        if (px > fw && px < w - fw && py > fw && py < h - fw) continue;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((i * 0.7) % (Math.PI * 2));
        ctx.fillStyle = cColors[i % cColors.length];
        if (i % 3 === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, 2.5 + (i % 4), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-3, -6, 5 + (i % 3), 11);
        }
        ctx.restore();
      }
      break;
    }

    case 'hearts': {
      ctx.fillStyle = frame.borderColor;
      ctx.fillRect(0, 0, w, h);
      const hColors = ['#ff1744', '#e91e63', '#f44336', '#ff4081', '#c71585', '#d81b60'];
      const hSize = fw * 0.38;
      // Top
      for (let i = 0; i < 10; i++) {
        const hx = fw * 0.4 + (w - fw * 0.8) * (i / 9);
        drawHeart(ctx, hx, fw * 0.3, hSize * (0.6 + (i % 3) * 0.2), hColors[i % hColors.length]);
      }
      // Bottom
      for (let i = 0; i < 10; i++) {
        const hx = fw * 0.4 + (w - fw * 0.8) * (i / 9);
        drawHeart(ctx, hx, h - fw * 0.5, hSize * (0.7 + (i % 3) * 0.15), hColors[(i + 3) % hColors.length]);
      }
      // Left
      for (let i = 1; i < 7; i++) {
        const hy = fw + (h - fw * 2) * (i / 7);
        drawHeart(ctx, fw * 0.38, hy, hSize * (0.5 + (i % 3) * 0.2), hColors[(i + 1) % hColors.length]);
      }
      // Right
      for (let i = 1; i < 7; i++) {
        const hy = fw + (h - fw * 2) * (i / 7);
        drawHeart(ctx, w - fw * 0.38, hy, hSize * (0.6 + (i % 2) * 0.2), hColors[(i + 2) % hColors.length]);
      }
      break;
    }

    case 'filmstrip': {
      ctx.fillStyle = frame.borderColor;
      ctx.fillRect(0, 0, w, h);
      // Film perforations along top and bottom
      const holeW = fw * 0.38;
      const holeH = fw * 0.5;
      const spacing = holeW * 2.2;
      ctx.fillStyle = '#333';
      for (let x = spacing; x < w - spacing / 2; x += spacing) {
        const rx = x - holeW / 2;
        // Top holes
        ctx.beginPath();
        ctx.rect(rx, fw * 0.18, holeW, holeH);
        ctx.fill();
        // Bottom holes
        ctx.beginPath();
        ctx.rect(rx, h - fw * 0.18 - holeH, holeW, holeH);
        ctx.fill();
      }
      // Thin edge line
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(fw * 0.92, fw * 0.92, w - fw * 1.84, h - fw * 1.84);
      break;
    }

    case 'lights': {
      ctx.fillStyle = frame.borderColor;
      ctx.fillRect(0, 0, w, h);
      const lColors = ['#ff4444', '#ffdd00', '#44dd44', '#4488ff', '#ff69b4', '#ff8800', '#aa44ff', '#00dddd'];
      const bulbR = fw * 0.17;
      // Wire along all edges
      ctx.strokeStyle = 'rgba(120,120,120,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, fw * 0.45);
      ctx.lineTo(w, fw * 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, h - fw * 0.45);
      ctx.lineTo(w, h - fw * 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fw * 0.45, 0);
      ctx.lineTo(fw * 0.45, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w - fw * 0.45, 0);
      ctx.lineTo(w - fw * 0.45, h);
      ctx.stroke();
      // Bulbs along top
      let ci = 0;
      for (let i = 0; i < 14; i++) {
        const bx = fw * 0.2 + (w - fw * 0.4) * (i / 13);
        drawLightBulb(ctx, bx, fw * 0.45, bulbR, lColors[ci++ % lColors.length]);
      }
      // Bottom
      for (let i = 0; i < 14; i++) {
        const bx = fw * 0.2 + (w - fw * 0.4) * (i / 13);
        drawLightBulb(ctx, bx, h - fw * 0.45, bulbR, lColors[ci++ % lColors.length]);
      }
      // Left
      for (let i = 1; i < 9; i++) {
        const by = fw + (h - fw * 2) * (i / 9);
        drawLightBulb(ctx, fw * 0.45, by, bulbR, lColors[ci++ % lColors.length]);
      }
      // Right
      for (let i = 1; i < 9; i++) {
        const by = fw + (h - fw * 2) * (i / 9);
        drawLightBulb(ctx, w - fw * 0.45, by, bulbR, lColors[ci++ % lColors.length]);
      }
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

// Draw protruding/overlapping decorative elements (drawn ON TOP of the image)
function drawFrameOverlays(ctx, frameId, w, h, fw) {
  const frame = FRAMES.find(f => f.id === frameId);
  if (!frame || frame.type === 'none') return;

  ctx.save();

  switch (frame.type) {
    case 'balloons': {
      const bColors = ['#ff4444', '#4488ff', '#ffdd00', '#44dd44', '#ff69b4', '#ff8800', '#aa44ff'];
      const bigR = fw * 1.3;
      // Top-left cluster protruding into image
      drawBalloon(ctx, fw * 0.7, fw * 0.4, bigR, bColors[0]);
      drawBalloon(ctx, fw * 1.7, fw * 0.15, bigR * 0.7, bColors[1]);
      drawBalloon(ctx, fw * 0.2, fw * 1.3, bigR * 0.55, bColors[2]);
      // Top-right cluster
      drawBalloon(ctx, w - fw * 0.7, fw * 0.4, bigR, bColors[3]);
      drawBalloon(ctx, w - fw * 1.7, fw * 0.15, bigR * 0.7, bColors[4]);
      drawBalloon(ctx, w - fw * 0.2, fw * 1.3, bigR * 0.55, bColors[5]);
      // Bottom-left
      drawBalloon(ctx, fw * 0.8, h - fw * 0.7, bigR * 0.9, bColors[5]);
      drawBalloon(ctx, fw * 1.6, h - fw * 0.35, bigR * 0.6, bColors[6]);
      // Bottom-right
      drawBalloon(ctx, w - fw * 0.8, h - fw * 0.7, bigR * 0.9, bColors[6]);
      drawBalloon(ctx, w - fw * 1.6, h - fw * 0.35, bigR * 0.6, bColors[0]);
      break;
    }

    case 'stars': {
      const goldA = '#ffd700';
      const goldB = '#ffed85';
      const bigR = fw * 0.85;
      const bigIR = bigR * 0.4;
      // Large corner stars that protrude into image
      drawStar5(ctx, fw, fw, bigR, bigIR, goldA);
      drawStar5(ctx, w - fw, fw, bigR * 0.9, bigIR * 0.9, goldB);
      drawStar5(ctx, fw, h - fw, bigR * 0.85, bigIR * 0.85, goldB);
      drawStar5(ctx, w - fw, h - fw, bigR * 0.95, bigIR * 0.95, goldA);
      // Mid-top and mid-bottom stars
      drawStar5(ctx, w / 2, fw * 0.35, bigR * 0.65, bigIR * 0.65, goldA);
      drawStar5(ctx, w / 2, h - fw * 0.35, bigR * 0.65, bigIR * 0.65, goldB);
      break;
    }

    case 'neon': {
      // Glow bleed effect into image corners
      const glowR = fw * 1.5;
      ctx.save();
      ctx.globalAlpha = 0.25;
      const nColors = ['#ff00ff', '#00ffff', '#ff00ff', '#00ffff'];
      const corners = [[0, 0], [w, 0], [w, h], [0, h]];
      for (let i = 0; i < corners.length; i++) {
        const grad = ctx.createRadialGradient(corners[i][0], corners[i][1], 0, corners[i][0], corners[i][1], glowR);
        grad.addColorStop(0, nColors[i]);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(corners[i][0] - glowR, corners[i][1] - glowR, glowR * 2, glowR * 2);
      }
      ctx.restore();
      break;
    }

    case 'confetti': {
      const cColors = ['#ff6b6b', '#ffd700', '#00d4ff', '#39ff14', '#ff69b4', '#a855f7', '#ff8800'];
      // Deterministic confetti near edges, protruding into image
      for (let i = 0; i < 40; i++) {
        const seed1 = ((i * 2731 + 17) % 1000) / 1000;
        const seed2 = ((i * 3571 + 23) % 1000) / 1000;
        const edge = i % 4;
        let px, py;
        if (edge === 0) { px = fw * seed1 * 1.5; py = fw + seed2 * (h - fw * 2); }
        else if (edge === 1) { px = w - fw * seed1 * 1.5; py = fw + seed2 * (h - fw * 2); }
        else if (edge === 2) { px = fw + seed1 * (w - fw * 2); py = fw * seed2 * 1.5; }
        else { px = fw + seed1 * (w - fw * 2); py = h - fw * seed2 * 1.5; }

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((i * 0.8) % (Math.PI * 2));
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = cColors[i % cColors.length];
        if (i % 3 === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, 2 + (i % 4), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-2, -5, 4 + (i % 3), 9);
        }
        ctx.restore();
      }
      break;
    }

    case 'hearts': {
      const hColors = ['#ff1744', '#e91e63', '#f44336', '#ff4081', '#c71585'];
      const bigS = fw * 1.1;
      // Corner hearts that protrude into image
      drawHeart(ctx, fw, fw, bigS, hColors[0]);
      drawHeart(ctx, w - fw, fw, bigS * 0.9, hColors[1]);
      drawHeart(ctx, fw, h - fw, bigS * 0.85, hColors[2]);
      drawHeart(ctx, w - fw, h - fw, bigS * 0.9, hColors[3]);
      // Small hearts along mid-edges
      drawHeart(ctx, w / 2, fw * 0.3, bigS * 0.5, hColors[4]);
      drawHeart(ctx, w / 2, h - fw * 0.3, bigS * 0.5, hColors[0]);
      drawHeart(ctx, fw * 0.3, h / 2, bigS * 0.45, hColors[1]);
      drawHeart(ctx, w - fw * 0.3, h / 2, bigS * 0.45, hColors[2]);
      break;
    }

    case 'lights': {
      const bulbR = fw * 0.32;
      const lColors = ['#ff4444', '#ffdd00', '#44dd44', '#4488ff', '#ff69b4', '#ff8800'];
      // Larger glowing bulbs at corners that protrude
      drawLightBulb(ctx, fw, fw, bulbR * 1.6, lColors[0]);
      drawLightBulb(ctx, w - fw, fw, bulbR * 1.6, lColors[1]);
      drawLightBulb(ctx, fw, h - fw, bulbR * 1.6, lColors[2]);
      drawLightBulb(ctx, w - fw, h - fw, bulbR * 1.6, lColors[3]);
      break;
    }

    // filmstrip: no overlays (intentionally rigid/rectangular)
  }

  ctx.restore();
}

// Thumbnail background for frame selector
function getFrameThumbStyle(frame) {
  switch (frame.type) {
    case 'none':
      return { background: 'var(--glass)' };
    case 'solid':
      return { background: frame.color };
    case 'balloons':
      return { background: 'linear-gradient(135deg, #b8860b, #ffd700, #daa520)' };
    case 'stars':
      return { background: frame.borderColor };
    case 'neon':
      return { background: frame.borderColor, boxShadow: `inset 0 0 10px ${frame.glowColor}, 0 0 8px ${frame.glowColor}` };
    case 'confetti':
      return { background: frame.borderColor };
    case 'hearts':
      return { background: frame.borderColor };
    case 'filmstrip':
      return { background: frame.borderColor };
    case 'lights':
      return { background: frame.borderColor };
    default:
      return { background: 'var(--glass)' };
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
                    bottom: '-44px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 10,
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <button
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.3)',
                      color: '#fff', fontSize: '1.3rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(8px)',
                    }}
                    onClick={(e) => { e.stopPropagation(); resizeSticker(i, -15); }}
                  >−</button>
                  <button
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.3)',
                      color: '#fff', fontSize: '1.3rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(8px)',
                    }}
                    onClick={(e) => { e.stopPropagation(); resizeSticker(i, 15); }}
                  >+</button>
                  <button
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(231,76,60,0.85)', border: 'none',
                      color: '#fff', fontSize: '1rem', cursor: 'pointer',
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
