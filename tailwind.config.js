/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      "colors": {
          "on-secondary-container": "#00447e",
          "surface-bright": "#f8f9ff",
          "surface-background": "#F8FAFC",
          "surface-container-lowest": "#ffffff",
          "inverse-primary": "#84d6b9",
          "tertiary-fixed-dim": "#ffb4a8",
          "surface-card": "#FFFFFF",
          "status-success": "#10B981",
          "surface-dim": "#cbdbf5",
          "primary-container": "#0f6e56",
          "on-tertiary": "#ffffff",
          "secondary": "#1960a6",
          "surface-container-low": "#eff4ff",
          "on-secondary": "#ffffff",
          "on-secondary-fixed-variant": "#004883",
          "on-primary-fixed": "#002117",
          "on-error-container": "#93000a",
          "surface-container-high": "#dce9ff",
          "status-warning": "#F59E0B",
          "error": "#ba1a1a",
          "outline": "#6f7a74",
          "tertiary": "#78352b",
          "inverse-surface": "#213145",
          "surface-container": "#e5eeff",
          "secondary-fixed": "#d4e3ff",
          "secondary-fixed-dim": "#a4c9ff",
          "on-surface-variant": "#3f4944",
          "on-tertiary-container": "#ffd3cc",
          "surface-variant": "#d3e4fe",
          "on-tertiary-fixed": "#3b0804",
          "on-error": "#ffffff",
          "on-primary-container": "#9aedcf",
          "on-secondary-fixed": "#001c39",
          "on-background": "#0b1c30",
          "primary-fixed-dim": "#84d6b9",
          "primary": "#005440",
          "primary-fixed": "#a0f3d4",
          "tertiary-container": "#954c41",
          "surface-tint": "#086b53",
          "surface": "#f8f9ff",
          "on-primary": "#ffffff",
          "outline-variant": "#bec9c3",
          "on-surface": "#0b1c30",
          "secondary-container": "#7ab3ff",
          "inverse-on-surface": "#eaf1ff",
          "error-container": "#ffdad6",
          "background": "#f8f9ff",
          "on-primary-fixed-variant": "#00513e",
          "status-error": "#EF4444",
          "tertiary-fixed": "#ffdad4",
          "surface-container-highest": "#d3e4fe",
          "on-tertiary-fixed-variant": "#743329"
      },
      "borderRadius": {
          "DEFAULT": "0.25rem",
          "lg": "0.5rem",
          "xl": "0.75rem",
          "full": "9999px"
      },
      "spacing": {
          "margin-desktop": "32px",
          "unit": "4px",
          "sidebar-width": "260px",
          "gutter": "24px",
          "margin-mobile": "16px"
      },
      "fontFamily": {
          "label-md": ["JetBrains Mono"],
          "headline-xl": ["Hanken Grotesk"],
          "body-md": ["Hanken Grotesk"],
          "body-lg": ["Hanken Grotesk"],
          "label-sm": ["JetBrains Mono"],
          "headline-lg": ["Hanken Grotesk"],
          "headline-md": ["Hanken Grotesk"],
          "body-sm": ["Hanken Grotesk"]
      },
      "fontSize": {
          "label-md": ["13px", {"lineHeight": "16px", "letterSpacing": "0.02em", "fontWeight": "500"}],
          "headline-xl": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
          "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
          "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
          "label-sm": ["11px", {"lineHeight": "14px", "fontWeight": "500"}],
          "headline-lg": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
          "headline-md": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
          "body-sm": ["12px", {"lineHeight": "16px", "fontWeight": "400"}]
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
