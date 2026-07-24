import {
  ADVERSE_EVENT_CONTACT,
  FOOTER_COLUMNS,
  MEDICAL_INFO_CONTACT,
} from "@/data/site";

const COLUMN_LABEL_CLASSES =
  "mb-1 font-mono text-[10px] tracking-[0.06em] text-on-panel/55 uppercase";

export function SiteFooter() {
  return (
    <footer className="bg-panel px-[clamp(20px,4vw,56px)] pt-12 pb-8">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8 border-b border-on-panel/12 pb-8">
        <div>
          <p className="mb-2 font-display text-[19px] font-bold tracking-[-0.01em] text-on-panel">
            Aura Medical
          </p>
          <p className="font-mono text-[10.5px] tracking-[0.06em] text-on-panel/60 uppercase">
            Distribuidor Oficial pbserum · Brasil
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div
            key={column.label}
            className="flex flex-col gap-1.5 text-[13.5px] text-on-panel/72"
          >
            <p className={COLUMN_LABEL_CLASSES}>{column.label}</p>
            {column.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ))}

        <div className="flex flex-col gap-1.5 text-[13.5px] text-on-panel/72">
          <p className={COLUMN_LABEL_CLASSES}>{ADVERSE_EVENT_CONTACT.label}</p>
          <a
            href={`mailto:${ADVERSE_EVENT_CONTACT.email}`}
            className="transition-colors hover:text-accent-panel"
          >
            {ADVERSE_EVENT_CONTACT.email}
          </a>
          <p className={`${COLUMN_LABEL_CLASSES} mt-2`}>
            {MEDICAL_INFO_CONTACT.label}
          </p>
          <a
            href={`mailto:${MEDICAL_INFO_CONTACT.email}`}
            className="transition-colors hover:text-accent-panel"
          >
            {MEDICAL_INFO_CONTACT.email}
          </a>
        </div>
      </div>

      <p className="mx-auto mt-4 max-w-[1280px] font-mono text-[10.5px] tracking-[0.04em] text-on-panel/45">
        © 2026 Aura Medical — Distribuidor Oficial pbserum no Brasil.
      </p>
    </footer>
  );
}
