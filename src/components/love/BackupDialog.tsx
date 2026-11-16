import { useRef } from "react";
import { CloudUpload, FileDown, FileUp, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import type { PhotoLibrary } from "@/hooks/use-photo-library";
import { supabase } from "@/integrations/supabase/client";
import { AuthPanel } from "./AuthPanel";
import { syncLabel } from "./SyncBadge";

export function BackupDialog({ open, onOpenChange, library }: { open: boolean; onOpenChange: (o: boolean) => void; library: PhotoLibrary }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = library.busy !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl border-glass-border bg-popover sm:max-w-md">
        <DialogHeader>
          <DialogTitle>☁ Sao lưu & đồng bộ</DialogTitle>
          <DialogDescription>{syncLabel(library.sync)}</DialogDescription>
        </DialogHeader>

        {library.busy && (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-sky/10 px-3 py-2 text-xs text-sky">
            <Loader2 className="size-3.5 animate-spin" /> {library.busy}
          </p>
        )}

        <section className="grid gap-3 rounded-2xl border border-glass-border bg-glass p-4" aria-label="Tài khoản sao lưu đám mây">
          {user ? (
            <>
              <div className="text-sm">
                Đã đăng nhập: <b className="break-all">{user.email}</b>
              </div>
              <p className="text-xs text-muted-foreground">
                Ảnh tải lên sẽ được lưu trên đám mây, chỉ tài khoản này xem được, và mở được trên mọi thiết bị khi đăng nhập.
              </p>
              {library.pendingLocal > 0 && (
                <div className="grid gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs">
                  <span className="text-warning">
                    Có {library.pendingLocal} ảnh chỉ đang lưu trên thiết bị này, chưa có trên đám mây.
                  </span>
                  <Button variant="sun" size="sm" className="rounded-full" disabled={busy} onClick={() => library.syncLocalToCloud()}>
                    <CloudUpload /> Sao lưu {library.pendingLocal} ảnh lên đám mây
                  </Button>
                </div>
              )}
              <Button
                variant="glass"
                size="sm"
                disabled={busy}
                onClick={async () => {
                  const { error } = await supabase.auth.signOut();
                  if (error) toast.error("Đăng xuất chưa thành công, thử lại nhé.");
                  else toast.success("Đã đăng xuất. Ảnh trên đám mây vẫn an toàn.");
                }}
              >
                <LogOut /> Đăng xuất
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs text-warning">
                Bạn chưa đăng nhập: ảnh hiện chỉ lưu trên trình duyệt của thiết bị này và chưa được sao lưu đám mây.
              </p>
              <AuthPanel />
            </>
          )}
        </section>

        <section className="grid gap-2 rounded-2xl border border-glass-border bg-glass p-4" aria-label="Sao lưu ra file">
          <h3 className="text-sm font-semibold">Sao lưu ra file</h3>
          <p className="text-xs text-muted-foreground">
            File .json chứa toàn bộ ảnh và ngày chụp. Hãy cất giữ cẩn thận; có thể khôi phục vào kho bất cứ lúc nào (ảnh trùng sẽ được bỏ qua).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="glass" size="sm" disabled={busy} onClick={() => library.exportBackup()}>
              <FileDown /> Xuất file sao lưu
            </Button>
            <Button variant="glass" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
              <FileUp /> Khôi phục từ file
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void library.restoreBackup(f);
            }}
          />
        </section>
      </DialogContent>
    </Dialog>
  );
}
