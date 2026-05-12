import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground">Bienvenue sur votre CRM Mondial Home.</p>
      </div>

      {/* TODO: KPI cards, graphiques, activité récente */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["Clients", "Ventes", "Campagnes", "Messages"].map((label) => (
          <div
            key={label}
            className="border-border bg-card rounded-xl border p-6 shadow-sm"
          >
            <p className="text-muted-foreground text-sm font-medium">{label}</p>
            <p className="font-heading mt-2 text-3xl font-bold">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
