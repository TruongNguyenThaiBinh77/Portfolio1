'use client';

import { useState, useEffect, useRef } from 'react';

export default function CvQuickNav({ sections = [], lang = 'vi' }) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const pillBarRef = useRef(null);
  const buttonRefs = useRef({});

  useEffect(() => {
    const handleScroll = () => {
      const isMobile = window.innerWidth < 768;
      const offsetThreshold = isMobile ? 140 : 120;

      if (window.scrollY < 80 && sections.length > 0) {
        setActiveSection(sections[0].id);
        return;
      }

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= offsetThreshold) {
            setActiveSection(sections[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  // Keep active button visible in mobile horizontal pill bar without scrolling the window
  useEffect(() => {
    if (!activeSection) return;
    const container = pillBarRef.current;
    const btn = buttonRefs.current[activeSection];

    if (container && btn && container.offsetWidth > 0) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const targetScrollLeft = container.scrollLeft + (btnRect.left - containerRect.left) - (container.clientWidth / 2) + (btn.offsetWidth / 2);

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth'
      });
    }
  }, [activeSection]);

  const scrollTo = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const navOffset = isMobile ? 110 : 85;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  if (!sections || sections.length === 0) return null;

  return (
    <>
      {/* Mobile Horizontal Pill Bar (< 768px) */}
      <div 
        className="d-block d-md-none cv-mobile-nav" 
        style={{
          width: '100%',
          position: 'sticky',
          top: '43px',
          zIndex: 30,
          backgroundColor: 'var(--global-bg-color)',
          padding: '8px 0',
          marginBottom: '16px',
          borderBottom: '1px solid var(--global-divider-color, rgba(0,0,0,0.1))',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        }}
      >
        <div 
          ref={pillBarRef}
          className="cv-pill-scroll"
          style={{ 
            display: 'flex', 
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            paddingBottom: '2px',
            paddingLeft: '2px',
            paddingRight: '2px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                ref={(el) => { if (el) buttonRefs.current[section.id] = el; }}
                onClick={(e) => scrollTo(e, section.id)}
                type="button"
                style={{
                  border: isActive ? '1px solid var(--global-theme-color)' : '1px solid var(--global-divider-color, #cbd5e1)',
                  backgroundColor: isActive ? 'var(--global-theme-color)' : 'var(--global-card-bg-color, transparent)',
                  color: isActive ? '#ffffff' : 'var(--global-text-color)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.84rem',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 2px 6px color-mix(in srgb, var(--global-theme-color) 35%, transparent)' : 'none',
                }}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sticky Vertical Navigation (>= 768px) */}
      <aside
        className="d-none d-md-block cv-sidebar"
        aria-label="CV Table of Contents"
        style={{
          width: '230px',
          flexShrink: 0,
          position: 'sticky',
          top: '90px',
          alignSelf: 'flex-start',
          paddingRight: '15px',
        }}
      >
        <div style={{
          fontSize: '0.78rem',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: '700',
          color: 'var(--global-text-color-light, #94a3b8)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '7px'
        }}>
          <i className="fa-solid fa-compass" style={{ fontSize: '0.85rem', color: 'var(--global-theme-color)' }}></i>
          <span>{lang === 'vi' ? 'Thao tác nhanh' : 'Quick Navigation'}</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(e) => scrollTo(e, section.id)}
                className={`cv-nav-item ${isActive ? 'is-active' : ''}`}
                style={{
                  display: 'block',
                  fontSize: '0.96rem',
                  fontWeight: isActive ? '700' : '600',
                  color: isActive 
                    ? 'var(--global-theme-color, #2563eb)' 
                    : 'var(--global-text-color)',
                  opacity: isActive ? 1 : 0.78,
                  padding: '6px 10px 6px 12px',
                  borderLeft: isActive 
                    ? '3px solid var(--global-theme-color, #2563eb)' 
                    : '3px solid transparent',
                  borderRadius: '0 6px 6px 0',
                  backgroundColor: isActive 
                    ? 'color-mix(in srgb, var(--global-theme-color) 8%, transparent)' 
                    : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.18s ease-in-out',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.color = 'var(--global-hover-color, var(--global-theme-color))';
                    e.currentTarget.style.transform = 'translateX(3px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.opacity = '0.78';
                    e.currentTarget.style.color = 'var(--global-text-color)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                {section.label}
              </a>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
