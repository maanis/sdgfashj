import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <p className="tabular text-xs font-semibold text-primary">404</p>
        <h1 className="mt-1 text-lg font-semibold text-foreground">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">This view doesn't exist on the desk.</p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex h-8 items-center rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
