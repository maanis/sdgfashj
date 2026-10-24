import { Activity, ArrowRight, BarChart3, CheckCircle2, LineChart, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const KEY = "wfd-help-dismissed";

const STEPS = [
  [
    "Set your decision cutoff",
    "Choose the London-time cutoff on D-1 when you commit. Only forecasts published before it are used.",
  ],
  [
    "Review the day-ahead forecast",
    "On Day Forecast, compare the forecast with actuals and the indicative expected range.",
  ],
  [
    "Check historical accuracy",
    "On Accuracy, see how large and how directional errors were across January and by lead time.",
  ],
  [
    "Translate error into a buffer",
    "Use bias and the P90/P10 tails as indicative inputs when sizing procurement cover, alongside market and reserve constraints.",
  ],
] as const;

const GLOSSARY = [
  ["MAE", "Average absolute miss in MW."],
  ["RMSE", "Error measure that weights large misses more."],
  ["Bias", "Average of forecast − actual. Positive = over-forecast."],
  ["wMAPE", "Total absolute error ÷ total actual generation."],
  [
    "P10 / P90 error",
    "Signed percentiles of forecast − actual: the under- and over-forecast tails.",
  ],
  ["Lead time", "Hours between forecast publication and delivery."],
  ["Cutoff", "Decision time on D-1, Europe/London local time."],
] as const;

const WORKFLOW: readonly [string, string, LucideIcon][] = [
  ["1", "Publish", Activity],
  ["2", "Compare", LineChart],
  ["3", "Decide", BarChart3],
];

export function useHelpDialog() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) {
      try {
        localStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
    }
  };
  return { open, onOpenChange };
}

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] overflow-x-hidden overflow-y-auto p-4 dark:bg-neutral-900 sm:max-w-xl sm:p-6">
        <DialogHeader>
          <DialogTitle>How to use Wind Forecast Desk</DialogTitle>
          <DialogDescription>
            Evaluate day-ahead wind forecasts against measured generation. All values in MW.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border bg-muted/40 p-3 dark:bg-neutral-800">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Forecast workflow
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                From decision cutoff to procurement insight
              </p>
            </div>
            <Wind className="size-5 text-primary" aria-hidden />
          </div>
          <div className="grid min-w-0 grid-cols-1 items-center gap-1.5 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {WORKFLOW.map(([step, label, Icon], index) => (
              <div key={step} className="contents">
                <div className="flex min-w-0 flex-col items-center gap-1.5 rounded-md bg-card p-2 text-center dark:bg-neutral-900">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {step}
                  </span>
                  <Icon className="size-4 text-primary" aria-hidden />
                  <span className="text-[11px] font-medium text-foreground">{label}</span>
                </div>
                {index < 2 && (
                  <ArrowRight
                    className="mx-auto size-3.5 rotate-90 text-muted-foreground sm:rotate-0"
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-emerald-500" aria-hidden />
            <span className="min-w-0 break-words">
              Use the cutoff, error distribution, and lead-time view together.
            </span>
          </div>
        </div>
        <ol className="flex flex-col gap-3">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="tabular flex size-5 shrink-0 items-center justify-center rounded-sm border border-border text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{t}</p>
                <p className="text-xs text-muted-foreground">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="border-t border-border pt-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Glossary
          </h3>
          <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-xs">
            {GLOSSARY.map(([t, d]) => (
              <div key={t} className="contents">
                <dt className="font-medium text-foreground">{t}</dt>
                <dd className="text-muted-foreground">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
