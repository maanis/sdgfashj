import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import { AppShell } from "@/components/app-shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { AccuracyPage } from "@/pages/accuracy";
import { Dashboard } from "@/pages/dashboard";
import { ForecastPage } from "@/pages/forecast";

/** "/" redirects to /dashboard and keeps the query string (?date=&cutoff=). */
function RedirectToDashboard() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: "/dashboard", search }} replace />;
}

function RedirectUnknownRoute() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: "/", search }} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Layout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<RedirectToDashboard />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/accuracy" element={<AccuracyPage />} />
          <Route path="*" element={<RedirectUnknownRoute />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
