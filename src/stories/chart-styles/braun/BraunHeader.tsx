import { BRAUN_COLORS, BRAUN_FONT_FAMILY } from './braun.theme';

export const BraunHeader = () => (
  <header style={{ textAlign: 'center', marginBottom: 48 }}>
    <div style={{ width: 40, height: 8, borderRadius: 4, background: BRAUN_COLORS.indicator, margin: '0 auto 28px' }} />
    <h1
      style={{ fontFamily: BRAUN_FONT_FAMILY.body, fontWeight: 700, fontSize: 48, color: BRAUN_COLORS.ink, margin: 0 }}
    >
      Braun
    </h1>
    <p style={{ color: BRAUN_COLORS.labelMuted, fontSize: 16, margin: '16px 0 0' }}>
      a Graphy chart theme · warm greys, ink, and one orange reading · engine config only
    </p>
  </header>
);
