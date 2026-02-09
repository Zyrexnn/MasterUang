/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bloomberg: {
                    amber: '#FFB74D',
                    dark: '#0F1117',
                    black: '#000000',
                    gray: '#1A1D23',
                    border: '#2A2E37',
                },
                zen: {
                    calm: '#E0F2F1',
                    green: '#81C784',
                    red: '#E57373',
                    blue: '#64B5F6',
                },
                text: {
                    primary: '#F5F5F5',
                    secondary: '#B0B0B0',
                }
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'amber-glow': '0 0 15px -3px rgba(255, 183, 77, 0.3)',
                '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.5)',
            },
            screens: {
                'xs': '475px',
            },
        },
    },
    plugins: [
        require('daisyui'),
        require('@tailwindcss/forms'),
    ],
    daisyui: {
        themes: [
            {
                bloomberg: {
                    "primary": "#FFB74D",
                    "secondary": "#64B5F6",
                    "accent": "#FFB74D",
                    "neutral": "#1A1D23",
                    "base-100": "#0F1117",
                    "info": "#64B5F6",
                    "success": "#81C784",
                    "warning": "#FFB74D",
                    "error": "#E57373",
                },
            },
            "dark",
        ],
    },
}
