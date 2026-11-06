// Divider between the red top banner and the beige page body (also reused, flipped, above the Pác Bó photo).
// The embroidered cloud band is a flat silhouette in the page background colour with only faint "vein"
// lines from the darkest thread grooves ("GÂN 1"). Both are vector masks traced from the embroidery photo
// (header-embroidery-shape.svg / -veins.svg), so the band stays crisp at any zoom level; colours stay in CSS.

const SHAPE_MASK = 'url(/assets/img/header-embroidery-shape.svg)';
const VEINS_MASK = 'url(/assets/img/header-embroidery-veins.svg)';

const VEIN_COLOR = '#9b7a58';
// veins.svg stacks two levels (0.45 + 0.55 → ~0.75 at the core); 0.29 × 0.75 ≈ 0.22 = "GÂN 1" intensity
const VEIN_LAYER_OPACITY = 0.29;

// Same placement as an SVG viewBox with preserveAspectRatio="xMidYMax slice": fill, anchored at the bottom.
const maskLayer = (mask) => ({
  position: 'absolute',
  inset: 0,
  WebkitMaskImage: mask,
  maskImage: mask,
  WebkitMaskSize: 'cover',
  maskSize: 'cover',
  WebkitMaskPosition: 'center bottom',
  maskPosition: 'center bottom',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
});

// flip: mirror vertically (flat beige on top, cloud edge hanging down) — used as a band above a photo.
export default function HeaderEmbroideryDivider({
  bgColor = '#FFF1E5', height = 110, flip = false, className = 'header-embroidery-divider', style,
}) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', bottom: '-1px', left: 0, width: '100%', height: `${height}px`, zIndex: 5, pointerEvents: 'none', lineHeight: 0, ...style }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: flip ? 'scaleY(-1)' : undefined,
          // thin shadow on the outer side of the cloud edge
          filter: 'drop-shadow(0 -1px 2.5px rgba(42, 0, 0, 0.32))',
          // …but never past the flat base edge (it would draw a grey line on the page there)
          clipPath: 'inset(-40px -40px 0 -40px)',
        }}
      >
        <div style={{ ...maskLayer(SHAPE_MASK), backgroundColor: bgColor }} />
        <div style={{ ...maskLayer(VEINS_MASK), backgroundColor: VEIN_COLOR, opacity: VEIN_LAYER_OPACITY }} />
      </div>
    </div>
  );
}
