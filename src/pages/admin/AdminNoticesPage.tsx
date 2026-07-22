import { useState } from "react";
import { Pin, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";
import { NOTICE_CATEGORIES, type NoticeCategory } from "@/types";

const AdminNoticesPage = () => {
  const { notices, addNotice, deleteNotice } = useAppData();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoticeCategory>("일반");
  const [pinned, setPinned] = useState(false);

  const sorted = [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    addNotice({ title: title.trim(), content: content.trim(), category, pinned });
    setTitle("");
    setContent("");
    setCategory("일반");
    setPinned(false);
  };

  return (
    <div className="space-y-4">
      <Card className="accent-top-ocean">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold text-foreground">새 공지사항 등록</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>제목</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="공지 제목" />
            </div>
            <div className="space-y-1.5">
              <Label>카테고리</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as NoticeCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTICE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>내용</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="공지 내용" rows={3} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="pinned" checked={pinned} onCheckedChange={(v) => setPinned(!!v)} />
            <Label htmlFor="pinned" className="cursor-pointer text-xs font-normal">
              상단 고정
            </Label>
          </div>
          <Button size="sm" className="gap-1.5" onClick={handleSubmit}>
            <Plus className="h-3.5 w-3.5" />
            공지 등록
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {sorted.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">등록된 공지사항이 없습니다.</p>
        )}
        {sorted.map((notice) => (
          <Card key={notice.id}>
            <CardContent className="space-y-1.5 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {notice.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                  <p className="text-sm font-semibold text-foreground">{notice.title}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-destructive"
                  onClick={() => deleteNotice(notice.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Badge variant="secondary" className="text-[10px]">
                  {notice.category}
                </Badge>
                <span>{formatDateKR(notice.createdAt)}</span>
              </div>
              <p className="break-keep text-xs text-muted-foreground">{notice.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminNoticesPage;
