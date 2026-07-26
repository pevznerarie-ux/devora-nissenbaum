import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";

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

export default async function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Démo PedagoOS : un espace de pilotage pour préparer une séquence, organiser les
          classes et suivre les supports pédagogiques.
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

      <Card>
        <CardHeader>
          <CardTitle>Prochaine action produit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Le mode démo montre l'expérience cible. La prochaine étape sera de connecter
            ce parcours aux vraies données Supabase et aux comptes école.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
