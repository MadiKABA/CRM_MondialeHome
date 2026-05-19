"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImportMappingProps {
  headers: string[];
  mapping: Record<string, string>;
  rowCount: number;
  onMappingChange: (mapping: Record<string, string>) => void;
}

const CRM_FIELDS = [
  { value: "firstName", label: "Prénom *" },
  { value: "lastName", label: "Nom" },
  { value: "phone", label: "Téléphone" },
  { value: "email", label: "Email" },
  { value: "city", label: "Ville" },
  { value: "district", label: "Quartier" },
  { value: "source", label: "Source" },
  { value: "notes", label: "Notes" },
  { value: "__ignore__", label: "Ignorer" },
];

export function ImportMapping({
  headers,
  mapping,
  rowCount,
  onMappingChange,
}: ImportMappingProps) {
  const update = (col: string, field: string) => {
    const next = { ...mapping };
    if (field === "__ignore__") {
      delete next[col];
    } else {
      next[col] = field;
    }
    onMappingChange(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm">
        <span className="text-foreground font-semibold">
          {rowCount.toLocaleString("fr-FR")}
        </span>{" "}
        lignes détectées. Associez chaque colonne à un champ CRM.
      </p>

      <div className="border-border overflow-hidden rounded-xl border">
        <div className="bg-cream grid grid-cols-2 gap-x-4 px-4 py-2 text-xs font-semibold tracking-wide uppercase">
          <span>Colonne du fichier</span>
          <span>Champ CRM</span>
        </div>
        <div className="divide-border divide-y">
          {headers.map((header) => (
            <div
              key={header}
              className="grid grid-cols-2 items-center gap-x-4 px-4 py-2.5"
            >
              <span className="truncate font-mono text-sm">{header}</span>
              <Select
                value={mapping[header] ?? "__ignore__"}
                onValueChange={(v) => update(header, v ?? "__ignore__")}
              >
                <SelectTrigger className="border-border h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRM_FIELDS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
