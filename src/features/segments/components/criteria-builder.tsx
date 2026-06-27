"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { previewCriteria } from "@/features/segments/server/actions";
import { CRITERIA_DEFINITIONS } from "../types";
import type { CriteriaGroupDTO, CriterionDTO, CriterionDefinition } from "../types";

interface CriteriaBuilderProps {
  value: CriteriaGroupDTO;
  onChange: (criteria: CriteriaGroupDTO) => void;
}

interface PreviewState {
  count: number;
  sample: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    city: string | null;
  }>;
}

// Catégories groupées pour le select de champ
const CATEGORIES = [...new Set(CRITERIA_DEFINITIONS.map((d) => d.category))];

function getDefinition(field: string): CriterionDefinition | undefined {
  return CRITERIA_DEFINITIONS.find((d) => d.field === field);
}

function defaultCriterion(): CriterionDTO {
  return { field: "totalSpent", operator: "gte", value: 0 };
}

// ── Ligne d'un critère ────────────────────────────────────────────────────────

interface CriterionRowProps {
  criterion: CriterionDTO;
  onUpdate: (updated: CriterionDTO) => void;
  onRemove: () => void;
}

function CriterionRow({ criterion, onUpdate, onRemove }: CriterionRowProps) {
  const def = getDefinition(criterion.field);

  function handleFieldChange(field: string) {
    const newDef = getDefinition(field);
    const firstOp = newDef?.operators[0]?.value ?? "eq";
    const defaultVal =
      newDef?.type === "boolean" ? true : newDef?.type === "number" ? 0 : "";
    onUpdate({ field, operator: firstOp, value: defaultVal });
  }

  function handleOperatorChange(operator: string) {
    onUpdate({ ...criterion, operator, value2: undefined });
  }

  function handleValueChange(value: string | number | boolean) {
    onUpdate({ ...criterion, value });
  }

  function handleValue2Change(value2: string | number) {
    onUpdate({ ...criterion, value2 });
  }

  const needsValue2 = def?.operators.find(
    (o) => o.value === criterion.operator
  )?.needsValue2;

  return (
    <div className="border-cream-darker bg-cream/30 flex flex-wrap items-start gap-2 rounded-lg border p-3">
      {/* Champ */}
      <div className="min-w-[180px] flex-1">
        <Label className="text-text-secondary mb-1 text-[11px]">Champ</Label>
        <Select
          value={criterion.field}
          onValueChange={(v) => {
            if (v) handleFieldChange(v);
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <div className="text-text-muted px-2 py-1.5 text-[10px] font-semibold tracking-wider uppercase">
                  {cat}
                </div>
                {CRITERIA_DEFINITIONS.filter((d) => d.category === cat).map((d) => (
                  <SelectItem key={d.field} value={d.field} className="text-xs">
                    {d.label}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Opérateur */}
      {def && def.type !== "boolean" && (
        <div className="min-w-[160px] flex-1">
          <Label className="text-text-secondary mb-1 text-[11px]">Condition</Label>
          <Select
            value={criterion.operator}
            onValueChange={(v) => {
              if (v) handleOperatorChange(v);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {def.operators.map((op) => (
                <SelectItem key={op.value} value={op.value} className="text-xs">
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Valeur */}
      {def && def.type !== "boolean" && (
        <div className="min-w-[120px] flex-1">
          <Label className="text-text-secondary mb-1 text-[11px]">
            {def.unit ? `Valeur (${def.unit})` : "Valeur"}
          </Label>
          {def.type === "select" ? (
            <Select
              value={String(criterion.value)}
              onValueChange={(v) => {
                if (v) handleValueChange(v);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {def.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : def.type === "number" ? (
            <Input
              type="number"
              value={Number(criterion.value)}
              onChange={(e) => handleValueChange(Number(e.target.value))}
              placeholder={def.placeholder}
              className="h-8 text-xs"
            />
          ) : def.type === "date" ? (
            criterion.operator === "last_days" ? (
              <Input
                type="number"
                value={Number(criterion.value)}
                onChange={(e) => handleValueChange(Number(e.target.value))}
                placeholder="Ex : 90"
                className="h-8 text-xs"
                min={1}
              />
            ) : (
              <Input
                type="date"
                value={String(criterion.value)}
                onChange={(e) => handleValueChange(e.target.value)}
                className="h-8 text-xs"
              />
            )
          ) : (
            <Input
              type="text"
              value={String(criterion.value)}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={def.placeholder}
              className="h-8 text-xs"
            />
          )}
        </div>
      )}

      {/* Valeur 2 (between) */}
      {def && needsValue2 && (
        <div className="min-w-[120px] flex-1">
          <Label className="text-text-secondary mb-1 text-[11px]">
            et ({def.unit ?? "valeur"})
          </Label>
          <Input
            type={def.type === "number" ? "number" : "text"}
            value={criterion.value2 != null ? String(criterion.value2) : ""}
            onChange={(e) =>
              handleValue2Change(
                def.type === "number" ? Number(e.target.value) : e.target.value
              )
            }
            placeholder="Maximum"
            className="h-8 text-xs"
          />
        </div>
      )}

      {/* Pour les booléens, le select d'opérateur suffit */}
      {def && def.type === "boolean" && (
        <div className="min-w-[180px] flex-1">
          <Label className="text-text-secondary mb-1 text-[11px]">Condition</Label>
          <Select
            value={criterion.operator}
            onValueChange={(v) => {
              if (v) handleOperatorChange(v);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {def.operators.map((op) => (
                <SelectItem key={op.value} value={op.value} className="text-xs">
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Supprimer */}
      <div className="flex items-end pb-0.5">
        <button
          type="button"
          onClick={onRemove}
          className="text-text-muted mt-5 rounded p-1 transition-colors hover:text-red-600"
          aria-label="Supprimer ce critère"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ── Aperçu en temps réel ──────────────────────────────────────────────────────

interface PreviewCardProps {
  preview: PreviewState | null;
  isPending: boolean;
  hasCriteria: boolean;
}

function PreviewCard({ preview, isPending, hasCriteria }: PreviewCardProps) {
  if (!hasCriteria) return null;

  return (
    <div className="border-cream-darker bg-cream/20 rounded-xl border p-4">
      <p className="text-text-secondary mb-3 text-xs font-semibold tracking-wider uppercase">
        Aperçu en temps réel
      </p>

      {isPending && (
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="text-gold-deep size-4 animate-spin" />
          <span className="text-text-secondary">Calcul en cours...</span>
        </div>
      )}

      {!isPending && preview && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Users className="text-gold-deep size-5" />
            <span className="font-heading text-xl font-bold">
              {preview.count.toLocaleString("fr-FR")}
            </span>
            <span className="text-text-secondary text-sm">
              client{preview.count !== 1 ? "s" : ""} correspondant
              {preview.count !== 1 ? "s" : ""}
            </span>
          </div>

          {preview.count === 0 && (
            <p className="text-text-secondary text-sm italic">
              Aucun client ne correspond. Essayez d&apos;assouplir les critères.
            </p>
          )}

          {preview.count > 5000 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Beaucoup de clients ciblés. Précisez les critères pour affiner.
            </p>
          )}

          {preview.sample.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-text-secondary text-[11px] tracking-wider uppercase">
                Exemples
              </p>
              {preview.sample.map((c) => (
                <p key={c.id} className="text-text-secondary text-xs">
                  {c.firstName} {c.lastName ?? ""}
                  {c.city ? ` · ${c.city}` : ""}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {!isPending && !preview && (
        <p className="text-text-secondary text-sm italic">
          Ajoutez au moins un critère pour voir l&apos;aperçu.
        </p>
      )}
    </div>
  );
}

// ── CriteriaBuilder principal ─────────────────────────────────────────────────

export function CriteriaBuilder({ value, onChange }: CriteriaBuilderProps) {
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<PreviewState | null>(null);

  // Debounce : déclenche la prévisualisation 800ms après le dernier changement
  useDebounce(
    () => {
      if (value.criteria.length === 0) {
        setPreview(null);
        return;
      }
      startTransition(async () => {
        const result = await previewCriteria(value);
        if (result.success && result.data) {
          setPreview(result.data);
        }
      });
    },
    800,

    [JSON.stringify(value.criteria)]
  );

  function addCriterion() {
    onChange({ ...value, criteria: [...value.criteria, defaultCriterion()] });
  }

  function updateCriterion(index: number, updated: CriterionDTO) {
    const criteria = [...value.criteria];
    criteria[index] = updated;
    onChange({ ...value, criteria });
  }

  function removeCriterion(index: number) {
    onChange({ ...value, criteria: value.criteria.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm font-medium">
        Montrer les clients dont :
      </p>

      <div className="space-y-3">
        {value.criteria.map((criterion, index) => (
          <div key={index}>
            {index > 0 && (
              <div className="my-2 flex items-center gap-2">
                <div className="border-cream-darker flex-1 border-t" />
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      operator: value.operator === "AND" ? "OR" : "AND",
                    })
                  }
                  className="bg-cream border-cream-darker text-text-secondary hover:border-gold-deep hover:text-gold-deep rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"
                  title="Cliquer pour basculer ET / OU"
                >
                  {value.operator === "AND" ? "ET" : "OU"}
                </button>
                <div className="border-cream-darker flex-1 border-t" />
              </div>
            )}
            <CriterionRow
              criterion={criterion}
              onUpdate={(updated) => updateCriterion(index, updated)}
              onRemove={() => removeCriterion(index)}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addCriterion}
        className="text-gold-deep hover:text-gold-darker flex items-center gap-1.5 text-sm transition-colors"
      >
        <Plus className="size-4" />
        Ajouter une condition
      </button>

      <PreviewCard
        preview={preview}
        isPending={isPending}
        hasCriteria={value.criteria.length > 0}
      />
    </div>
  );
}
