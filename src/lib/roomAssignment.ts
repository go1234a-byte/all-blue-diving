import type { Booking, Gender } from "@/types";

/**
 * 방 배정 화면에서 실제로 "방 하나에 들어가는 사람 한 명"을 나타내는 단위.
 * 예약 1건(Booking)이 본인 1명일 수도, 본인+동반자 여러 명일 수도 있어서
 * (참가자 수만큼 참가자 정보를 입력하는 기능 도입 이후) 방 배정은 예약 단위가
 * 아니라 이 "occupant" 단위로 계산해야 실제 인원수/개인별 선호(코골이 등)가
 * 정확히 반영된다.
 */
export interface RoomOccupant {
  /** React key 등에 쓰는 고유 식별자. 본인은 예약 id, 동반자는 "예약id:동반자순번". */
  key: string;
  bookingId: string;
  /** null이면 예약자 본인, 숫자면 companions 배열의 인덱스(해당 동반자). */
  companionIndex: number | null;
  name: string;
  gender: Gender;
  snoring: boolean;
  smoking: boolean;
  drinking: boolean;
  roomNote?: string;
  roomNo?: string;
}

export interface RoomAssignment {
  roomNo: string;
  occupants: RoomOccupant[];
}

/** 방 하나의 최대 인원 (데모 알고리즘 기준 2인 1실). */
const ROOM_CAPACITY = 2;

/**
 * bookings 배열(예약 단위)을 방 배정에 쓸 occupant 배열(사람 단위)로 펼친다.
 * 예약자 본인 + companions 배열의 동반자 각각을 별도 occupant로 만든다.
 */
export function flattenBookingsToOccupants(bookings: Booking[]): RoomOccupant[] {
  const occupants: RoomOccupant[] = [];

  bookings.forEach((b) => {
    occupants.push({
      key: b.id,
      bookingId: b.id,
      companionIndex: null,
      name: b.diverName,
      gender: b.gender,
      snoring: b.snoring,
      smoking: b.smoking,
      drinking: b.drinking,
      roomNote: b.roomNote,
      roomNo: b.roomNo,
    });

    (b.companions ?? []).forEach((c, idx) => {
      occupants.push({
        key: `${b.id}:${idx}`,
        bookingId: b.id,
        companionIndex: idx,
        name: c.name?.trim() || `동반자 ${idx + 1}`,
        // 동반자 성별을 입력 안 했으면(구버전 데이터 등) 예약자 본인 성별로 대체.
        gender: c.gender ?? b.gender,
        snoring: !!c.snoring,
        smoking: !!c.smoking,
        drinking: !!c.drinking,
        roomNote: c.roomNote,
        roomNo: c.roomNo,
      });
    });
  });

  return occupants;
}

/**
 * 성별 우선 그룹핑 후, 같은 예약(동반자 그룹)은 최대한 한 방에 묶고, 코골이/흡연/음주
 * 선호가 비슷한 그룹끼리 이어서 배정. 방당 최대 2인 기준 데모 알고리즘.
 */
export function assignRooms(occupants: RoomOccupant[]): RoomAssignment[] {
  const genders: Gender[] = ["male", "female"];
  const rooms: RoomAssignment[] = [];
  let roomCounter = 1;

  const prefKey = (o: RoomOccupant) => `${o.smoking ? 1 : 0}${o.snoring ? 1 : 0}${o.drinking ? 1 : 0}`;

  for (const gender of genders) {
    const pool = occupants.filter((o) => o.gender === gender);

    // 같은 예약(=같이 온 일행)끼리 먼저 묶는다 — 동반자는 특별한 사정이 없는 한
    // 같은 방을 쓰고 싶어할 것이므로 그룹을 쪼개지 않는 게 우선.
    const groupsMap = new Map<string, RoomOccupant[]>();
    pool.forEach((o) => {
      if (!groupsMap.has(o.bookingId)) groupsMap.set(o.bookingId, []);
      groupsMap.get(o.bookingId)!.push(o);
    });
    const groups = Array.from(groupsMap.values()).sort((a, b) =>
      prefKey(a[0]).localeCompare(prefKey(b[0])),
    );

    let current: RoomOccupant[] = [];
    const flush = () => {
      if (current.length === 0) return;
      const roomNo = `${gender === "male" ? "M" : "W"}-${String(roomCounter).padStart(2, "0")}`;
      roomCounter += 1;
      rooms.push({ roomNo, occupants: current });
      current = [];
    };

    for (const group of groups) {
      for (const member of group) {
        if (current.length >= ROOM_CAPACITY) flush();
        current.push(member);
      }
    }
    flush();
  }

  return rooms;
}
