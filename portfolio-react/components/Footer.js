'use client';

import { useState } from 'react';

export default function Footer({ config = {}, cv = {}, lang = 'vi' }) {
  const [copied, setCopied] = useState(false);

  const isEn = lang === 'en';

  const fullName =
    (isEn && cv?.name_en)
      ? cv.name_en
      : [config.first_name, config.middle_name, config.last_name]
          .filter(Boolean)
          .join(' ') ||
        (isEn ? 'Truong Nguyen Thai Binh' : 'Trương Nguyễn Thái Bình');

  const email = cv?.email || 'truongnguyenthaibinh1050@gmail.com';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Unable to copy email:', error);
    }
  };

  return (
    <footer
      className="site-compact-footer mt-5"
      role="contentinfo"
      style={{
        borderTop:
          '1px solid var(--global-divider-color, rgba(0, 0, 0, 0.08))',
        backgroundColor:
          'var(--global-footer-bg, var(--global-bg-color, #ffffff))',
        color: 'var(--global-text-color, #334155)',
        padding: '12px 0',
        fontSize: '0.9rem',
        transition: 'all 0.3s ease',
      }}
    >
      <div className="container">
        <div
          className="d-flex flex-column align-items-center align-items-md-start gap-1 text-center text-md-start"
          style={{ minHeight: 'auto' }}
        >
          {/* Copyright */}
          <div
            style={{
              color: 'var(--global-text-color-light, #64748b)',
              fontWeight: 400,
            }}
          >
            &copy; 2026{' '}
            <strong
              style={{
                color: 'var(--global-text-color, #1e293b)',
              }}
            >
              {fullName}
            </strong>
            .{' '}
            {isEn
              ? 'All rights reserved.'
              : 'Tất cả các quyền được bảo lưu.'}
          </div>

          {/* Email contact - displayed below the name */}
          <div className="d-inline-flex align-items-center gap-1 flex-wrap justify-content-center justify-content-md-start">
            <span
              style={{
                color: 'var(--global-text-color-light, #64748b)',
              }}
            >
              <i
                className="fas fa-envelope me-1"
                style={{
                  color: 'var(--global-theme-color, #2563eb)',
                }}
                aria-hidden="true"
              ></i>
              {isEn
                ? 'Direct Contact Email:'
                : 'Email liên hệ trực tiếp:'}
            </span>

            <a
              href={`mailto:${email}`}
              className="fw-semibold text-decoration-none"
              style={{
                color: 'var(--global-theme-color, #2563eb)',
                fontFamily: 'monospace',
                fontSize: '0.92rem',
                transition: 'opacity 0.2s',
                overflowWrap: 'anywhere',
              }}
            >
              {email}
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-sm p-0 border-0 bg-transparent"
              style={{
                color: copied
                  ? '#10b981'
                  : 'var(--global-text-color-light, #94a3b8)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                marginLeft: '4px',
                transition: 'color 0.2s',
              }}
              title={isEn ? 'Copy email' : 'Sao chép email'}
              aria-label={isEn ? 'Copy email' : 'Sao chép email'}
            >
              <i
                className={copied ? 'fas fa-check' : 'far fa-copy'}
                aria-hidden="true"
              ></i>

              {copied && (
                <span
                  className="ms-1"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {isEn ? 'Copied!' : 'Đã chép!'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
