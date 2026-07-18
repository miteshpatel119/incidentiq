import { type ReactNode, Component } from 'react'

interface Props {
  readonly children: ReactNode
}

interface State {
  readonly error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error): void {
    console.error('UI error boundary caught:', error)
  }

  render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5">
          <p className="font-semibold text-destructive">
            Something went wrong rendering this view.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{this.state.error.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}
