import { Nunito } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-nunito',
    weight: ['400', '600', '700', '800'],
})

export const metadata = {
    title: 'BrightBuddy AI',
    description: 'Your friendly story companion',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={nunito.variable}>
            <body>{children}</body>
        </html>
    )
}
