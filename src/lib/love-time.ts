/** Love counter + calendar rules. All dates are in the visitor's local time zone. */

export function loveStartDate(): Date {
  // 27/07/2026 00:00 local time (month index 6 = July)
  return new Date(2026, 6, 27, 0, 0, 0, 0);
}

export type LoveDuration = {
  before: boolean; // true while the start moment is still in the future
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function loveDuration(now: Date, start: Date = loveStartDate()): LoveDuration {
  const diff = now.getTime() - start.getTime();
  const abs = Math.abs(diff);
  return {
    before: diff < 0,
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor((abs % 86_400_000) / 3_600_000),
    minutes: Math.floor((abs % 3_600_000) / 60_000),
    seconds: Math.floor((abs % 60_000) / 1000),
  };
}

export function formatLoveDuration(d: LoveDuration): string {
  return `${d.days} ngày ${d.hours} giờ ${d.minutes} phút ${d.seconds} giây`;
}

export const ANNIVERSARY_DAY = 27;
export const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];
export const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export type CalendarCell = { day: number | null; isToday: boolean; isAnniversary: boolean };

export function buildMonthGrid(today: Date) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Chủ nhật
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, isToday: false, isAnniversary: false });
  for (let day = 1; day <= totalDays; day++) {
    cells.push({ day, isToday: day === today.getDate(), isAnniversary: day === ANNIVERSARY_DAY });
  }
  return { year, month, label: `${MONTH_NAMES[month]} ${year}`, cells, totalDays };
}

/** Days until the next 27th (0 when today is the 27th). */
export function daysUntilNextAnniversary(today: Date): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let target = new Date(start.getFullYear(), start.getMonth(), ANNIVERSARY_DAY);
  if (target < start) target = new Date(start.getFullYear(), start.getMonth() + 1, ANNIVERSARY_DAY);
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

/** Milliseconds until just after the next local midnight. */
export function msUntilNextMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return Math.max(1000, next.getTime() - now.getTime());
}
