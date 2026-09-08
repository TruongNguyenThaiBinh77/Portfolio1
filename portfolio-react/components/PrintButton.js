'use client';
import React from 'react';

export default function PrintButton() {
  return (
    <a 
      href="#" 
      onClick={(e) => {
        e.preventDefault();
        window.print();
      }} 
      className="float-right"
      title="Print or Save as PDF"
      style={{ cursor: 'pointer' }}
    >
      <i className="fas fa-file-pdf" style={{ fontSize: '1.5rem', color: 'var(--global-theme-color)' }}></i>
    </a>
  );
}
