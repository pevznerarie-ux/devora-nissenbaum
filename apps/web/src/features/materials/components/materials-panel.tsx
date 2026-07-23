"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { MaterialKind } from "@pedagoos/pedagogy";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";
import { generateMaterialAction, regenerateLessonMaterialsAction } from "../actions";
import type { MaterialListItem } from "../queries";

const KINDS: MaterialKind[] = [
  "teacher_guide",
  "student_handout",
  "presentation",
  "exercise_set",
  "assessment",
];

interface LessonRef {
  id: string;
  title: string;
}

function LessonMaterials({
  sequenceId,
  lesson,
  materials,
}: {
  sequenceId: string;
  lesson: LessonRef;
  materials: MaterialListItem[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const existingKinds = new Set(materials.map((m) => m.kind));

  function generate(kind: MaterialKind) {
    setMessage(null);
    const fd = new FormData();
    fd.set("sequenceId", sequenceId);
    fd.set("lessonId", lesson.id);
    fd.set("kind", kind);
    startTransition(async () => {
      const result = await generateMaterialAction(fd);
      if (result.ok) {
        router.push(`/sequences/${sequenceId}/materials/${result.data.materialId}`);
      } else {
        setMessage(t("common.error"));
      }
    });
  }

  function regenerate() {
    setMessage(null);
    const fd = new FormData();
    fd.set("sequenceId", sequenceId);
    fd.set("lessonId", lesson.id);
    startTransition(async () => {
      const result = await regenerateLessonMaterialsAction(fd);
      if (result.ok) {
        setMessage(
          t("materials.regenerateDone", {
            regenerated: result.data.regenerated,
            skipped: result.data.skippedLocked,
          }),
        );
        router.refresh();
      } else {
        setMessage(t("common.error"));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{lesson.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {materials.length > 0 && (
          <ul className="flex flex-col gap-1.5 text-sm">
            {materials.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/sequences/${sequenceId}/materials/${m.id}`}
                  className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-secondary"
                >
                  <span>
                    {t(`materials.kind.${m.kind}`)}
                    {m.locked ? " 🔒" : ""}
                  </span>
                  <span className="text-muted-foreground">
                    {t(`materials.status.${m.status}`)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((kind) => (
            <Button
              key={kind}
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending || existingKinds.has(kind)}
              onClick={() => generate(kind)}
            >
              {existingKinds.has(kind) ? "✓ " : "+ "}
              {t(`materials.kind.${kind}`)}
            </Button>
          ))}
        </div>
        {materials.length > 0 && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={regenerate}
            >
              {t("materials.regenerateAffected")}
            </Button>
            {message && <span className="text-sm text-muted-foreground">{message}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MaterialsPanel({
  sequenceId,
  lessons,
  materials,
}: {
  sequenceId: string;
  lessons: LessonRef[];
  materials: MaterialListItem[];
}) {
  const byLesson = new Map<string, MaterialListItem[]>();
  for (const m of materials) {
    if (!m.lesson_id) continue;
    const list = byLesson.get(m.lesson_id);
    if (list) list.push(m);
    else byLesson.set(m.lesson_id, [m]);
  }

  return (
    <div className="flex flex-col gap-3">
      {lessons.map((lesson) => (
        <LessonMaterials
          key={lesson.id}
          sequenceId={sequenceId}
          lesson={lesson}
          materials={byLesson.get(lesson.id) ?? []}
        />
      ))}
    </div>
  );
}
