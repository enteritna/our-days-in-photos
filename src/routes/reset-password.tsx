import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Đặt lại mật khẩu — My Love" },
      { name: "description", content: "Đặt mật khẩu mới cho tài khoản sao lưu đám mây My Love." },
      { property: "og:title", content: "Đặt lại mật khẩu — My Love" },
      { property: "og:description", content: "Đặt mật khẩu mới cho tài khoản sao lưu My Love." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setReady(true);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }
    setStatus("saving");
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setStatus("idle");
    } else setStatus("done");
  };

  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="glass w-full max-w-sm rounded-3xl p-6">
        <h1 className="mb-1 text-lg font-bold">Đặt lại mật khẩu</h1>
        {status === "done" ? (
          <>
            <p className="mb-4 text-sm text-primary-glow">Đã đổi mật khẩu thành công.</p>
            <Button asChild variant="sun" size="pill">
              <Link to="/">Về My Love</Link>
            </Button>
          </>
        ) : !ready ? (
          <p className="text-sm text-muted-foreground">
            Hãy mở trang này từ đường link trong email đặt lại mật khẩu. <Link to="/" className="underline">Về trang chính</Link>
          </p>
        ) : (
          <form onSubmit={submit} className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" variant="sun" size="pill" disabled={status === "saving"}>
              {status === "saving" && <Loader2 className="animate-spin" />} Lưu mật khẩu mới
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
