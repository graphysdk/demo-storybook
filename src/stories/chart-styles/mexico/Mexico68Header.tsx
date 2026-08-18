import { MEXICO_COLORS, MEXICO_FONT_FAMILY } from './mexico68.theme';

export const MexicoHeader = () => (
  <header style={{ textAlign: 'center', marginBottom: 48 }}>
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
      {[MEXICO_COLORS.pink, MEXICO_COLORS.orange, MEXICO_COLORS.purple, MEXICO_COLORS.cyan, MEXICO_COLORS.green].map(
        (color) => (
          <span key={color} style={{ width: 28, height: 6, borderRadius: 3, background: color }} />
        )
      )}
    </div>
    <h1
      style={{
        fontFamily: MEXICO_FONT_FAMILY.headings,
        fontWeight: 400,
        fontSize: 52,
        color: MEXICO_COLORS.ink,
        margin: 0,
        letterSpacing: '0.04em',
      }}
    >
      MEXICO 68
    </h1>
    <p style={{ color: MEXICO_COLORS.axisGrey, fontSize: 16, margin: '16px 0 0' }}>
      a Graphy chart theme · op-art palette · the whole grammar is the echo
    </p>
  </header>
);
