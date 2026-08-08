import { useEffect, useRef, useState } from "react";
import { UploadCloud, FileCheck2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FileDropzoneProps {
  label: string;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  /** 파일 1개당 허용 최대 용량(MB). 기본 10MB. */
  maxSizeMB?: number;
  onFilesChange: (files: File[]) => void;
}

/** accept 문자열(".pdf,.jpg,.png" 또는 "image/*" 등)을 기준으로 파일 하나가 허용되는지 검사한다.
 *  드래그 앤 드롭은 브라우저의 파일 선택창(accept 속성)이 적용되지 않기 때문에,
 *  드롭/선택 어느 경로로 들어오든 여기서 동일하게 형식을 걸러낸다. */
function isFileTypeAllowed(file: File, accept?: string): boolean {
  if (!accept) return true;
  const tokens = accept.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (tokens.length === 0) return true;
  const fileName = file.name.toLowerCase();
  const fileType = (file.type || "").toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith(".")) return fileName.endsWith(token);
    if (token.endsWith("/*")) return fileType.startsWith(token.slice(0, -1));
    return fileType === token;
  });
}

export function FileDropzone({
  label,
  multiple = false,
  maxFiles = 1,
  accept,
  maxSizeMB = 10,
  onFilesChange,
}: FileDropzoneProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  // 이미지 파일은 파일명 텍스트만으로는 어떤 사진이 올라갔는지 알기 어려우므로,
  // 실제 이미지 미리보기(썸네일)를 함께 보여준다. 메모리 누수 방지를 위해 목록이 바뀔 때마다 정리한다.
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => (file.type.startsWith("image/") ? URL.createObjectURL(file) : ""));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [files]);

  const applyFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const maxBytes = maxSizeMB * 1024 * 1024;
    const accepted: File[] = [];
    const rejectedReasons: string[] = [];
    for (const file of Array.from(incoming)) {
      if (!isFileTypeAllowed(file, accept)) {
        rejectedReasons.push(`${file.name} — 지원하지 않는 파일 형식입니다`);
        continue;
      }
      if (file.size > maxBytes) {
        rejectedReasons.push(`${file.name} — 파일 용량이 ${maxSizeMB}MB를 초과합니다`);
        continue;
      }
      accepted.push(file);
    }
    if (rejectedReasons.length > 0) {
      toast({
        title: "일부 파일을 추가할 수 없습니다",
        description: rejectedReasons.join(" / "),
        variant: "destructive",
      });
    }
    if (accepted.length === 0) return;
    const next = multiple ? [...files, ...accepted].slice(0, maxFiles) : accepted.slice(0, 1);
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
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          dragActive ? "border-primary bg-secondary" : "border-input bg-background hover:bg-secondary/50",
        )}
      >
        <UploadCloud className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          클릭하거나 파일을 끌어다 놓으세요{multiple ? ` (최대 ${maxFiles}장)` : ""}
        </p>
        {/* 예전에는 input을 className="hidden"(display:none)으로 숨기고 바깥 div의
            onClick에서 inputRef.current?.click()을 호출해 파일 선택창을 여는 방식이었다.
            아이폰 Chrome(iOS 웹킷 기반)에서는 display:none인 input에 대해 이렇게 JS로
            간접 호출한 click()이 파일 선택 시트를 아예 띄우지 못하는 경우가 있어 —
            사용자 입장에서는 버튼을 눌러도 아무 반응이 없어 보이고 업로드 자체가 불가능한
            문제로 이어졌다. input을 display:none 대신 opacity:0으로 처리하고 드롭존
            영역 전체를 덮도록 배치해서, 브라우저가 탭/클릭을 input에 직접 전달하도록
            바꿨다 — 이러면 iOS를 포함한 모든 브라우저에서 네이티브 동작 그대로 안정적으로
            파일 선택창이 열린다. */}
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          aria-label={label}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
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
                {previewUrls[index] ? (
                  <img
                    src={previewUrls[index]}
                    alt={file.name}
                    className="h-8 w-8 shrink-0 rounded object-cover"
                  />
                ) : (
                  <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-success" />
                )}
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
