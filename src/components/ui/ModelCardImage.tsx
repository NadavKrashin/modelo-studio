'use client';

interface Props {
  hue?: number;
  className?: string;
}

const SHAPES = [
  'M32 12L50 22V42L32 52L14 42V22L32 12Z',
  'M32 10C44 10 54 20 54 32C54 44 44 54 32 54C20 54 10 44 10 32C10 20 20 10 32 10Z',
  'M32 10L54 32L32 54L10 32L32 10Z',
  'M20 14H44C47.3137 14 50 16.6863 50 20V44C50 47.3137 47.3137 50 44 50H20C16.6863 50 14 47.3137 14 44V20C14 16.6863 16.6863 14 20 14Z',
  'M32 10L40 18L54 20L44 32L46 46L32 40L18 46L20 32L10 20L24 18L32 10Z',
];

export function ModelCardImage({ hue = 220, className = '' }: Props) {
  const shape = SHAPES[hue % SHAPES.length];
  const bg = `hsl(${hue}, 25%, 96%)`;
  const fill = `hsl(${hue}, 35%, 90%)`;
  const stroke = `hsl(${hue}, 40%, 78%)`;
  const accent = `hsl(${hue}, 50%, 68%)`;

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`} style={{ background: bg }}>
      <svg viewBox="0 0 64 64" className="w-2/3 h-2/3 opacity-60">
        <path d={shape} fill={fill} stroke={stroke} strokeWidth="1.2" />
        <circle cx="32" cy="32" r="4" fill={accent} opacity="0.7" />
      </svg>
      <div className="absolute bottom-2 left-2 flex gap-0.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent, opacity: 0.5 }} />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent, opacity: 0.3 }} />
      </div>
    </div>
  );
}
