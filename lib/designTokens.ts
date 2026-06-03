export const designTokens = {
  color: {
    primary: "#ff2b2b",
    primaryDeep: "#e9162d",
    primarySoft: "#fff1f1",
    coral: "#ff6a4a",
    orange: "#ff8a1f",
    gold: "#f7c948",
    amber: "#f59e0b",
    navy: "#121b35",
    navySoft: "#eaf0ff",
    ink: "#111827",
    steel: "#334155",
    muted: "#64748b",
    canvas: "#fbfaf7",
    warm: "#f6f1e8",
    surface: "#fffdf8",
    elevated: "#ffffff",
    line: "#e8e2d9",
    success: "#059669",
    successSoft: "#ecfdf5",
    warning: "#d97706",
    warningSoft: "#fff7ed"
  },
  spacing: {
    pageX: "0.75rem",
    sectionGap: "0.625rem",
    cardPadding: "0.625rem",
    touchTarget: "2.75rem",
    mobileCardGap: "0.625rem"
  },
  radius: {
    chip: "999px",
    control: "0.875rem",
    card: "1rem",
    cardLarge: "1.25rem",
    panel: "1.5rem"
  },
  shadow: {
    card: "0 10px 26px rgba(18, 27, 53, 0.07)",
    commerce: "0 18px 45px rgba(18, 27, 53, 0.09)",
    lift: "0 8px 22px rgba(18, 27, 53, 0.07)",
    focus: "0 0 0 4px rgba(255, 106, 74, 0.16)"
  },
  typography: {
    productTitle: "font-black leading-snug tracking-normal",
    meta: "text-[11px] font-black tracking-normal",
    price: "font-black tracking-normal"
  }
} as const;

export const commerceGradient = "bg-gradient-to-r from-brand-primary via-brand-coral to-brand-orange";
export const premiumGradient = "bg-gradient-to-r from-brand-navy via-brand-primaryDeep to-brand-coral";
export const commerceSurface = "border border-brand-line bg-brand-surface shadow-commerce";
