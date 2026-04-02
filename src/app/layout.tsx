import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Crypto Higher Lower 📊",
  description: "Which crypto has a higher market cap? Test your knowledge!",
  openGraph: { title: "Crypto Higher Lower 📊", description: "Which crypto has a higher market cap?" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
