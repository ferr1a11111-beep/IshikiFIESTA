import React, { useState, useCallback, useEffect, useRef } from 'react';

const LAYOUTS = {
  lower: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
    ['⬆', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫'],
    ['123', '😀', ' ', '.', '⏎'],
  ],
  upper: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['⬆', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
    ['123', '😀', ' ', '.', '⏎'],
  ],
  symbols: [
    ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
    ['-', '_', '=', '+', '[', ']', '{', '}', '|', '\\'],
    [':', ';', '"', "'", '<', '>', ',', '.', '?', '/'],
    ['ABC', '~', '`', '©', '®', '€', '£', '¥', '⌫'],
    ['ABC', '😀', ' ', '.', '⏎'],
  ],
  emoji: [
    ['🎉', '🎈', '🎊', '🎁', '🎂', '🥳', '🎵', '🎶', '💃', '🕺'],
    ['❤️', '💕', '💖', '✨', '⭐', '🌟', '🔥', '💯', '🎯', '🏆'],
    ['😎', '😂', '🤣', '😍', '🥰', '😘', '🤩', '😜', '🤪', '😈'],
    ['ABC', '👑', '🎩', '🕶️', '💋', '🌈', '🦄', '🍾', '⌫'],
    ['ABC', '123', ' ', '.', '⏎'],
  ],
};

export default function VirtualKeyboard({ targetRef, onInput, onEnter, onClose, visible }) {
  const [layout, setLayout] = useState('lower');
  const [capsLock, setCapsLock] = useState(false);
  const kbRef = useRef(null);

  // Prevent keyboard from stealing focus from input
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleKey = useCallback((key) => {
    if (!targetRef?.current) return;
    const input = targetRef.current;

    switch (key) {
      case '⬆':
        if (layout === 'lower') {
          setLayout('upper');
          setCapsLock(false);
        } else if (layout === 'upper' && !capsLock) {
          setCapsLock(true);
        } else {
          setLayout('lower');
          setCapsLock(false);
        }
        return;
      case '⌫': {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const val = input.value;
        if (start === end && start > 0) {
          const newVal = val.slice(0, start - 1) + val.slice(end);
          onInput(newVal);
          setTimeout(() => {
            input.setSelectionRange(start - 1, start - 1);
          }, 0);
        } else if (start !== end) {
          const newVal = val.slice(0, start) + val.slice(end);
          onInput(newVal);
          setTimeout(() => {
            input.setSelectionRange(start, start);
          }, 0);
        }
        return;
      }
      case '⏎':
        if (onEnter) onEnter();
        return;
      case '123':
        setLayout('symbols');
        return;
      case 'ABC':
        setLayout('lower');
        return;
      case '😀':
        setLayout('emoji');
        return;
      default: {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const val = input.value;
        const newVal = val.slice(0, start) + key + val.slice(end);
        onInput(newVal);
        const newPos = start + key.length;
        setTimeout(() => {
          input.setSelectionRange(newPos, newPos);
        }, 0);
        // Auto lowercase after one uppercase letter (if not caps lock)
        if (layout === 'upper' && !capsLock) {
          setLayout('lower');
        }
        break;
      }
    }
  }, [layout, capsLock, targetRef, onInput, onEnter]);

  if (!visible) return null;

  const rows = LAYOUTS[layout] || LAYOUTS.lower;

  return (
    <div
      className="virtual-keyboard"
      ref={kbRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* Close handle */}
      <div className="vk-header">
        <div className="vk-handle" />
        <button className="vk-close" onClick={onClose}>✕</button>
      </div>

      {rows.map((row, ri) => (
        <div key={ri} className="vk-row">
          {row.map((key, ki) => {
            let className = 'vk-key';
            let style = {};

            if (key === ' ') {
              className += ' vk-space';
            } else if (key === '⌫') {
              className += ' vk-special';
            } else if (key === '⬆') {
              className += ' vk-special';
              if (layout === 'upper') className += ' vk-active';
              if (capsLock) className += ' vk-caps-lock';
            } else if (['123', 'ABC', '😀', '⏎'].includes(key)) {
              className += ' vk-special';
            }

            return (
              <button
                key={`${ri}-${ki}-${key}`}
                className={className}
                style={style}
                onClick={() => handleKey(key)}
              >
                {key === ' ' ? 'espacio' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
