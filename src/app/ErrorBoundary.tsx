import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  /** When this changes, a caught error is cleared and the children render again (a new page or step). */
  resetKey: string;
  /** What to show instead of the children after a render error. */
  fallback(error: Error): ReactNode;
  children: ReactNode;
}

interface State { error: Error | null; key: string }

/** Catches a render error below it so one broken piece shows a message instead of blanking the app. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey === state.key ? null : { error: null, key: props.resetKey };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Tracepoint caught a render error", error, info.componentStack);
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}

/** The page-level fallback: the nav above it still works, and this offers two ways out. */
export function PageError() {
  return (
    <main className="page-error card" aria-labelledby="page-error-h">
      <h1 id="page-error-h">This page hit an error</h1>
      <p>Something on this page failed to draw. The rest of the site still works.</p>
      <p className="page-error-acts">
        <button className="btn primary" type="button" onClick={() => window.location.reload()}>Reload the page</button>
        <a className="btn" href="#/">Go to the start</a>
      </p>
    </main>
  );
}

/** The stage-level fallback: the step text, code and timeline keep working around it. */
export function SceneError() {
  return (
    <div className="scene-error" role="img" aria-label="The diagram for this step could not be drawn">
      <p>The diagram for this step could not be drawn.</p>
      <p className="muted">The explanation and code still follow each step.</p>
    </div>
  );
}
