'use client';

import React, { ReactNode } from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  tooltip?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export default function FloatingActionButton({
  onClick,
  icon,
  tooltip = '',
  color = '#0ea5e9',
  size = 'medium',
  position = 'bottom-right'
}: FloatingActionButtonProps) {
  const getSize = () => {
    switch (size) {
      case 'small': return '48px';
      case 'large': return '72px';
      default: return '60px';
    }
  };

  const getPosition = () => {
    switch (position) {
      case 'bottom-left': return { bottom: '20px', left: '20px' };
      case 'top-right': return { top: '20px', right: '20px' };
      case 'top-left': return { top: '20px', left: '20px' };
      default: return { bottom: '20px', right: '20px' };
    }
  };

  return (
    <button
      onClick={onClick}
      title={tooltip}
      style={{
        position: 'fixed',
        ...getPosition(),
        width: getSize(),
        height: getSize(),
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        border: 'none',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: size === 'large' ? '28px' : size === 'small' ? '20px' : '24px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1000,
        backdropFilter: 'blur(10px)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = `0 12px 35px ${color}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
    >
      {icon}
    </button>
  );
}