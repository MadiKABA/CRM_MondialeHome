// Côté CLIENT uniquement — parse le fichier brut sans envoi au serveur

import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedImportFile {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  fileName: string;
  fileType: "csv" | "excel";
}

export async function parseImportFile(file: File): Promise<ParsedImportFile> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv" || ext === "txt") {
    return parseCSV(file);
  }

  if (ext === "xlsx" || ext === "xls") {
    return parseExcel(file);
  }

  throw new Error(`Format "${ext}" non supporté. Utilisez un fichier CSV, XLS ou XLSX.`);
}

async function parseCSV(file: File): Promise<ParsedImportFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: "",
      encoding: "UTF-8",
      transformHeader: (h) => h.trim(),
      transform: (val) => val.trim(),
      complete: (results) => {
        const critical = results.errors.filter((e) => e.type === "Delimiter");
        if (critical.length > 0) {
          reject(
            new Error("Impossible de lire le CSV. Vérifiez que le séparateur est , ou ;")
          );
          return;
        }
        const headers = results.meta.fields ?? [];
        const rows = results.data as Record<string, string>[];
        resolve({
          headers,
          rows,
          totalRows: rows.length,
          fileName: file.name,
          fileType: "csv",
        });
      },
      error: (err) => reject(new Error(`Erreur CSV : ${err.message}`)),
    });
  });
}

async function parseExcel(file: File): Promise<ParsedImportFile> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });

  if (wb.SheetNames.length === 0) {
    throw new Error("Le fichier Excel est vide ou corrompu.");
  }

  const sheetName = wb.SheetNames[0]!;
  const ws = wb.Sheets[sheetName]!;

  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
    raw: false,
  });

  if (data.length === 0) {
    throw new Error(`La feuille "${sheetName}" est vide.`);
  }

  const rows = data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k.trim(), String(v ?? "").trim()])
    )
  );

  const firstRow = rows[0];
  const headers = firstRow ? Object.keys(firstRow) : [];

  return {
    headers,
    rows,
    totalRows: rows.length,
    fileName: file.name,
    fileType: "excel",
  };
}
