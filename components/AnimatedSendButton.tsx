'use client';

import React from 'react';

interface AnimatedSendButtonProps {
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export default function AnimatedSendButton({ onClick, disabled = false }: AnimatedSendButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    const button = document.getElementById('animated-send-btn');
    if (button) {
      button.classList.add('sending');
      setTimeout(() => {
        button.classList.remove('sending');
      }, 2000);
    }
    
    onClick(e);
  };

  return (
    <button
      id="animated-send-btn"
      onClick={handleClick}
      disabled={disabled}
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: 'none',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '24px', height: '24px' }}
      >
        <path 
          d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      
      <style jsx>{`
        #animated-send-btn.sending {
          animation: sendPulse 0.6s ease-out;
        }
        
        @keyframes sendPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        
        #animated-send-btn.sending svg {
          animation: paperPlane 0.6s ease-out;
        }
        
        @keyframes paperPlane {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(10px, -10px) rotate(45deg);
            opacity: 0.5;
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </button>
  );
}
