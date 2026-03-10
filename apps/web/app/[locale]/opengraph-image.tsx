import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'TypeWav — Musical Typing Trainer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 300,
            color: '#E8E8E8',
            letterSpacing: '0.05em',
          }}
        >
          TypeWav
        </div>
        <div style={{ fontSize: 28, color: '#00D4AA' }}>
          Every keystroke plays a note.
        </div>
        <div style={{ fontSize: 18, color: '#888888', marginTop: 8 }}>
          Free • Open Source • Musical Typing Trainer
        </div>
      </div>
    ),
    { ...size },
  );
}
