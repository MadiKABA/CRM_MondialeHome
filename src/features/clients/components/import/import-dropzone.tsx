"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateTemplateCsv } from "../../lib/import";

interface ImportDropzoneProps {
  onFile: (file: File) => void;
}

export function ImportDropzone({ onFile }: ImportDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const accept = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext ?? "")) return;
    setSelectedFile(file);
    onFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) accept(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const downloadTemplate = () => {
    const csv = generateTemplateCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele_clients.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-colors",
          dragOver
            ? "border-gold-deep bg-gold-light/20"
            : selectedFile
              ? "border-gold-light bg-cream"
              : "border-cream-darker bg-cream/50 hover:border-gold-light hover:bg-cream"
        )}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) accept(file);
          }}
        />

        {selectedFile ? (
          <>
            <div className="bg-gold-light/50 rounded-full p-4">
              <FileText className="text-gold-deep size-8" />
            </div>
            <div className="text-center">
              <p className="font-semibold">{selectedFile.name}</p>
              <p className="text-text-secondary mt-1 text-sm">
                {(selectedFile.size / 1024).toFixed(0)} Ko
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
            >
              <X className="size-4" />
              Changer de fichier
            </Button>
          </>
        ) : (
          <>
            <div className="bg-cream-darker rounded-full p-4">
              <Upload className="text-text-secondary size-8" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Glissez votre fichier ici</p>
              <p className="text-text-secondary mt-1 text-sm">
                ou cliquez pour parcourir
              </p>
              <p className="text-text-secondary mt-2 text-xs">
                CSV, XLS, XLSX · max 5 000 lignes · 10 Mo
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-secondary">Télécharger un modèle :</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-gold-deep hover:text-gold-darker h-7 gap-1 px-2"
          onClick={downloadTemplate}
        >
          <Download className="size-3.5" />
          CSV
        </Button>
      </div>
    </div>
  );
}
