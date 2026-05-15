import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";

type Props = {
  children: ReactNode;
  label?: string;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? ` — ${this.props.label}` : ""}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="font-semibold text-rose-800">
            Algo deu errado{this.props.label ? ` em "${this.props.label}"` : ""}.
          </p>
          {this.state.error?.message && (
            <p className="mt-1 text-sm text-rose-600">{this.state.error.message}</p>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
