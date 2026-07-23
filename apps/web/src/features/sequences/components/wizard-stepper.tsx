import { getTranslations } from "next-intl/server";

const STEP_KEYS = [
  "frame",
  "intentions",
  "sources",
  "generate",
  "review",
  "materials",
] as const;

/** Fil d'Ariane des 6 étapes de l'assistant, étape courante mise en avant. */
export async function WizardStepper({ current }: { current: number }) {
  const t = await getTranslations();
  return (
    <ol
      className="flex flex-wrap gap-2 text-sm"
      aria-label={t("sequences.step", { n: current })}
    >
      {STEP_KEYS.map((key, index) => {
        const step = index + 1;
        const state = step === current ? "current" : step < current ? "done" : "todo";
        return (
          <li
            key={key}
            aria-current={state === "current" ? "step" : undefined}
            className={[
              "rounded-full border px-3 py-1",
              state === "current"
                ? "border-primary bg-primary text-primary-foreground"
                : "",
              state === "done" ? "border-primary/40 text-muted-foreground" : "",
              state === "todo" ? "text-muted-foreground" : "",
            ].join(" ")}
          >
            {step}. {t(`sequences.steps.${key}`)}
          </li>
        );
      })}
    </ol>
  );
}
