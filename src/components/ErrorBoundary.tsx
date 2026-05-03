// src/components/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from "react"

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  // Normalize thrown values (string, object, etc.)
  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error)
    console.error("Component stack:", errorInfo.componentStack)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  copyErrorDetails = async () => {
    const text = this.state.error?.stack ?? this.state.error?.message ?? ""
    if (!text) return

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return
      }

      // Fallback for insecure contexts
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.setAttribute("readonly", "")
      textarea.style.position = "fixed"
      textarea.style.left = "-9999px"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    } catch (err) {
      console.error("Failed to copy error details:", err)
    }
  }

  render() {
    const { hasError, error } = this.state

    if (!hasError) return this.props.children

    // Custom fallback provided by parent
    if (this.props.fallback) return this.props.fallback

    return (
      <div
        role="alert"
        className="flex min-h-[50vh] items-center justify-center px-6 py-12 text-center text-white"
      >
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
            Screen Error
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Something went wrong on this screen.
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Try reloading this view. If the problem continues, go back home and try again.
          </p>

          {import.meta.env.DEV && error && (
            <div className="mt-4 rounded-2xl bg-black/20 p-3 text-left">
              <p className="text-xs font-semibold text-white/60">Developer details</p>

              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-red-100">
                {error.stack ?? error.message}
              </pre>

              <button
                type="button"
                onClick={this.copyErrorDetails}
                className="mt-2 text-xs font-semibold text-white/70 underline underline-offset-4 hover:text-white"
              >
                Copy error details
              </button>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={this.reset}
              className="w-full rounded-xl bg-[#f9c80e] px-4 py-3 font-semibold text-[#08194A] transition hover:brightness-95"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={() => {
                this.reset()
                window.location.hash = ""
                window.history.replaceState({}, "", "/")
                window.location.reload()
              }}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/15"
            >
              Reload App
            </button>
          </div>
        </div>
      </div>
    )
  }
}
