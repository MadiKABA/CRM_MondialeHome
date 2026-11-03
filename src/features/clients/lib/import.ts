// Parsing CSV/Excel côté client — utilisé avant envoi au server action

import { DEFAULT_COUNTRY, parsePhone, type CountryCode } from "@/lib/phone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ImportPreviewRow } from "../types";

// Labels FR/EN → clés du DTO
export const FIELD_MAPPING: Record<string, string> = {
  prenom: "firstName",
  prénom: "firstName",
  nom: "lastName",
  telephone: "phone",
  téléphone: "phone",
  tel: "phone",
  mobile: "phone",
  whatsapp: "whatsapp",
  email: "email",
  mail: "email",
  ville: "city",
  quartier: "district",
  source: "source",
  notes: "notes",
  remarques: "notes",
  firstname: "firstName",
  lastname: "lastName",
  phone: "phone",
  city: "city",
  district: "district",
};

export async function parseFile(
  file: File
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: (results) => {
          const headers = results.meta.fields ?? [];
          resolve({ headers, rows: results.data });
        },
        error: (err) => reject(new Error(err.message)),
      });
    });
  }

  if (ext === "xlsx" || ext === "xls") {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) throw new Error("Fichier Excel vide.");
    const ws = wb.Sheets[sheetName];
    if (!ws) throw new Error("Feuille introuvable dans le fichier.");
    const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
      defval: "",
      raw: false,
    });
    const firstRow = data[0];
    const headers = firstRow ? Object.keys(firstRow) : [];
    return { headers, rows: data };
  }

  throw new Error("Format non supporté. Utilisez CSV, XLS ou XLSX.");
}

export function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    if (FIELD_MAPPING[normalized]) {
      mapping[header] = FIELD_MAPPING[normalized];
    }
  }
  return mapping;
}

export function mapAndValidateRows(
  rows: Record<string, string>[],
  mapping: Record<string, string>,
  existingPhones: Set<string> = new Set(),
  defaultCountry: CountryCode = DEFAULT_COUNTRY
): ImportPreviewRow[] {
  const seenPhones = new Set<string>(existingPhones);

  return rows.map((row, index) => {
    const mapped: Record<string, string> = {};
    const errors: string[] = [];
    const invalidFields = new Set<string>();

    for (const [col, field] of Object.entries(mapping)) {
      const value = row[col]?.trim() ?? "";
      if (field === "phone" || field === "whatsapp") {
        const parsed = parsePhone(value, defaultCountry);
        // Numéro invalide : on garde la saisie pour l'afficher dans l'aperçu
        mapped[field] = parsed.ok ? parsed.e164 : value;
        if (value && !parsed.ok) invalidFields.add(field);
      } else {
        mapped[field] = value;
      }
    }

    if (!mapped["firstName"]) errors.push("Prénom manquant");

    if (invalidFields.has("phone")) errors.push("Numéro de téléphone invalide");
    if (invalidFields.has("whatsapp")) errors.push("Numéro WhatsApp invalide");

    if (mapped["email"] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mapped["email"])) {
      errors.push("Format email invalide");
    }

    const isDuplicate = !!(mapped["phone"] && seenPhones.has(mapped["phone"]));
    if (mapped["phone"] && !isDuplicate && !invalidFields.has("phone"))
      seenPhones.add(mapped["phone"]);

    return {
      rowIndex: index + 1,
      data: row,
      mapped: mapped as Partial<ImportPreviewRow["mapped"]>,
      errors,
      isDuplicate,
      isValid: errors.length === 0 && !isDuplicate,
    };
  });
}

export function generateTemplateCsv(): string {
  const headers = [
    "Prénom",
    "Nom",
    "Téléphone",
    "Email",
    "Ville",
    "Quartier",
    "Source",
    "Notes",
  ];
  const example = [
    "Fatou",
    "Diallo",
    "+221771234567",
    "fatou@example.com",
    "Dakar",
    "Almadies",
    "Walk-in",
    "",
  ];
  return "﻿" + headers.join(";") + "\n" + example.join(";");
}
