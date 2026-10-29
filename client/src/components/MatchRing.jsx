export default function MatchRing({ score, size = 64, label = true, stroke = 6 }) {
  const s = Number(score) || 0;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (s / 100) * circ;
  const color = s >= 80 ? '#00A868' : s >= 60 ? '#F5A524' : '#98A2B3';
  return (
    <div className="match-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8EEF9" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="match-ring-value" style={{ color, fontSize: size * 0.26 }}>
        {s}%
      </span>
      {label && <span className="match-ring-label">Match</span>}
    </div>
  );
}
