import "./globals.css"
import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "NJDrive50 | New Jersey 50-Hour Driving Log App",
  description: "Track NJ supervised driving hours and milestones with NJDrive50.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#020617] text-white">{children}</body>
    </html>
  )
}
