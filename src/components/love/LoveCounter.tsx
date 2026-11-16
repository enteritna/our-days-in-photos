import { useEffect, useState } from "react";
import { formatLoveDuration, loveDuration } from "@/lib/love-time";

export function LoveCounter() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const d = loveDuration(now);
  const units = [
    { v: d.days, l: "ngày" },
    { v: d.hours, l: "giờ" },
    { v: d.minutes, l: "phút" },
    { v: d.seconds, l: "giây" },
  ];
  return (
    <section
      aria-label="Thời gian bên nhau"
      className="relative animate-border-pulse rounded-[14px] border-2 border-love bg-glass px-3 py-4 text-center"
    >
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
        {d.before ? "❤️ Còn lại đến ngày 27/07/2026 ❤️" : "❤️ Thời gian bên nhau ❤️"}
      </h3>
      <div role="timer" aria-live="off" className="grid grid-cols-4 gap-2">
        {units.map((u) => (
          <div key={u.l} className="rounded-lg bg-glass py-1.5">
            <div className="text-xl font-bold tabular-nums text-love">{u.v}</div>
            <div className="text-[10px] font-medium text-muted-foreground">{u.l}</div>
          </div>
        ))}
      </div>
      <span className="sr-only">{formatLoveDuration(d)}</span>
      <p className="mt-2 text-[10px] text-muted-foreground">Tính từ 00:00 ngày 27/07/2026 (giờ địa phương)</p>
    </section>
  );
}
