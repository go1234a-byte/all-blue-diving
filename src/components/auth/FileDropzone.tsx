import { useRef, useState } from "react";
import { UploadCloud, FileCheck2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  label: string;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  onFilesChange: (files: File[]) => void;
}

export function FileDropzone({
  label,
  multiple = false,
  maxFiles = 1,
  accept,
  onFilesChange,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const applyFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = multiple
      ? [...files, ...Array.from(incoming)].slice(0, maxFiles)
      : Array.from(incoming).slice(0, 1);
    setFiles(next);
    onFilesChange(next);
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesChange(next);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          applyFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          dragActive ? "border-primary bg-secondary" : "border-input bg-background hover:bg-secondary/50",
        )}
      >
        <UploadCloud className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          클릭하거나 파일을 끌어다 놓으세요{multiple ? ` (최대 ${maxFiles}장)` : ""}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => applyFiles(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md bg-secondary px-3 py-1.5 text-xs"
            >
              <span className="flex items-center gap-1.5 truncate text-secondary-foreground">
                <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-success" />
                <span className="truncate">{file.name}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
