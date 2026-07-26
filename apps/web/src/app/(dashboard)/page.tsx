import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";
import { createClient } from "@/lib/supabase/server";
import { CreateOrgForm } from "@/features/admin/components/create-org-form";
import { listClasses } from "@/features/classes/queries";

const QUICK_LINKS = [
  { href: "/classes", key: "classes" },
  { href: "/sequences", key: "sequences" },
  { href: "/bibliotheque", key: "library" },
  { href: "/administration", key: "administration" },
] as const;

/**
 * Accueil adaptatif : visiteur → vitrine (démo) ; connecté sans organisation →
 * onboarding (créer l'organisation) ; connecté avec organisation → tableau de
 * bord avec les vraies données.
 */
export default async function HomePage() {
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <PublicLanding />;
  }

  const { data: memberships } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("profile_id", user.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">{t("home.onboardingTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("home.onboardingHelp")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("admin.createOrg")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateOrgForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("home.nextStepsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex list-decimal flex-col gap-1.5 ps-5 text-sm text-muted-foreground">
              <li>{t("home.step1")}</li>
              <li>{t("home.step2")}</li>
              <li>{t("home.step3")}</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    );
  }

  const classes = await listClasses();
  const activeClasses = classes.filter((cls) => cls.archived_at === null).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t("home.dashboardTitle")}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t("home.dashboardIntro")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{activeClasses}</p>
            <p className="text-sm text-muted-foreground">{t("home.activeClasses")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("home.quickStartTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {QUICK_LINKS.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md border p-4 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {t(`nav.${key}`)}
            </Link>
          ))}
        </CardContent>
      </Card>

      {activeClasses === 0 && (
        <p className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">
          {t("home.setupHint")}
        </p>
      )}
    </div>
  );
}

/** Accueil public (non connecté) : démonstration en lecture seule. */
function PublicLanding() {
  const demoSteps: { href: string; title: string; body: string }[] = [
    {
      href: "/classes",
      title: "1. Consulter la classe",
      body: "CM2 Aleph avec professeurs et élèves.",
    },
    {
      href: "/sequences",
      title: "2. Ouvrir la séquence",
      body: "Structure pédagogique déjà préparée.",
    },
    {
      href: "/bibliotheque",
      title: "3. Voir les sources",
      body: "Documents et ressources utilisés par la séquence.",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Démo : un espace de pilotage pour préparer une séquence, organiser les classes
          et suivre les supports pédagogiques. Créez un compte pour votre propre espace.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          ["3", "classes actives"],
          ["6", "élèves visibles"],
          ["2", "séquences en cours"],
          ["9", "supports générés"],
        ].map(([value, label]) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parcours de démonstration</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {demoSteps.map(({ href, title, body }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md border p-4 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-muted-foreground">{body}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
