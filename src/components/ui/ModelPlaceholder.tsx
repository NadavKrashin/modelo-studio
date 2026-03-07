interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hue?: number;
  className?: string;
}

const SIZES = { sm: 32, md: 48, lg: 72, xl: 96 };

export function ModelPlaceholder({ size = 'md', hue = 220, className = '' }: Props) {
  const s = SIZES[size];
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="64" height="64" rx="16" fill={`hsl(${hue}, 30%, 95%)`} />
      <path
        d="M32 14L48 23V41L32 50L16 41V23L32 14Z"
        stroke={`hsl(${hue}, 40%, 75%)`}
        strokeWidth="1.5"
        fill={`hsl(${hue}, 30%, 92%)`}
      />
      <path
        d="M32 14L48 23L32 32L16 23L32 14Z"
        fill={`hsl(${hue}, 35%, 88%)`}
        stroke={`hsl(${hue}, 40%, 75%)`}
        strokeWidth="1.5"
      />
      <path
        d="M32 32V50"
        stroke={`hsl(${hue}, 40%, 75%)`}
        strokeWidth="1.5"
      />
      <circle cx="32" cy="32" r="3" fill={`hsl(${hue}, 50%, 70%)`} />
    </svg>
  );
}
