'use client';

import Link from 'next/link';

interface BackButtonProps {
  href: string;
  text?: string;
}

export default function BackButton({ href, text }: BackButtonProps) {
  return (
    <div className="back-button-container">
      {text && <div className="back-button-text">{text}</div>}
      <Link href={href} className="back-button">
        <i className="fa fa-arrow-left"></i>
      </Link>
    </div>
  );
}