import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: "#050505",
                    secondary: "#0a0a0a",
                    elevated: "#111111",
                    card: "#161616",
                },
                text: {
                    primary: "#f5f5f5",
                    secondary: "#a0a0a0",
                    muted: "#666666",
                },
                accent: {
                    coral: "#ff6b4a",
                    pink: "#ff4d8d",
                    purple: "#a855f7",
                    blue: "#3b82f6",
                    teal: "#14b8a6",
                    lime: "#84cc16",
                },
                border: {
                    subtle: "rgba(255, 255, 255, 0.06)",
                    hover: "rgba(255, 255, 255, 0.12)",
                },
            },
            fontFamily: {
                sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
                display: ["Inter", "sans-serif"],
            },
            fontSize: {
                "display-xl": ["clamp(4rem, 10vw, 10rem)", { lineHeight: "0.9", letterSpacing: "-0.04em", fontWeight: "800" }],
                "display-lg": ["clamp(3rem, 8vw, 7rem)", { lineHeight: "0.95", letterSpacing: "-0.03em", fontWeight: "800" }],
                "display-md": ["clamp(2rem, 5vw, 4.5rem)", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "700" }],
                "display-sm": ["clamp(1.5rem, 3vw, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.01em", fontWeight: "600" }],
            },
            animation: {
                "fade-in-up": "fadeInUp 0.8s ease-out forwards",
                "scale-in": "scaleIn 0.6s ease-out forwards",
                "float": "float 6s ease-in-out infinite",
                "pulse-glow": "pulse-glow 4s ease-in-out infinite",
                "spin-slow": "spin-slow 30s linear infinite",
                "gradient-shift": "gradientShift 8s ease infinite",
            },
            keyframes: {
                fadeInUp: {
                    "0%": { opacity: "0", transform: "translateY(40px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                scaleIn: {
                    "0%": { opacity: "0", transform: "scale(0.9)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                "pulse-glow": {
                    "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
                    "50%": { opacity: "0.8", transform: "scale(1.05)" },
                },
                "spin-slow": {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(360deg)" },
                },
                gradientShift: {
                    "0%, 100%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                },
            },
            borderRadius: {
                "2xl": "16px",
                "3xl": "24px",
            },
            backgroundImage: {
                "gradient-primary": "linear-gradient(135deg, #ff6b4a, #ff4d8d, #a855f7)",
                "gradient-hero": "linear-gradient(135deg, #ff6b4a 0%, #ff4d8d 50%, #a855f7 100%)",
                "gradient-glow": "radial-gradient(circle, rgba(255, 107, 74, 0.15) 0%, transparent 70%)",
            },
        },
    },
    plugins: [],
};
export default config;
