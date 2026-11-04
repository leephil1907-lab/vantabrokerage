import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export async function GET() {
  const bars = [34, 48, 42, 66, 57, 78, 69, 92, 84, 110, 98, 126, 118, 148, 137, 166, 154, 190, 176, 214];
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(115deg, #050b14 0%, #071827 58%, #03121d 100%)',
          color: '#f7fafc',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ position: 'absolute', right: '-95px', top: '-175px', width: '650px', height: '650px', borderRadius: '50%', border: '1px solid rgba(42, 226, 207, .28)', boxShadow: '0 0 80px rgba(0, 215, 190, .12), inset 0 0 90px rgba(0, 215, 190, .10)', display: 'flex' }} />
        <div style={{ position: 'absolute', right: '30px', top: '65px', width: '460px', height: '460px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(11, 176, 164, .20), rgba(5, 20, 34, 0) 70%)', display: 'flex' }} />
        <div style={{ position: 'absolute', left: '0', right: '0', bottom: '0', height: '210px', display: 'flex', alignItems: 'flex-end', gap: '13px', padding: '0 28px', opacity: .75 }}>
          {bars.map((height, index) => (
            <div key={index} style={{ width: '35px', height: height + 'px', background: index % 3 === 0 ? '#b5ed25' : '#12c9bb', opacity: .82, borderTop: '2px solid #d9ff69' }} />
          ))}
        </div>
        <div style={{ position: 'absolute', left: '0', right: '0', bottom: '0', height: '8px', background: 'linear-gradient(90deg, #b5ed25, #11c8b8, transparent)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', padding: '105px 70px', width: '820px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '18px', background: 'linear-gradient(145deg, #d6f269, #8fc51b)', color: '#07111b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: 900 }}>P</div>
            <div style={{ display: 'flex', fontSize: '58px', fontWeight: 800, letterSpacing: '2px' }}>
              <span>PRIME</span><span style={{ color: '#b5ed25' }}>VEST</span>
            </div>
          </div>
          <div style={{ display: 'flex', marginTop: '56px', fontSize: '58px', lineHeight: 1.08, fontWeight: 700, letterSpacing: '-2px', maxWidth: '760px' }}>
            Precision, <span style={{ color: '#b5ed25', marginLeft: '14px' }}>in every fill.</span>
          </div>
          <div style={{ width: '560px', height: '5px', marginTop: '28px', background: 'linear-gradient(90deg, #b5ed25, #10c7b9, transparent)' }} />
          <div style={{ display: 'flex', marginTop: '26px', fontSize: '27px', color: '#e4edf2', letterSpacing: '1px' }}>
            Forex <span style={{ color: '#b5ed25', margin: '0 18px' }}>•</span> Crypto <span style={{ color: '#b5ed25', margin: '0 18px' }}>•</span> Global Markets
          </div>
          <div style={{ display: 'flex', marginTop: '42px', fontSize: '16px', letterSpacing: '4px', color: '#8ca6b2' }}>MULTI-ASSET BROKERAGE PLATFORM</div>
        </div>
        <div style={{ position: 'absolute', right: '58px', bottom: '36px', fontSize: '17px', color: 'rgba(225,245,245,.72)', letterSpacing: '2px' }}>PRIMEVEST</div>
      </div>
    ),
    { ...size }
  );
}
