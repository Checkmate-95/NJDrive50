import { Component, createRef, type ErrorInfo, type ReactNode } from "react"

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReloadApp?: () => void
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private headingRef = createRef<HTMLHeadingElement>()
  private tryAgainButtonRef = createRef<HTMLButtonElement>()

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error)
    console.error("Component stack:", errorInfo.componentStack)
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(
    _prevProps: Readonly<ErrorBoundaryProps>,
    prevState: Readonly<ErrorBoundaryState>
  ) {
    if (!prevState.hasError && this.state.hasError) {
      window.requestAnimationFrame(() => {
        if (this.tryAgainButtonRef.current) {
          this.tryAgainButtonRef.current.focus()
        } else {
          this.headingRef.current?.focus()
        }
      })
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  reloadApp = () => {
    this.reset()

    if (this.props.onReloadApp) {
      this.props.onReloadApp()
      return
    }

    window.location.reload()
  }

  copyErrorDetails = async () => {
    const text = this.state.error?.stack ?? this.state.error?.message ?? ""
    if (!text) return

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return
      }

      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.setAttribute("readonly", "")
      textarea.setAttribute("aria-hidden", "true")
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      textarea.style.pointerEvents = "none"
      textarea.style.inset = "0"
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand("copy")
      textarea.remove()
    } catch (err) {
      console.error("Failed to copy error details:", err)
    }
  }

  render() {
    const { hasError, error } = this.state

    if (!hasError) return this.props.children

    if (this.props.fallback) return this.props.fallback

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex min-h-[50vh] items-center justify-center px-6 py-12 text-center text-white"
      >
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
            Screen Error
          </p>

          <h2
            ref={this.headingRef}
            tabIndex={-1}
            className="mt-2 text-2xl font-bold text-white outline-none"
          >
            Something went wrong on this screen.
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Try again to reload this section. If the problem continues, reload the app.
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
                className="mt-2 text-xs font-semibold text-white/70 underline underline-offset-4 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Copy error details
              </button>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              ref={this.tryAgainButtonRef}
              type="button"
              onClick={this.reset}
              className="w-full rounded-xl bg-[#f9c80e] px-4 py-3 font-semibold text-[#08194A] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9c80e] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={this.reloadApp}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Reload App
            </button>
          </div>
        </div>
      </div>
    )
  }
}