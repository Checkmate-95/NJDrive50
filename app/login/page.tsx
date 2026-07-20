import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Log In | NJDrive50",
  description: "Log in to your NJDrive50 account to track your New Jersey supervised driving hours.",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-white">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-extrabold">Log in to NJDrive50</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">
          Please log in using the NJDrive50 mobile app. Web login is not yet available.
        </p>
      </div>
    </div>
  )
}
