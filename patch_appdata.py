import pathlib
p = pathlib.Path("src/contexts/AppDataContext.tsx")
text = p.read_text(encoding="utf-8")

# 1) UpdateTourInput 타입을 NewTourInput 뒤에 추가
anchor1 = """  itineraryDays: TourItineraryDay[];
}

interface NewCenterInput {"""
assert anchor1 in text, "anchor1 not found"
replacement1 = """  itineraryDays: TourItineraryDay[];
}

/** 강사가 기존 투어를 수정할 때 사용하는 부분 업데이트 입력. 지정한 필드만 갱신한다. */
interface UpdateTourInput {
  centerId?: string;
  title?: string;
  country?: string;
  site?: string;
  activityTypes?: Tour["activityTypes"];
  certificationLevel?: Tour["certificationLevel"];
  mainImageUrl?: string;
  galleryUrls?: string[];
  startDate?: string;
  endDate?: string;
  recruitmentDeadline?: string;
  basePrice?: number;
  maxParticipants?: number;
  minParticipants?: number;
  description?: string;
  inclusions?: string[];
  exclusions?: string[];
  prepNotes?: string;
  customOptions?: TourOption[];
  meetingPoint?: string;
  meetingTime?: string;
  itineraryDays?: TourItineraryDay[];
}

interface NewCenterInput {"""
text = text.replace(anchor1, replacement1, 1)

# 2) 컨텍스트 타입 인터페이스에 updateTour 시그니처 추가
anchor2 = "  updateTourMeetingInfo: (tourId: string, meetingPoint: string, meetingTime: string) => Promise<void>;"
assert anchor2 in text, "anchor2 not found"
text = text.replace(
    anchor2,
    anchor2 + "\n  updateTour: (tourId: string, patch: UpdateTourInput) => Promise<void>;",
    1,
)

# 3) 실제 updateTour 함수 구현 추가 (updateTourMeetingInfo 함수 바로 뒤)
anchor3 = '''  const updateTourMeetingInfo = async (tourId: string, meetingPoint: string, meetingTime: string) => {
    setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, meetingPoint, meetingTime } : t)));
    await supabase.from("tours").update({ meeting_point: meetingPoint, meeting_time: meetingTime }).eq("id", tourId);
  };'''
assert anchor3 in text, "anchor3 not found"
new_fn = '''

  /**
   * 강사 본인 — 이미 등록한 투어의 세부 정보를 수정한다. patch에 담긴 필드만 갱신하며,
   * 예약이 있는 투어는 가격/날짜/인원 같은 핵심 조건을 호출부(TourEditForm)에서 아예
   * 잠가두고 항상 기존 값을 그대로 다시 보내도록 되어있다.
   */
  const updateTour = async (tourId: string, patch: UpdateTourInput) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.centerId !== undefined) dbPatch.center_id = patch.centerId;
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.country !== undefined) dbPatch.country = patch.country;
    if (patch.site !== undefined) dbPatch.site = patch.site;
    if (patch.activityTypes !== undefined) dbPatch.activity_types = patch.activityTypes;
    if (patch.certificationLevel !== undefined) dbPatch.certification_level = patch.certificationLevel;
    if (patch.mainImageUrl !== undefined) dbPatch.main_image_url = patch.mainImageUrl;
    if (patch.galleryUrls !== undefined) dbPatch.gallery_urls = patch.galleryUrls;
    if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate;
    if (patch.endDate !== undefined) dbPatch.end_date = patch.endDate;
    if (patch.recruitmentDeadline !== undefined) dbPatch.recruitment_deadline = patch.recruitmentDeadline;
    if (patch.basePrice !== undefined) dbPatch.base_price = patch.basePrice;
    if (patch.maxParticipants !== undefined) dbPatch.max_participants = patch.maxParticipants;
    if (patch.minParticipants !== undefined) dbPatch.min_participants = patch.minParticipants;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.inclusions !== undefined) dbPatch.inclusions = patch.inclusions;
    if (patch.exclusions !== undefined) dbPatch.exclusions = patch.exclusions;
    if (patch.prepNotes !== undefined) dbPatch.prep_notes = patch.prepNotes;
    if (patch.customOptions !== undefined) dbPatch.custom_options = patch.customOptions;
    if (patch.meetingPoint !== undefined) dbPatch.meeting_point = patch.meetingPoint;
    if (patch.meetingTime !== undefined) dbPatch.meeting_time = patch.meetingTime;
    if (patch.itineraryDays !== undefined) dbPatch.itinerary_days = patch.itineraryDays;

    const { error } = await supabase.from("tours").update(dbPatch as never).eq("id", tourId);
    if (error) throw error;

    setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, ...patch } : t)));
  };'''
text = text.replace(anchor3, anchor3 + new_fn, 1)

# 4) Provider가 실제로 내려주는 value 객체에 updateTour 추가
anchor4 = "      updateTourMeetingInfo,"
assert anchor4 in text, "anchor4 not found"
text = text.replace(anchor4, anchor4 + "\n      updateTour,", 1)

p.write_text(text, encoding="utf-8")
print("OK: AppDataContext.tsx patched")
