import { useQueryClient } from "@tanstack/react-query";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { reportLovableError } from "@/lib/lovable-error-reporting";

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const queryClient = useQueryClient();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              queryClient.invalidateQueries();
              onRetry();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

type BoundaryProps = { children: ReactNode; resetKey: string };
type BoundaryState = { error: unknown; hasError: boolean };

class Boundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { error: undefined, hasError: false };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error, hasError: true };
  }

  override componentDidCatch(error: unknown, _info: ErrorInfo) {
    console.error(error);
    reportLovableError(error, { boundary: "root_error_boundary" });
  }

  override componentDidUpdate(prev: BoundaryProps) {
    // Leaving the broken page (route change) clears the error.
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: undefined, hasError: false });
    }
  }

  override render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ error: undefined, hasError: false })} />;
    }
    return this.props.children;
  }
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <Boundary resetKey={pathname}>{children}</Boundary>;
}
