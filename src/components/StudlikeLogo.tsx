type Props = {
  className?: string;
  size?: number;
};

// Unique gradient IDs per instance to avoid SVG collisions when rendered multiple times
let _id = 0;

export function StudlikeLogo({ className = "", size = 40 }: Props) {
  const id = `sl-${++_id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Studlike"
      role="img"
    >
      <defs>
        <radialGradient id={id} cx="38%" cy="30%" r="72%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#7AABFF" />
          <stop offset="50%" stopColor="#4B82F5" />
          <stop offset="100%" stopColor="#3461D8" />
        </radialGradient>
      </defs>

      <rect width="512" height="512" fill={`url(#${id})`} />

      {/* depth shadow */}
      <text
        x="264"
        y="386"
        fontFamily="'Arial Rounded MT Bold', 'Nunito', 'DM Sans', Arial, sans-serif"
        fontSize="360"
        fontWeight="900"
        textAnchor="middle"
        fill="#3050C0"
        opacity="0.45"
      >
        S
      </text>

      {/* white letter */}
      <text
        x="256"
        y="374"
        fontFamily="'Arial Rounded MT Bold', 'Nunito', 'DM Sans', Arial, sans-serif"
        fontSize="360"
        fontWeight="900"
        textAnchor="middle"
        fill="white"
      >
        S
      </text>
    </svg>
  );
}
