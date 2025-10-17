/**
 * SVG filters for color blindness simulation
 * These filters transform colors to simulate how they would appear to someone with various
 * types of color vision deficiency
 */
export default function SVGFilters() {
  return (
    <svg 
      aria-hidden="true" 
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      {/* Protanopia Filter (red-blind) */}
      <defs>
        <filter id="protanopia-filter">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0.567, 0.433, 0,     0, 0
                    0.558, 0.442, 0,     0, 0
                    0,     0.242, 0.758, 0, 0
                    0,     0,     0,     1, 0"
          />
        </filter>
      </defs>

      {/* Deuteranopia Filter (green-blind) */}
      <defs>
        <filter id="deuteranopia-filter">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0.625, 0.375, 0,   0, 0
                    0.7,   0.3,   0,   0, 0
                    0,     0.3,   0.7, 0, 0
                    0,     0,     0,   1, 0"
          />
        </filter>
      </defs>

      {/* Tritanopia Filter (blue-blind) */}
      <defs>
        <filter id="tritanopia-filter">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0.95, 0.05,  0,     0, 0
                    0,    0.433, 0.567, 0, 0
                    0,    0.475, 0.525, 0, 0
                    0,    0,     0,     1, 0"
          />
        </filter>
      </defs>
    </svg>
  );
}