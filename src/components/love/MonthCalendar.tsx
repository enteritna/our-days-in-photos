import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { buildMonthGrid, daysUntilNextAnniversary, msUntilNextMidnight, WEEKDAY_LABELS } from "@/lib/love-time";

/** Today's date, refreshed at local midnight and whenever the tab becomes visible again. */
function useToday() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setToday(new Date());
        schedule();
      }, msUntilNextMidnight(new Date()));
    };
    schedule();
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      setToday((prev) => (prev.toDateString() === new Date().toDateString() ? prev : new Date()));
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return today;
}

export function MonthCalendar() {
  const today = useToday();
  const grid = buildMonthGrid(today);
  const until = daysUntilNextAnniversary(today);
  return (
    <section aria-label={`Lịch ${grid.label}`} className="rounded-[14px] border border-glass-border bg-glass p-3.5">
      <div className="mb-2.5 flex items-center justify-between text-[13px] font-bold">
        <span>📅 {grid.label}</span>
        <span className="text-[11px] font-semibold text-love">Kỷ niệm ngày 27 ❤️</span>
      </div>
      <div role="grid" className="grid grid-cols-7 gap-1 text-center text-[11px]">
        <div role="row" className="contents">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} role="columnheader" className="pb-1 font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div role="row" className="contents">
          {grid.cells.map((c, i) =>
            c.day === null ? (
              <div key={`b${i}`} role="gridcell" aria-hidden="true" />
            ) : (
              <div
                key={c.day}
                role="gridcell"
                aria-current={c.isToday ? "date" : undefined}
                aria-label={`${c.day}${c.isToday ? ", hôm nay" : ""}${c.isAnniversary ? ", ngày kỷ niệm" : ""}`}
                className={cn(
                  "relative rounded-md py-1.5",
                  c.isToday ? "border border-sky/40 bg-sky/20 font-bold text-sky" : "bg-day-cell text-day-foreground",
                  c.isAnniversary && !c.isToday && "text-love",
                )}
              >
                {c.day}
                {c.isAnniversary && (
                  <span aria-hidden="true" className="absolute bottom-px right-0.5 text-[8px]">
                    ❤️
                  </span>
                )}
              </div>
            ),
          )}
        </div>
      </div>
      <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
        {until === 0 ? "Hôm nay là ngày kỷ niệm của tụi mình 💞" : `Còn ${until} ngày nữa đến ngày 27 💗`}
      </p>
    </section>
  );
}
