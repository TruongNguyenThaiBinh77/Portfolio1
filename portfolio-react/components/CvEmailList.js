'use client';

import React, { useState } from 'react';

export default function CvEmailList({ emailText = '', lang = 'vi' }) {
  const [copiedEmail, setCopiedEmail] = useState(null);

  if (!emailText) return null;

  // Split emails by newline or comma
  const emails = emailText
    .split(/\r?\n|,/)
    .map((e) => e.trim())
    .filter(Boolean);

  const handleCopy = async (email, e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = email;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopiedEmail(email);
      setTimeout(() => {
        setCopiedEmail(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {emails.map((email, idx) => {
        const isCopied = copiedEmail === email;
        return (
          <div
            key={idx}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <a
              href={`mailto:${email}`}
              style={{
                color: 'inherit',
                textDecoration: 'none',
                wordBreak: 'break-all',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--global-theme-color, #2563eb)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
            >
              {email}
            </a>

            <button
              type="button"
              onClick={(e) => handleCopy(email, e)}
              className="btn-cv-copy-email"
              title={
                isCopied
                  ? lang === 'vi'
                    ? 'Đã sao chép vào bộ nhớ tạm!'
                    : 'Copied to clipboard!'
                  : lang === 'vi'
                  ? `Sao chép ${email}`
                  : `Copy ${email}`
              }
              aria-label={lang === 'vi' ? `Sao chép email ${email}` : `Copy email ${email}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                border: 'none',
                backgroundColor: 'transparent',
                color: isCopied ? '#16a34a' : 'var(--global-text-color-light, #64748b)',
                cursor: 'pointer',
                transition: 'color 0.15s ease-in-out, transform 0.15s ease',
                outline: 'none',
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isCopied) {
                  e.currentTarget.style.color = 'var(--global-theme-color, #2563eb)';
                  e.currentTarget.style.transform = 'scale(1.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCopied) {
                  e.currentTarget.style.color = 'var(--global-text-color-light, #64748b)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <i
                className={isCopied ? 'fa-solid fa-check' : 'fa-regular fa-copy'}
                style={{
                  fontSize: isCopied ? '0.95rem' : '0.88rem',
                  color: isCopied ? '#16a34a' : 'inherit',
                  transition: 'all 0.15s ease',
                }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
