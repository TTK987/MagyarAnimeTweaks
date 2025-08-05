const { heroui } = require('@heroui/theme')
const config = {
    darkMode: ['class'],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,html}',
        './src/components/**/*.{js,ts,jsx,tsx,html}',
        './src/**/*.{js,ts,jsx,tsx,html}',
        '*.{js,ts,jsx,tsx}',
    ],
    prefix: '',
    theme: {
        extend: {
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
        },
    },
    plugins: [heroui()],
}

export default config
