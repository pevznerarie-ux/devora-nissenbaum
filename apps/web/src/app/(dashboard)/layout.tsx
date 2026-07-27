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
  { href: "/parametres", key: "settings" },
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

  const navLinkClass =
    "block whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
  const authLinkClass =
    "block whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b bg-white/95 shadow-sm md:sticky md:top-0 md:h-dvh md:w-64 md:border-b-0 md:border-e">
        <div className="border-b p-4">
          <span className="text-base font-semibold tracking-wide">{PRODUCT_NAME}</span>
          <p className="mt-1 text-xs text-muted-foreground">Espace professeur</p>
        </div>
        <nav
          aria-label={t("nav.home")}
          className="overflow-x-auto p-2 md:flex-1 md:overflow-visible"
        >
          <ul className="flex gap-0.5 md:flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className={navLinkClass}>
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t p-2">
          {user ? (
            <div className="flex items-center gap-1 md:flex-col md:items-stretch">
              <span
                dir="ltr"
                className="min-w-0 flex-1 truncate px-3 py-1 text-xs text-muted-foreground md:flex-none"
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
            <div className="flex gap-0.5 md:flex-col">
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
      <main className="min-w-0 flex-1 p-4 md:p-6">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
