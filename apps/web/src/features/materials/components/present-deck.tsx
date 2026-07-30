"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PRODUCT_NAME } from "@pedagoos/shared";

export interface PresentSlide {
  id: string;
  title: string;
  bullets: string[];
}

/**
 * Mode présentation à l'écran (ADR-0016) : projection plein écran d'une séance,
 * un écran = une idée, navigation clavier (←/→, Échap). Charte de design
 * appliquée, contraste pensé pour la projection. Les corrigés et notes
 * professeur ne sont jamais projetés (fournis à part côté fiche prof).
 */
export function PresentDeck({
  title,
  kindLabel,
  slides,
}: {
  title: string;
  kindLabel: string;
  slides: PresentSlide[];
}) {
  const t = useTranslations();
  // Écran 0 = accroche (titre) ; écrans 1..n = contenus.
  const total = slides.length + 1;
  const [index, setIndex] = useState(0);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.min(Math.max(i + delta, 0), total - 1));
    },
    [total],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(e.key)) {
        e.preventDefault();
        go(1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) void document.exitFullscreen?.();
      } else if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) void document.exitFullscreen?.();
        else void document.documentElement.requestFullscreen?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const isTitle = index === 0;
  const slide = isTitle ? null : slides[index - 1];

  return (
    <main className="relative flex h-dvh w-full flex-col overflow-hidden bg-gradient-to-br from-brand-navy-2 to-brand-navy font-sans text-white">
      {/* Barre haute */}
      <div className="flex items-center justify-between px-8 pt-6 text-sm text-white/70 sm:px-14">
        <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-[0.14em] text-[11px]">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-terra-fill" />
          {kindLabel}
        </span>
        <span>{title}</span>
      </div>

      {/* Contenu de l'écran courant */}
      <div className="flex flex-1 items-center px-8 sm:px-16">
        {isTitle ? (
          <div>
            <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-terra-fill" />
              {t("materials.classMode")}
            </p>
            <h1 className="max-w-[22ch] font-serif text-5xl font-bold leading-[1.02] sm:text-7xl">
              {title}
            </h1>
            <p className="mt-6 text-lg text-white/70 sm:text-2xl">{kindLabel}</p>
          </div>
        ) : slide ? (
          <div className="w-full">
            <h2 className="max-w-[24ch] font-serif text-4xl font-bold leading-tight sm:text-6xl">
              {slide.title}
            </h2>
            {slide.bullets.length > 0 && (
              <ul className="mt-8 flex max-w-5xl flex-col gap-5 text-2xl leading-snug text-white/90 sm:mt-12 sm:text-4xl">
                {slide.bullets.map((bullet, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="mt-3 h-3 w-3 shrink-0 rounded-full bg-brand-terra-fill sm:mt-4" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {/* Barre basse : marque, progression, navigation */}
      <div className="flex items-center justify-between gap-4 px-8 pb-6 text-sm text-white/60 sm:px-14">
        <span className="font-serif text-base font-bold text-white">{PRODUCT_NAME}</span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className={
                i === index
                  ? "h-2 w-6 rounded-full bg-brand-terra-fill"
                  : "h-2 w-2 rounded-full bg-white/25"
              }
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label={t("materials.presentPrev")}
            className="rounded-md border border-white/25 px-3 py-1.5 text-white disabled:opacity-30"
          >
            ‹
          </button>
          <span className="tabular-nums">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index === total - 1}
            aria-label={t("materials.presentNext")}
            className="rounded-md border border-white/25 px-3 py-1.5 text-white disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>
    </main>
  );
}
