export const designTokens = {
  color: {
    primary: "#ff173f",
    coral: "#ff6a3d",
    orange: "#ff8a1f",
    gold: "#f6c343",
    amber: "#f59e0b",
    navy: "#172554",
    ink: "#111827",
    steel: "#334155",
    canvas: "#fbfaf7",
    warm: "#f5f1ea",
    surface: "#fffdf8",
    line: "#e8e2d9",
    success: "#059669",
    warning: "#d97706"
  },
  spacing: {
    pageX: "0.75rem",
    sectionGap: "0.75rem",
    cardPadding: "0.75rem",
    touchTarget: "2.75rem"
  },
  radius: {
    chip: "999px",
    control: "0.875rem",
    card: "1.25rem",
    panel: "1.5rem"
  },
  shadow: {
    card: "0 14px 34px rgba(15, 23, 42, 0.08)",
    commerce: "0 18px 45px rgba(17, 24, 39, 0.08)",
    lift: "0 10px 28px rgba(17, 24, 39, 0.07)"
  },
  typography: {
    productTitle: "font-black leading-snug tracking-normal",
    meta: "text-[11px] font-black tracking-normal",
    price: "font-black tracking-normal"
  }
} as const;

export const commerceGradient = "bg-gradient-to-r from-brand-primary via-brand-coral to-brand-orange";
export const commerceSurface = "border border-brand-line bg-brand-surface shadow-commerce";
