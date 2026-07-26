import { Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Analyses</h1>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["Progression", "78%", "Objectifs travaillés dans la séquence démo"],
          ["Attention", "2 notions", "Vocabulaire urbain et lecture de carte"],
          ["Différenciation", "3 groupes", "Soutien, standard, approfondissement"],
        ].map(([title, value, body]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lecture pédagogique</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La démo illustre le tableau de bord attendu : l'enseignant voit les
            objectifs couverts, les points à reprendre et les supports déjà prêts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
