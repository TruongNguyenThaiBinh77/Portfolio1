'use client';

import React from 'react';
import HeaderEmbroideryDivider from '../../../components/HeaderEmbroideryDivider';

// "Tức cảnh Pác Bó" with a scroll-driven story:
//  1. the 1961 Pác Bó photo fills the whole section as a background and fades/focuses in while scrolling;
//  2. a left→right overlay (clear over Bác on the left, dense on the right) appears, the poem sits on it;
//  3. the panel stays pinned while the next section ("Phong trào…") slides up over it.
// Pinning (and the cover) only runs on wide, tall-enough screens without reduced motion; the same
// media query lives in CSS (layout) and JS (effects) so the server render matches.
const PIN_QUERY = '(min-width: 992px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)';

// Scroll lengths in viewport heights (vh). Section height = 1 (pinned panel) + REVEAL_HOLD + COVER.
const REVEAL_HOLD = 0.8; // scrolling spent revealing + resting on the finished composition
const COVER = 1; // scrolling while the next section slides over (next section uses margin-top: -100vh)

// Embroidered cloud band above the section (flipped header divider). The photo's top edge tucks under it:
// the flipped beige silhouette is solid from the band top down to at least ~26% of its height (deeper in
// most places), so the photo must start above that line → overlap = band height minus ~22-24px.
const BAND_H = 110;
const BAND_H_SMALL = 96;
const BAND_OVERLAP = BAND_H - 24;
const BAND_OVERLAP_SMALL = BAND_H_SMALL - 22;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeOut = (v) => 1 - Math.pow(1 - v, 3);
const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return '255, 241, 229';
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

export default function PacBoScrollSection({
  title, subtitle, lines, image, caption, drumImg, hasCover, coverEdge = 0, bgColor = '#FFF1E5',
  overlayStrength = 100, overlayBlur = 7, showBand = true,
}) {
  const wrapRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const bgRef = React.useRef(null);
  const overlayRef = React.useRef(null);
  const textRef = React.useRef(null);
  const lineRefs = React.useRef([]);

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const panel = panelRef.current;
    if (!wrap || !panel) return;
    const mq = window.matchMedia(PIN_QUERY);
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const top = wrap.getBoundingClientRect().top;
      const pinned = mq.matches;

      // 1) background photo: fades in, zooms out and comes into focus as the section enters
      const r = easeOut(clamp01((vh * 0.95 - top) / (pinned ? vh * 1.15 : vh * 0.7)));
      const bg = bgRef.current;
      if (bg) {
        bg.style.opacity = String(r);
        bg.style.transform = `scale(${(1.14 - 0.14 * r).toFixed(4)})`;
        bg.style.filter = `blur(${(10 * (1 - r)).toFixed(2)}px) sepia(${(0.3 * r).toFixed(3)}) contrast(1.05)`;
      }

      // 2) overlay, then title block, then poem lines one by one
      const t = clamp01((vh * 0.6 - top) / (pinned ? vh * 1.1 : vh * 0.6));
      if (overlayRef.current) overlayRef.current.style.opacity = String(easeOut(clamp01(t * 2)));
      const text = textRef.current;
      if (text) {
        const h = easeOut(clamp01((t - 0.15) * 2.6));
        text.style.opacity = String(h);
        text.style.transform = `translate3d(${(40 * (1 - h)).toFixed(1)}px, 0, 0)`;
      }
      lineRefs.current.forEach((el, i) => {
        if (!el) return;
        const p = easeOut(clamp01((t - 0.35 - i * 0.12) / 0.28));
        el.style.opacity = String(p);
        el.style.transform = `translate3d(${(30 * (1 - p)).toFixed(1)}px, 0, 0)`;
      });

      // 3) cover: the next section's top edge rises through the viewport; clip the panel under it
      if (pinned && hasCover) {
        const total = (1 + REVEAL_HOLD + COVER) * vh;
        const nextTop = top + total - COVER * vh; // where the next section's top currently is
        const c = clamp01((vh - nextTop) / vh);
        // cut where the next section becomes opaque (below its transparent torn edge), so the photo runs
        // right under it; the panel keeps full width — no shrinking, no side or bottom gaps
        const cut = Math.max(0, Math.min(vh + 2, vh - (nextTop + coverEdge)));
        panel.style.clipPath = cut > 0 ? `inset(0 0 ${cut.toFixed(1)}px 0)` : '';
        panel.style.transform = '';
        panel.style.filter = c > 0 ? `brightness(${(1 - 0.2 * c).toFixed(3)})` : '';
      } else {
        panel.style.clipPath = '';
        panel.style.transform = '';
        panel.style.filter = '';
      }
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    mq.addEventListener?.('change', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mq.removeEventListener?.('change', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [hasCover, coverEdge, lines.length]);

  const sectionVh = Math.round((1 + REVEAL_HOLD + (hasCover ? COVER : 0)) * 100);
  const rgb = hexToRgb(bgColor);
  // admin "độ đậm lớp phủ": scales every stop of the left→right wash (100 = default look)
  const k = Math.max(0, Number(overlayStrength) || 0) / 100;
  const a = (v) => Math.min(1, v * k).toFixed(3);
  const blurPx = Math.max(0, Math.min(30, Number(overlayBlur) || 0));

  return (
    <>
    {showBand && (
      <div className="pacbo-band" aria-hidden="true">
        <HeaderEmbroideryDivider
          flip
          bgColor={bgColor}
          className="pacbo-band-embroidery"
          style={{ top: 0, bottom: 'auto', height: '100%', zIndex: 'auto' }}
        />
      </div>
    )}
    <section ref={wrapRef} className={`pacbo-scroll${hasCover ? ' has-cover' : ''}`}>
      <style>{`
        .pacbo-band {
          position: relative; z-index: 3; pointer-events: none;
          width: 100vw; margin-left: calc(50% - 50vw); height: ${BAND_H}px; margin-bottom: -${BAND_OVERLAP}px;
        }
        .pacbo-band + .pacbo-scroll { margin-top: 0; }
        .pacbo-scroll { position: relative; margin: 10px 0 35px 0; }
        .pacbo-panel {
          position: relative; overflow: hidden; will-change: clip-path;
          width: 100vw; margin-left: calc(50% - 50vw); background: rgb(${rgb});
        }
        .pacbo-bg {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 30% 45%;
          opacity: 0; will-change: transform, opacity, filter;
        }
        .pacbo-overlay { position: absolute; inset: 0; opacity: 0; pointer-events: none; }
        /* frosted layer: blur behind the text side only, fading in from the left */
        .pacbo-overlay::before {
          content: ''; position: absolute; inset: 0;
          -webkit-backdrop-filter: blur(${blurPx}px); backdrop-filter: blur(${blurPx}px);
          -webkit-mask-image: linear-gradient(90deg, transparent 30%, #000 62%);
          mask-image: linear-gradient(90deg, transparent 30%, #000 62%);
        }
        /* colour wash: clear on the left (Bác), denser and denser to the right */
        .pacbo-overlay::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg,
            rgba(${rgb}, 0) 0%, rgba(${rgb}, ${a(0.08)}) 28%, rgba(${rgb}, ${a(0.55)}) 45%,
            rgba(${rgb}, ${a(0.86)}) 60%, rgba(${rgb}, ${a(0.94)}) 78%, rgba(${rgb}, ${a(0.97)}) 100%);
        }
        .pacbo-caption {
          position: absolute; left: 28px; bottom: 22px; z-index: 2; max-width: 40%;
          font-family: "Roboto Slab", "Times New Roman", serif; font-style: italic; font-size: 13.5px;
          color: #fff8ec; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75), 0 0 12px rgba(0, 0, 0, 0.45);
        }
        .pacbo-content {
          position: relative; z-index: 2; display: flex; justify-content: flex-end;
          width: 100%; max-width: 1280px; margin: 0 auto; padding: 0 40px; box-sizing: border-box;
        }
        .pacbo-text { position: relative; width: min(540px, 42%); text-align: center; opacity: 0; }
        .pacbo-line { opacity: 0; }

        @media ${PIN_QUERY} {
          .pacbo-scroll { height: ${sectionVh}vh; margin-bottom: 0; }
          .pacbo-panel {
            position: sticky; top: 0; height: 100vh; display: flex; align-items: center;
            padding-top: 56px; box-sizing: border-box;
          }
        }
        /* small screens: photo on top, wash fades it into the page colour, poem underneath */
        @media not all and ${PIN_QUERY} {
          .pacbo-band { height: ${BAND_H_SMALL}px; margin-bottom: -${BAND_OVERLAP_SMALL}px; }
          .pacbo-panel { padding: 0 0 36px 0; }
          .pacbo-bg { height: min(62vh, 520px); bottom: auto; object-position: 22% 45%; }
          .pacbo-overlay::before { display: none; }
          .pacbo-overlay::after {
            height: min(62vh, 520px); bottom: auto;
            background: linear-gradient(180deg, rgba(${rgb}, 0) 0%, rgba(${rgb}, 0) 45%, rgba(${rgb}, ${a(0.75)}) 80%, rgb(${rgb}) 100%);
          }
          .pacbo-caption {
            top: calc(min(62vh, 520px) - 56px); bottom: auto; left: 16px; right: 16px; max-width: none;
            text-align: center; color: #7a5638; text-shadow: none;
          }
          .pacbo-content { padding: calc(min(62vh, 520px) - 24px) 16px 0 16px; justify-content: center; }
          .pacbo-text { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pacbo-bg, .pacbo-overlay, .pacbo-text, .pacbo-line { opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      <div ref={panelRef} className="pacbo-panel">
        <img ref={bgRef} className="pacbo-bg" src={image} alt={caption} decoding="async" />
        <div ref={overlayRef} className="pacbo-overlay" aria-hidden="true" />
        {caption && <div className="pacbo-caption">{caption}</div>}

        <div className="pacbo-content">
          <div ref={textRef} className="pacbo-text">
            {/* faint bronze-drum watermark behind the poem */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '440px', height: '440px', maxWidth: '100%',
                backgroundImage: `url(${drumImg})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                opacity: 0.06, pointerEvents: 'none', filter: 'sepia(40%) saturate(120%)', zIndex: 0,
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{
                fontFamily: '"Playfair Display", "Roboto Slab", "Times New Roman", serif',
                fontSize: 'clamp(26px, 3.2vw, 40px)', fontWeight: 800, color: '#68350B',
                letterSpacing: '2px', margin: '0 0 10px 0', textTransform: 'uppercase',
              }}>
                {title}
              </h2>
              <p style={{
                fontSize: '15px', fontStyle: 'italic', color: '#7A4A26', margin: '0 auto 20px auto', letterSpacing: '0.3px',
                fontFamily: '"Roboto Slab", "Playfair Display", "Times New Roman", serif',
              }}>
                {subtitle}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', maxWidth: '260px', margin: '0 auto 22px auto' }}>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, rgba(197, 160, 89, 0.7), transparent)' }} />
                <span style={{ color: '#C5A059', fontSize: '14px' }}>✦</span>
                <span style={{ color: '#D32F2F', fontSize: '16px' }}>★</span>
                <span style={{ color: '#C5A059', fontSize: '14px' }}>✦</span>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(197, 160, 89, 0.7), transparent)' }} />
              </div>

              <div style={{ margin: '0 auto 22px auto', padding: '6px 0' }}>
                {lines.map((line, idx) => {
                  let formatted = line.trim();
                  if (idx === 0 && !formatted.startsWith('“') && !formatted.startsWith('"')) formatted = '“' + formatted;
                  if (idx === lines.length - 1 && !formatted.endsWith('”') && !formatted.endsWith('"')) formatted += '”';
                  return (
                    <p
                      key={idx}
                      ref={(el) => { lineRefs.current[idx] = el; }}
                      className="pacbo-line"
                      style={{
                        fontFamily: '"Playfair Display", "Roboto Slab", "Times New Roman", serif',
                        fontSize: 'clamp(19px, 2.05vw, 27px)', fontWeight: 700, lineHeight: 1.9,
                        color: idx === lines.length - 1 ? '#9A2617' : '#27170E', margin: 0, letterSpacing: '0.2px',
                      }}
                    >
                      {formatted}
                    </p>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img
                  src="/assets/img/ho_chi_minh_signature.svg"
                  alt="Chữ ký Chủ tịch Hồ Chí Minh"
                  style={{ height: '50px', width: 'auto', display: 'block', filter: 'contrast(1.25) brightness(0.9)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}

// Class + rule for the element that slides over the pinned panel (placed right after the section).
export const PACBO_COVER_CLASS = 'pacbo-cover-target';
export const pacboCoverCss = `
  .${PACBO_COVER_CLASS} { position: relative; z-index: 3; }
  @media ${PIN_QUERY} { .${PACBO_COVER_CLASS} { margin-top: -100vh !important; } }
`;
