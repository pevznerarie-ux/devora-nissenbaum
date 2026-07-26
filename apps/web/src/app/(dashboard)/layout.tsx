import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PRODUCT_NAME } from "@pedagoos/shared";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/features/auth/actions";

const NAV_ITEMS = [
  { href: "/", key: "home" },
  { href: "/classes", key: "classes" },
  { href: "/sequences", key: "sequences" },
  { href: "/bibliotheque", key: "library" },
  { href: "/evaluations", key: "assessments" },
  { href: "/eleves", key: "students" },
  { href: "/analyses", key: "analytics" },
  { href: "/administration", key: "administration" },
] as const;

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const authLinkClass =
    "block rounded-md px-3 py-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <div className="flex min-h-dvh">
      <aside className="flex w-60 shrink-0 flex-col border-e bg-card">
        <div className="border-b p-4">
          <span className="text-base font-semibold">{PRODUCT_NAME}</span>
        </div>
        <nav aria-label={t("nav.home")} className="flex-1 p-2">
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t p-2">
          {user ? (
            <div className="flex flex-col gap-1">
              <span
                dir="ltr"
                className="truncate px-3 py-1 text-xs text-muted-foreground"
              >
                {user.email}
              </span>
              <form action={signOutAction}>
                <button type="submit" className={`${authLinkClass} w-full text-start`}>
                  {t("auth.signOut")}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <Link href="/login" className={authLinkClass}>
                {t("auth.signInLink")}
              </Link>
              <Link href="/signup" className={`${authLinkClass} font-medium`}>
                {t("auth.signUpLink")}
              </Link>
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
