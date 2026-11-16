import { cn } from "@/lib/utils";
import type { SyncState } from "@/hooks/use-photo-library";

const STYLES: Record<SyncState["kind"], string> = {
  loading: "border-glass-border bg-glass text-muted-foreground",
  local: "border-warning/30 bg-warning/15 text-warning",
  syncing: "border-sky/30 bg-sky/15 text-sky",
  synced: "border-primary/30 bg-primary/15 text-primary-glow",
  offline: "border-warning/30 bg-warning/15 text-warning",
  error: "border-destructive/40 bg-destructive/15 text-destructive",
};

export function syncLabel(sync: SyncState): string {
  switch (sync.kind) {
    case "loading":
      return "▣ Đang mở kho ảnh…";
    case "local":
      return "▣ Chỉ lưu trên thiết bị này · chưa sao lưu đám mây";
    case "syncing":
      return `⟳ ${sync.detail ?? "Đang đồng bộ…"}`;
    case "synced":
      return "☁ Đã sao lưu đám mây";
    case "offline":
      return "⚠ Mất kết nối — chưa thể đồng bộ";
    case "error":
      return `⚠ Lỗi đồng bộ: ${sync.message}`;
  }
}

export function SyncBadge({ sync, onClick }: { sync: SyncState; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="status"
      aria-live="polite"
      title="Xem trạng thái sao lưu"
      className={cn(
        "mt-0.5 inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-85",
        STYLES[sync.kind],
      )}
    >
      <span className="truncate">{syncLabel(sync)}</span>
    </button>
  );
}
