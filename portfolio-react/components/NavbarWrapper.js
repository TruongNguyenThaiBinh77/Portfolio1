'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import NavbarBrand from './NavbarBrand';

export default function NavbarWrapper({ config, lang }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Đóng menu khi người dùng chuyển trang
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lắng nghe sự kiện cuộn trang để chuyển đổi giao diện header
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.getElementById('navbar');
      if (!navbar) return;
      if (window.scrollY > 35) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="container">
      <NavbarBrand config={config} lang={lang} />
      
      <button 
        className={`navbar-toggler ${isOpen ? '' : 'collapsed'} navbar-toggler-main`} 
        type="button" 
        onClick={toggleNavbar}
        aria-controls="navbarNav" 
        aria-expanded={isOpen} 
        aria-label="Toggle navigation"
      >
        <span className="sr-only">Toggle navigation</span>
        <span className="icon-bar top-bar"></span>
        <span className="icon-bar middle-bar"></span>
        <span className="icon-bar bottom-bar"></span>
      </button>

      <div className={`collapse navbar-collapse navbar-collapse-main ${isOpen ? 'show' : ''}`} id="navbarNav" style={{ flexGrow: 0 }}>
        <Navbar config={config} lang={lang} />
      </div>
    </div>
  );
}
