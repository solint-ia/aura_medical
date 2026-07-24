import { CompareSlider } from "@/components/ui/CompareSlider";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import type { ClinicalCase } from "@/data/cases";

const STAGE_BADGE_CLASSES =
  "pointer-events-none absolute top-2.5 left-2.5 rounded-full bg-panel/60 px-2 py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-on-panel uppercase";

export function CaseCard({ clinicalCase }: { clinicalCase: ClinicalCase }) {
  const stages = [
    { key: "before", label: "Antes" },
    { key: "after", label: "Depois" },
  ] as const;

  return (
    <figure className="flex flex-col gap-5 rounded-[14px] border border-on-panel/12 bg-on-panel/3 p-8">
      {clinicalCase.photos ? (
        // With both frames in hand, one draggable frame beats two static ones:
        // the eye compares the same region instead of jumping between panels.
        <CompareSlider
          before={clinicalCase.photos.before}
          after={clinicalCase.photos.after}
          subject={clinicalCase.doctor}
          className="mx-auto aspect-3/4 max-w-[440px] rounded-[10px]"
          sizes="(max-width: 900px) 78vw, 440px"
        />
      ) : (
        <div className="grid grid-cols-2 gap-7">
          {stages.map((stage) => (
            <div key={stage.key} className="relative">
              <PhotoSlot
                alt={`${stage.label} — ${clinicalCase.doctor}`}
                caption={stage.label}
                sizes="(max-width: 900px) 45vw, 400px"
                className="aspect-3/4 w-full rounded-[10px]"
              />
              <span className={STAGE_BADGE_CLASSES}>{stage.label}</span>
            </div>
          ))}
        </div>
      )}

      <figcaption>
        <p className="font-display text-[15.5px] font-semibold text-on-panel">
          {clinicalCase.doctor}
        </p>
        <p className="mt-1 font-mono text-[11px] tracking-[0.04em] text-on-panel/60 uppercase">
          {clinicalCase.meta}
        </p>
        {clinicalCase.note ? (
          <p className="mt-1.5 text-[13px] text-on-panel/72">
            {clinicalCase.note}
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}
