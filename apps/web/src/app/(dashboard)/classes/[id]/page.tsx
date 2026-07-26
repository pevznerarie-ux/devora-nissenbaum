import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";
import { DEMO_ORG_ID } from "@/lib/demo-data";
import { getClassDetail, listOrgTeachers } from "@/features/classes/queries";
import {
  AddStudentForm,
  AddTeacherForm,
  ArchiveClassButton,
  ImportCsvForm,
} from "@/features/classes/components/class-detail-forms";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();

  const parsedId = z.uuid().safeParse(id);
  const detail = parsedId.success ? await getClassDetail(parsedId.data) : null;

  if (!detail) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">{t("nav.classes")}</h1>
        <p className="text-sm text-muted-foreground">{t("classes.notFound")}</p>
      </div>
    );
  }

  const isArchived = detail.archived_at !== null;
  const isDemo = detail.organization_id === DEMO_ORG_ID;
  const orgTeachers = isArchived ? [] : await listOrgTeachers(detail.organization_id);
  const assignedIds = new Set(detail.teachers.map((teacher) => teacher.profile_id));
  const assignableTeachers = orgTeachers.filter(
    (teacher) => !assignedIds.has(teacher.profile_id),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{detail.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t(`grades.${detail.grade_level}`)} · {detail.schools?.name} ·{" "}
            {detail.academic_years?.label}
            {detail.subjects ? ` · ${detail.subjects.name}` : ""}
          </p>
        </div>
        {!isArchived && !isDemo && <ArchiveClassButton classId={detail.id} />}
      </div>

      {isArchived && (
        <p className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">
          {t("classes.archived")}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("classes.teachersTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {detail.teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("classes.teachersEmpty")}</p>
          ) : (
            <ul className="flex flex-wrap gap-2 text-sm">
              {detail.teachers.map((teacher) => (
                <li key={teacher.profile_id} className="rounded-full border px-3 py-1">
                  {teacher.full_name}
                </li>
              ))}
            </ul>
          )}
          {!isArchived && !isDemo && (
            <AddTeacherForm classId={detail.id} teachers={assignableTeachers} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("classes.studentsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {detail.students.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("classes.studentsEmpty")}</p>
          ) : (
            <ul className="grid gap-1 text-sm md:grid-cols-2">
              {detail.students.map((student) => (
                <li key={student.id} className="rounded-md border px-3 py-1.5">
                  {student.last_name.toUpperCase()} {student.first_name}
                </li>
              ))}
            </ul>
          )}
          {!isArchived && !isDemo && (
            <>
              <AddStudentForm classId={detail.id} />
              <ImportCsvForm classId={detail.id} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
