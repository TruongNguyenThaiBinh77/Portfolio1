'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Footer({ config = {}, cv = {}, lang = 'vi' }) {
  const [copiedEmail, setCopiedEmail] = useState('');

  const isEn = lang === 'en';

  const fullName =
    (isEn && cv?.name_en)
      ? cv.name_en
      : [config.first_name, config.middle_name, config.last_name]
          .filter(Boolean)
          .join(' ') ||
        (isEn ? 'Truong Nguyen Thai Binh' : 'Trương Nguyễn Thái Bình');

  const label = cv?.label || (isEn ? 'Software Engineer' : 'Kỹ sư Phần mềm');
  const location = cv?.location || '';

  // Mỗi email một dòng (cv.email có thể chứa nhiều email, ngăn cách bởi xuống dòng)
  const emails = String(cv?.email || 'truongnguyenthaibinh1050@gmail.com')
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const links = [
    { href: `/${lang}`, label: isEn ? 'About' : 'Về tôi' },
    { href: `/${lang}/cv`, label: isEn ? 'Curriculum Vitae' : 'Hồ sơ' },
    { href: `/${lang}/achievements`, label: isEn ? 'Achievements' : 'Thành tích' },
    { href: `/${lang}/publications`, label: isEn ? 'Publications' : 'Ấn phẩm' },
    { href: `/${lang}/repositories`, label: isEn ? 'Repositories' : 'Lưu trữ' },
  ];

  const handleCopy = async (mail) => {
    try {
      await navigator.clipboard.writeText(mail);
      setCopiedEmail(mail);
      setTimeout(() => setCopiedEmail(''), 2000);
    } catch (error) {
      console.error('Unable to copy email:', error);
    }
  };

  return (
    <footer className="site-footer mt-5" role="contentinfo">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .site-footer {
          position: relative;
          background: linear-gradient(180deg, var(--global-bg-color, #fff) 0%, rgba(153, 148, 5, 0.06) 100%);
          border-top: 3px solid var(--global-theme-color, #999405);
          color: var(--global-text-color, #334155);
          font-size: 0.92rem;
        }
        .site-footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1.6fr;
          gap: 36px;
          padding: 36px 0 26px;
        }
        .site-footer-title {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--global-theme-color, #999405);
          margin-bottom: 14px;
        }
        .site-footer-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--global-text-color, #1e293b);
          margin-bottom: 4px;
        }
        .site-footer-label {
          color: var(--global-text-color-light, #64748b);
          margin-bottom: 12px;
        }
        .site-footer-loc {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--global-text-color-light, #64748b);
        }
        .site-footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .site-footer-links a {
          color: var(--global-text-color, #334155);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s, transform 0.2s;
        }
        .site-footer-links a:hover {
          color: var(--global-theme-color, #999405);
          transform: translateX(4px);
        }
        .site-footer-links a i {
          font-size: 0.65rem;
          opacity: 0.6;
        }
        .site-footer-mail {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          margin-bottom: 8px;
          border: 1px solid var(--global-divider-color, rgba(0, 0, 0, 0.08));
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.55);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .site-footer-mail:hover {
          border-color: var(--global-theme-color, #999405);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
        }
        .site-footer-mail a {
          flex: 1;
          min-width: 0;
          color: var(--global-text-color, #334155);
          font-weight: 500;
          text-decoration: none;
          overflow-wrap: anywhere;
        }
        .site-footer-mail a:hover {
          color: var(--global-theme-color, #999405);
        }
        .site-footer-copy-btn {
          background: transparent;
          border: 0;
          padding: 2px 4px;
          cursor: pointer;
          color: var(--global-text-color-light, #94a3b8);
          font-size: 0.85rem;
          transition: color 0.2s;
        }
        .site-footer-copy-btn:hover {
          color: var(--global-theme-color, #999405);
        }
        .site-footer-bottom {
          border-top: 1px solid var(--global-divider-color, rgba(0, 0, 0, 0.08));
          padding: 14px 0;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          flex-wrap: wrap;
          gap: 8px;
          color: var(--global-text-color-light, #64748b);
          font-size: 0.85rem;
        }
        @media (max-width: 767.98px) {
          .site-footer-grid {
            grid-template-columns: 1fr;
            gap: 26px;
            padding: 28px 0 18px;
          }
          .site-footer-bottom {
            justify-content: center;
            text-align: center;
          }
        }
      `,
        }}
      />
      <div className="container">
        <div className="site-footer-grid">
          {/* Giới thiệu */}
          <div>
            <div className="site-footer-name">{fullName}</div>
            <div className="site-footer-label">{label}</div>
            {location && (
              <div className="site-footer-loc">
                <i
                  className="fas fa-location-dot"
                  style={{ color: 'var(--global-theme-color, #999405)' }}
                  aria-hidden="true"
                ></i>
                <span>{location}</span>
              </div>
            )}
          </div>

          {/* Liên kết nhanh */}
          <nav aria-label={isEn ? 'Footer navigation' : 'Điều hướng chân trang'}>
            <div className="site-footer-title">{isEn ? 'Quick links' : 'Liên kết nhanh'}</div>
            <ul className="site-footer-links">
              {links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <i className="fas fa-chevron-right" aria-hidden="true"></i>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Liên hệ: mỗi email một dòng */}
          <div>
            <div className="site-footer-title">{isEn ? 'Contact' : 'Liên hệ'}</div>
            {emails.map((mail) => (
              <div className="site-footer-mail" key={mail}>
                <i
                  className="fas fa-envelope"
                  style={{ color: 'var(--global-theme-color, #999405)' }}
                  aria-hidden="true"
                ></i>
                <a href={`mailto:${mail}`}>{mail}</a>
                <button
                  type="button"
                  className="site-footer-copy-btn"
                  onClick={() => handleCopy(mail)}
                  title={isEn ? 'Copy email' : 'Sao chép email'}
                  aria-label={isEn ? 'Copy email' : 'Sao chép email'}
                  style={copiedEmail === mail ? { color: '#10b981' } : undefined}
                >
                  <i className={copiedEmail === mail ? 'fas fa-check' : 'far fa-copy'} aria-hidden="true"></i>
                  {copiedEmail === mail && (
                    <span style={{ marginLeft: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {isEn ? 'Copied!' : 'Đã chép!'}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="site-footer-bottom">
          <span>
            &copy; 2026 <strong style={{ color: 'var(--global-text-color, #1e293b)' }}>{fullName}</strong>.{' '}
            {isEn ? 'All rights reserved.' : 'Tất cả các quyền được bảo lưu.'}
          </span>
        </div>
      </div>
    </footer>
  );
}
