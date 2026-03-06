import React from 'react';

export default function CountdownOverlay({ count, isFlashing }) {
  if (!count && !isFlashing) return null;

  return (
    <>
      {count && (
        <div className="countdown-overlay">
          <div className="countdown-number" key={count}>
            {count}
          </div>
        </div>
      )}
      {isFlashing && <div className="countdown-flash" />}
    </>
  );
}
