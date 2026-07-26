import { Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Évaluations</h1>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["Diagnostic", "Repérer les acquis avant la séquence", "Prêt"],
          ["Formative", "Questions courtes après chaque séance", "Brouillon"],
          ["Finale", "Synthèse écrite avec grille de correction", "À préparer"],
        ].map(([title, body, status]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{body}</p>
              <p className="mt-3 text-xs font-medium">{status}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
