import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { cn } from "@/lib/utils";

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Email hoặc mật khẩu chưa đúng.";
  if (/email not confirmed/i.test(message)) return "Email chưa được xác nhận — hãy mở thư xác nhận trong hộp thư.";
  if (/already registered|already exists/i.test(message)) return "Email này đã có tài khoản, hãy đăng nhập.";
  if (/password should be at least|weak password/i.test(message)) return "Mật khẩu cần ít nhất 6 ký tự và khó đoán hơn.";
  if (/pwned|leaked|compromised/i.test(message)) return "Mật khẩu này từng bị lộ trên mạng, hãy chọn mật khẩu khác.";
  if (/rate limit/i.test(message)) return "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.";
  if (/failed to fetch|network/i.test(message)) return "Mất kết nối mạng, hãy thử lại.";
  return message;
}

const GOOGLE_G = (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
  </svg>
);

export function AuthPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | "email" | "google" | "lovable" | "reset">(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim() || password.length < 6) {
      setError("Nhập email và mật khẩu (ít nhất 6 ký tự).");
      return;
    }
    setLoading("email");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setNotice("Đã tạo tài khoản! Hãy mở email xác nhận, rồi quay lại đăng nhập để bật sao lưu đám mây.");
      }
    } catch (err) {
      setError(friendly(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(null);
    }
  };

  const forgot = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Nhập email của bạn trước, rồi bấm Quên mật khẩu.");
      return;
    }
    setLoading("reset");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(null);
    if (error) setError(friendly(error.message));
    else setNotice("Đã gửi email đặt lại mật khẩu. Hãy kiểm tra hộp thư (cả mục spam).");
  };

  const social = async (provider: "google" | "lovable") => {
    setError(null);
    setLoading(provider);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) {
      setError(friendly(result.error.message));
      setLoading(null);
      return;
    }
    if (!result.redirected) setLoading(null);
  };

  return (
    <div className="grid gap-3">
      <div role="tablist" aria-label="Chọn cách vào" className="grid grid-cols-2 rounded-full bg-glass p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
              setNotice(null);
            }}
            className={cn(
              "rounded-full py-1.5 text-xs font-semibold transition-colors",
              mode === m ? "bg-glass-strong text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="grid gap-2.5" noValidate>
        <div className="grid gap-1">
          <Label htmlFor="auth-email">Email</Label>
          <Input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="auth-password">Mật khẩu tài khoản</Label>
          <Input
            id="auth-password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-xs text-primary-glow">
            {notice}
          </p>
        )}
        <Button type="submit" variant="sun" size="pill" disabled={loading !== null}>
          {loading === "email" && <Loader2 className="animate-spin" />}
          {mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
        </Button>
        {mode === "signin" && (
          <button type="button" onClick={forgot} disabled={loading !== null} className="justify-self-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            {loading === "reset" ? "Đang gửi…" : "Quên mật khẩu?"}
          </button>
        )}
      </form>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> hoặc <span className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        onClick={() => social("google")}
        disabled={loading !== null}
        className="inline-flex h-10 items-center justify-center gap-2.5 rounded-full border border-google-border bg-google-surface px-3 text-sm font-medium text-google-text disabled:opacity-60"
      >
        {loading === "google" ? <Loader2 className="size-4 animate-spin" /> : GOOGLE_G}
        Continue with Google
      </button>
      <button type="button" className="lovable-auth-button" onClick={() => social("lovable")} disabled={loading !== null}>
        Continue with Lovable
      </button>
    </div>
  );
}
