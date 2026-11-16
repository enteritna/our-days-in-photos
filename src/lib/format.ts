export function fmtBytes(value: number): string {
  let n = Number(value) || 0;
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toLocaleString("vi-VN", { maximumFractionDigits: i < 2 ? 0 : 1 })} ${units[i]}`;
}

export function dayKey(ms: number): string {
  return new Date(ms).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function stripName(name: string): string {
  return String(name || "Ảnh").replace(/\.[^.]+$/, "");
}

export type DayGroup<T> = { key: string; label: string; items: { item: T; index: number }[] };

/** Groups items (already sorted newest first) into per-day shelves. */
export function groupByDay<T extends { createdAt: number }>(sorted: T[], now: number): DayGroup<T>[] {
  const today = dayKey(now);
  const yesterday = dayKey(now - 86_400_000);
  const groups: DayGroup<T>[] = [];
  sorted.forEach((item, index) => {
    const key = dayKey(item.createdAt);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      const label = key === today ? "Hôm nay" : key === yesterday ? "Hôm qua" : key;
      group = { key, label, items: [] };
      groups.push(group);
    }
    group.items.push({ item, index });
  });
  return groups;
}

export function sortNewestFirst<T extends { createdAt: number }>(items: T[]): T[] {
  return items.slice().sort((a, b) => b.createdAt - a.createdAt);
}
