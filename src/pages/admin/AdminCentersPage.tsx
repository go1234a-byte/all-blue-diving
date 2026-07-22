import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";

const AdminCentersPage = () => {
  const { centers } = useAppData();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {centers.map((center) => (
        <Card key={center.id} className="accent-top-ocean">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{center.name}</p>
              <Badge variant="default" className="shrink-0 text-[10px]">승인됨</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{center.country ?? "-"}</p>
            <p className="text-xs text-muted-foreground">{center.address}</p>
            {center.features.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {center.features.map((f) => (
                  <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {centers.length === 0 && (
        <p className="col-span-full py-10 text-center text-sm text-muted-foreground">등록된 센터가 없습니다.</p>
      )}
    </div>
  );
};

export default AdminCentersPage;
