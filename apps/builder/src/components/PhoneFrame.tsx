'use client';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div style={{
      width: '280px', height: '500px',
      border: '3px solid var(--brand)', borderRadius: '24px',
      background: '#000', padding: '8px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Notch */}
      <div style={{
        position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)',
        width: '100px', height: '20px', background: '#000', borderRadius: '0 0 12px 12px', zIndex: 10,
      }} />
      {/* Screen */}
      <div style={{
        width: '100%', height: '100%', borderRadius: '18px',
        background: 'var(--bg)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  );
}
