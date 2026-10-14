'use client';

import { useState, useEffect } from 'react';

export default function CvQuickNav({ sections = [], lang = 'vi' }) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 130;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
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

  const scrollTo = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 80;
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
      <div className="d-block d-md-none mb-3" style={{
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        padding: '6px 0',
        borderBottom: '1px solid var(--global-divider-color, rgba(0,0,0,0.1))',
      }}>
        <div style={{ display: 'inline-flex', gap: '8px' }}>
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={(e) => scrollTo(e, section.id)}
                type="button"
                style={{
                  border: isActive ? '1px solid var(--global-theme-color)' : '1px solid var(--global-divider-color, #cbd5e1)',
                  backgroundColor: isActive ? 'var(--global-theme-color)' : 'var(--global-card-bg-color, transparent)',
                  color: isActive ? '#ffffff' : 'var(--global-text-color)',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
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
