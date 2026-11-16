import { useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { dayKey, fmtBytes, stripName, type DayGroup } from "@/lib/format";
import type { Photo } from "@/lib/photo-store/types";

export function FilmShelf({
  group,
  onOpen,
  onBrokenImage,
}: {
  group: DayGroup<Photo>;
  onOpen: (index: number) => void;
  onBrokenImage: () => void;
}) {
  const filmRef = useRef<HTMLDivElement>(null);
  const headingId = `shelf-${group.key.replace(/\D/g, "")}`;
  const scroll = (dir: number) => filmRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  return (
    <section aria-labelledby={headingId} className="glass mt-6 rounded-[20px] p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <h2 id={headingId} className="rounded-lg bg-glass-strong px-3 py-1 text-[13px] font-bold">
            {group.label}
          </h2>
          <span className="text-xs font-medium text-muted-foreground">{group.items.length} ảnh</span>
        </div>
        <div className="flex flex-none gap-1.5">
          <button type="button" onClick={() => scroll(-1)} aria-label="Cuộn sang trái" className="grid size-8 place-items-center rounded-full border border-glass-border bg-glass hover:bg-accent">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Cuộn sang phải" className="grid size-8 place-items-center rounded-full border border-glass-border bg-glass hover:bg-accent">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={filmRef}
        tabIndex={0}
        aria-label={`Dải ảnh ${group.label}`}
        className="scrollbar-thin snap-x snap-proximity overflow-x-auto rounded-[14px]"
      >
        <ul className="film-frames flex w-max min-w-full gap-3.5 px-4 py-[30px]">
          {group.items.map(({ item: photo, index }) => (
            <li
              key={photo.id}
              className="group w-32 flex-none snap-start rounded-xl border border-glass-border bg-glass p-2 transition-transform hover:-translate-y-[3px] hover:bg-glass-strong sm:w-40"
            >
              <button
                type="button"
                onClick={() => onOpen(index)}
                aria-label={`Mở ${photo.name}`}
                className="relative block aspect-square w-full overflow-hidden rounded-lg bg-tile"
              >
                <img
                  src={photo.url}
                  alt={photo.name}
                  loading="lazy"
                  decoding="async"
                  onError={onBrokenImage}
                  className="size-full object-cover"
                />
                <span
                  aria-hidden="true"
                  className="absolute bottom-2 right-2 grid size-[34px] translate-y-1.5 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-float transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
                >
                  <Play className="size-4 fill-current" />
                </span>
              </button>
              <div className="mt-1.5 grid px-0.5">
                <b className="truncate text-xs font-medium">{stripName(photo.name)}</b>
                <span className="truncate text-[10px] text-muted-foreground">
                  {dayKey(photo.createdAt)} · {fmtBytes(photo.size)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
