// Divider between the red top banner and the beige page body.
// The embroidered cloud band (header-embroidery.webp) is rendered as a flat silhouette in the
// page background colour; only the darkest thread grooves show through as faint "vein" lines.
// The silhouette comes from the image alpha, the veins from a luminance high-pass filter.

const IMG_W = 2890;
const IMG_H = 183;
const FABRIC = 'rgb(210,183,151)'; // fabric tone of the source photo; flat areas → no veins

// "GÂN 1" tuning: vein opacity, contrast gain and threshold (higher threshold = fewer veins)
const VEIN_COLOR = '#9b7a58';
const VEIN_OPACITY = 0.22;
const VEIN_GAIN = 7;
const VEIN_THRESHOLD = 0.09;

export default function HeaderEmbroideryDivider({ bgColor = '#FFF1E5', height = 110 }) {
  const id = 'header-embroidery-filter';
  return (
    <div
      className="header-embroidery-divider"
      aria-hidden="true"
      style={{ position: 'absolute', bottom: '-1px', left: 0, width: '100%', height: `${height}px`, zIndex: 5, pointerEvents: 'none', lineHeight: 0 }}
    >
      <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <filter id={id} filterUnits="userSpaceOnUse" x="-60" y="-60" width={IMG_W + 120} height={IMG_H + 100} colorInterpolationFilters="sRGB">
            {/* luminance of the photo over its own fabric colour */}
            <feFlood floodColor={FABRIC} result="fab" />
            <feComposite in="SourceGraphic" in2="fab" operator="over" result="flat" />
            <feColorMatrix in="flat" type="luminanceToAlpha" result="L" />
            <feGaussianBlur in="L" stdDeviation="0.5" result="Ls" />
            <feGaussianBlur in="L" stdDeviation="2.2" result="Ll" />
            {/* dark grooves = neighbourhood brighter than the pixel */}
            <feComposite in="Ll" in2="Ls" operator="arithmetic" k2="1" k3="-1" result="dk" />
            <feComponentTransfer in="dk" result="dkA">
              <feFuncA type="linear" slope={VEIN_GAIN} intercept={-VEIN_THRESHOLD * VEIN_GAIN} />
            </feComponentTransfer>
            <feFlood floodColor={VEIN_COLOR} floodOpacity={VEIN_OPACITY} />
            <feComposite in2="dkA" operator="in" />
            <feComposite in2="SourceAlpha" operator="in" result="vein" />
            {/* thin shadow on the red side of the edge */}
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
            <feOffset dx="0" dy="-1" result="sha" />
            <feFlood floodColor="#2a0000" floodOpacity="0.3" />
            <feComposite in2="sha" operator="in" result="sh" />
            {/* flat silhouette in the page colour */}
            <feFlood floodColor={bgColor} />
            <feComposite in2="SourceAlpha" operator="in" result="sil" />
            <feMerge>
              <feMergeNode in="sh" />
              <feMergeNode in="sil" />
              <feMergeNode in="vein" />
            </feMerge>
          </filter>
        </defs>
        <g filter={`url(#${id})`}>
          <image href="/assets/img/header-embroidery.webp" width={IMG_W} height={IMG_H} />
          {/* solid strip so the bottom edge never shows a seam */}
          <rect y={IMG_H - 1} width={IMG_W} height="41" fill={FABRIC} />
        </g>
      </svg>
    </div>
  );
}
