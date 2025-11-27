'use client';

interface SpiderManLoaderProps {
  size?: 'small' | 'medium' | 'large';
}

export default function SpiderManLoader({ size = 'medium' }: SpiderManLoaderProps) {
  const getScale = () => {
    switch (size) {
      case 'small': return '0.5';
      case 'medium': return '1';
      case 'large': return '1.5';
      default: return '1';
    }
  };

  return (
    <div className="spiderman-loader-wrapper" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{ transform: `scale(${getScale()})` }}>
        <div className="container-spiderman center">
          <div className="rope center">
            <div className="legs center">
              <div className="boot-l"></div>
              <div className="boot-r"></div>
            </div>
            <div className="costume center">
              <div className="spider">
                <div className="s1 center"></div>
                <div className="s2 center"></div>
                <div className="s3"></div>
                <div className="s4"></div>
              </div>
              <div className="belt center"></div>
              <div className="hand-r"></div>
              <div className="hand-l"></div>
              <div className="neck center"></div>
              <div className="mask center">
                <div className="eye-l"></div>
                <div className="eye-r"></div>
              </div>
              <div className="cover center"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}