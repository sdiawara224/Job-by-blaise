import { useEffect, useRef, useState } from 'react';

/** Anneau de match : cercle SVG animé (tracé) + compteur qui s'incrémente. */
export default function MatchRing({ score, size = 64, label = true, stroke = 6 }) {
  const target = Number(score) || 0;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (target / 100) * circ;
  const color = target >= 80 ? '#00A868' : target >= 60 ? '#F5A524' : '#98A2B3';

  const [display, setDisplay] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || target <= 0) { setDisplay(target); return; }
    const start = performance.now();
    const dur = 900;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(eased * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  return (
    <div className="match-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8EEF9" strokeWidth={stroke} />
        <circle
          className="match-ring-progress"
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ '--ring-c': circ, '--ring-off': offset }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="match-ring-value" style={{ color, fontSize: size * 0.26 }}>
        {display}%
      </span>
      {label && <span className="match-ring-label">Match</span>}
    </div>
  );
}
