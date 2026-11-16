import { useId, useState, type FormEvent } from "react";
import { Eye, EyeOff, Heart, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isCorrectPassword, shouldShowPasswordError } from "@/lib/lock";
import loveBg from "@/assets/love-bg.jpg";

// Deterministic positions (no Math.random during render → no hydration mismatch).
const HEARTS = [
  { left: "6%", delay: "0s", size: 14 },
  { left: "16%", delay: "3.5s", size: 10 },
  { left: "28%", delay: "1.2s", size: 18 },
  { left: "41%", delay: "5.8s", size: 12 },
  { left: "55%", delay: "2.4s", size: 16 },
  { left: "67%", delay: "6.6s", size: 11 },
  { left: "78%", delay: "0.8s", size: 20 },
  { left: "90%", delay: "4.2s", size: 13 },
];

export function LockScreen({ onOpen }: { onOpen: () => void }) {
  const inputId = useId();
  const hintId = useId();
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [shake, setShake] = useState(0);
  const [reveal, setReveal] = useState(false);
  const correct = isCorrectPassword(value);
  const showError = shouldShowPasswordError(value, submitted);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (correct) onOpen();
    else {
      setSubmitted(true);
      setShake((n) => n + 1);
    }
  };

  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-5 py-10">
      <img
        src={loveBg}
        alt=""
        aria-hidden="true"
        width={1920}
        height={1088}
        className="absolute inset-0 -z-20 h-full w-full scale-105 object-cover blur-[2px]"
      />
      <div aria-hidden="true" className="lock-veil absolute inset-0 -z-10" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {HEARTS.map((h, i) => (
          <Heart
            key={i}
            className="absolute -bottom-8 animate-float-heart fill-love/60 text-love/70"
            style={{ left: h.left, animationDelay: h.delay, width: h.size, height: h.size }}
          />
        ))}
      </div>

      <main className="w-full max-w-sm animate-rise-in text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-love">27 · 07 · 2026</p>
        <h1 className="font-script text-6xl font-bold text-foreground text-glow-love sm:text-7xl">My Love</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-day-foreground">
          Kho ảnh kỷ niệm của hai đứa mình. Nhập mật khẩu để mở nhé ♡
        </p>

        <form
          onSubmit={submit}
          className="glass mt-8 rounded-3xl p-5 shadow-float"
          noValidate
          aria-label="Mở khóa My Love"
        >
          <label htmlFor={inputId} className="mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <LockKeyhole className="size-3.5" aria-hidden="true" /> Mật khẩu
          </label>
          <div key={shake} className={cn("relative", shake > 0 && showError && "animate-soft-shake")}>
            <input
              id={inputId}
              type={reveal ? "text" : "password"}
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setSubmitted(false);
              }}
              aria-invalid={showError}
              aria-describedby={hintId}
              placeholder="••••••••"
              className={cn(
                "h-12 w-full rounded-full border-2 bg-lock-input pl-5 pr-12 text-center text-lg font-semibold tracking-[0.3em] text-lock-input-foreground shadow-float outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none",
                showError ? "border-love" : correct ? "border-primary" : "border-transparent focus:border-sky",
              )}
            />
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              aria-label={reveal ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-lock-input-foreground/60 hover:text-lock-input-foreground"
            >
              {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p id={hintId} aria-live="polite" className={cn("mt-2 min-h-5 text-xs", showError ? "text-love" : "text-primary-glow")}>
            {showError ? "Mật khẩu chưa đúng rồi, thử lại nhẹ nhàng nhé 💗" : correct ? "Đúng rồi! Bấm OPEN để vào ♡" : ""}
          </p>

          {correct && (
            <Button type="submit" variant="love" size="xl" className="mt-3 w-full animate-rise-in">
              OPEN
            </Button>
          )}
        </form>

        <p className="mx-auto mt-6 max-w-xs text-[11px] leading-relaxed text-muted-foreground">
          Lớp khóa này chỉ che giao diện trên trình duyệt. Ảnh sao lưu đám mây được bảo vệ riêng bằng tài khoản đăng nhập.
        </p>
      </main>
    </div>
  );
}
