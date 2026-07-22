import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import type { ProfileStatus } from "@/types";

const STATUS_LABEL: Record<ProfileStatus, string> = {
  active: "정상",
  warned: "경고",
  suspended: "활동정지",
};

const STATUS_VARIANT: Record<ProfileStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  warned: "secondary",
  suspended: "destructive",
};

export function UserTable() {
  const { diverProfiles, instructorProfiles, setProfileStatus } = useAppData();
  const allUsers = [...instructorProfiles, ...diverProfiles];

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>역할</TableHead>
            <TableHead>연락처</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.role === "instructor" ? "강사" : "다이버"}</TableCell>
              <TableCell className="text-muted-foreground">{user.phone}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[user.status]}>{STATUS_LABEL[user.status]}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProfileStatus(user.id, "warned")}
                    disabled={user.status === "warned"}
                  >
                    회원 경고
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setProfileStatus(user.id, "suspended")}
                    disabled={user.status === "suspended"}
                  >
                    활동 정지
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
