import Image from "next/image";

interface PhotoSlotProps {
  /** Omit while the photo for this slot has not been supplied yet. */
  src?: string;
  alt: string;
  /** Shown in place of the photo, describing what belongs here. */
  caption: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * A fixed frame that either holds a photo or states which photo belongs there.
 * Replaces the `<image-slot>` custom element used in the prototype.
 */
export function PhotoSlot({
  src,
  alt,
  caption,
  className = "",
  sizes = "(max-width: 900px) 50vw, 420px",
  priority = false,
}: PhotoSlotProps) {
  return (
    <div
      className={`relative overflow-hidden bg-navy-deep dark:bg-canvas ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 border border-dashed border-on-panel/20 p-4 text-center">
          <span
            aria-hidden="true"
            className="h-7 w-7 rounded-full border border-on-panel/25"
          />
          <span className="font-mono text-[10px] tracking-[0.08em] text-on-panel/45 uppercase">
            {caption}
          </span>
        </div>
      )}
    </div>
  );
}
