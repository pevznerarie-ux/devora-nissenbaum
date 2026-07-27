import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";
import { DEMO_ORG_ID } from "@/lib/demo-data";
import { getClassDetail, listOrgTeachers } from "@/features/classes/queries";
import {
  AddStudentForm,
  AddStudentsTextForm,
  AddTeacherForm,
  ArchiveClassButton,
  ImportCsvForm,
  StudentNoteForm,
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{detail.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
          <CardTitle>{t("classes.studentsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {detail.students.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("classes.studentsEmpty")}</p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {detail.students.map((student) => (
                <li key={student.id} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="min-w-0 font-medium">
                      {student.last_name.toUpperCase()} {student.first_name}
                    </p>
                    {student.note && (
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {t("students.hasNote")}
                      </span>
                    )}
                  </div>
                  {!isArchived && !isDemo && (
                    <StudentNoteForm
                      classId={detail.id}
                      studentId={student.id}
                      note={student.note}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
          {!isArchived && !isDemo && (
            <div className="grid gap-4 xl:grid-cols-2">
              <AddStudentForm classId={detail.id} />
              <AddStudentsTextForm classId={detail.id} />
              <div className="xl:col-span-2">
                <ImportCsvForm classId={detail.id} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
