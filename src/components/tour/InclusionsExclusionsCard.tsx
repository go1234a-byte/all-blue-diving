import { Check, ClipboardList, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface InclusionsExclusionsCardProps {
  inclusions: string[];
  exclusions: string[];
}

export function InclusionsExclusionsCard({ inclusions, exclusions }: InclusionsExclusionsCardProps) {
  return (
    <Card className="border-2 border-primary/40">
      <CardContent className="space-y-4 p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <ClipboardList className="h-4 w-4 text-primary" />
          포함 및 불포함 사항
        </h3>
        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
          <div className="space-y-2 border-b border-primary/30 pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">포함</p>
            <ul className="space-y-1.5">
              {inclusions.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">불포함</p>
            <ul className="space-y-1.5">
              {exclusions.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
