'use client';

import React, { useState, useEffect } from 'react';

const THEMES = [
  { id: 'theme-midnight', name: 'Midnight Blue', className: 'btn-midnight' },
  { id: 'theme-emerald', name: 'Obsidian Emerald', className: 'btn-emerald' },
  { id: 'theme-rose', name: 'Sunset Rose', className: 'btn-rose' },
  { id: 'theme-cyberpunk', name: 'Cyberpunk Neon', className: 'btn-cyberpunk' },
  { id: 'theme-gold', name: 'Obsidian Gold', className: 'btn-gold' },
];

export default function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState('theme-midnight');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem('app-theme') || 'theme-midnight';
      setActiveTheme(savedTheme);
      applyTheme(savedTheme);
    } catch (e) {
      console.error('Error loading theme:', e);
    }
  }, []);

  const applyTheme = (themeId) => {
    if (typeof window === 'undefined') return;
    const docEl = document.documentElement;
    
    // Remove all theme classes
    THEMES.forEach((t) => {
      docEl.classList.remove(t.id);
    });

    // Add selected theme class
    docEl.classList.add(themeId);
  };

  const handleThemeChange = (themeId) => {
    setActiveTheme(themeId);
    applyTheme(themeId);
    try {
      localStorage.setItem('app-theme', themeId);
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  };

  // Prevent hydration mismatch by returning a placeholder layout of identical size before mounting
  if (!mounted) {
    return (
      <div className="theme-switcher" style={{ minWidth: '150px', height: '34px', opacity: 0.5 }}>
        <span className="theme-switcher-title">Theme</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {THEMES.map((t) => (
            <div key={t.id} className="theme-btn" style={{ background: '#334155' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="theme-switcher">
      <span className="theme-switcher-title">Theme</span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`theme-btn ${theme.className} ${activeTheme === theme.id ? 'active' : ''}`}
            onClick={() => handleThemeChange(theme.id)}
            data-theme-name={theme.name}
            aria-label={`Switch theme to ${theme.name}`}
          />
        ))}
      </div>
    </div>
  );
}
