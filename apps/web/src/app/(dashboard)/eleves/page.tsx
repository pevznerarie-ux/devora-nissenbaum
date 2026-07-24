import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  schools: { name: string } | null;
}

export default async function StudentsPage() {
  const t = await getTranslations();
  const supabase = await createClient();
  // La RLS restreint aux élèves des classes accessibles à l'utilisateur.
  const { data } = await supabase
    .from("students")
    .select("id, first_name, last_name, schools(name)")
    .is("archived_at", null)
    .order("last_name")
    .limit(500);
  const students = (data ?? []) as unknown as StudentRow[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("nav.students")}</h1>
      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("students.empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full max-w-2xl border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-start font-medium">
                  {t("students.lastName")}
                </th>
                <th className="px-3 py-2 text-start font-medium">
                  {t("students.firstName")}
                </th>
                <th className="px-3 py-2 text-start font-medium">
                  {t("students.school")}
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b">
                  <td className="px-3 py-2">{student.last_name.toUpperCase()}</td>
                  <td className="px-3 py-2">{student.first_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {student.schools?.name ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
