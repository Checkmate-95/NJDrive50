import React from "react"

type AppLayoutProps = {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-dvh w-full bg-[#08194A] flex flex-col overflow-hidden">
      {children}
    </div>
  )
}