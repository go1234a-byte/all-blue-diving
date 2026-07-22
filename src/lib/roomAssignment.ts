import type { Booking } from "@/types";

export interface RoomAssignment {
  roomNo: string;
  occupants: Booking[];
}

/**
 * 성별 우선 그룹핑 후, 코골이/흡연/음주 선호가 비슷한 인원끼리 매칭하여 방 배정.
 * 방당 최대 2인 기준 데모 알고리즘.
 */
export function assignRooms(bookings: Booking[]): RoomAssignment[] {
  const genders: Booking["gender"][] = ["male", "female"];
  const rooms: RoomAssignment[] = [];
  let roomCounter = 1;

  for (const gender of genders) {
    const pool = bookings
      .filter((b) => b.gender === gender && b.status === "confirmed")
      .sort((a, b) => {
        // 흡연/코골이/음주 여부가 같은 사람끼리 정렬되도록 그룹핑
        const keyA = `${a.smoking ? 1 : 0}${a.snoring ? 1 : 0}${a.drinking ? 1 : 0}`;
        const keyB = `${b.smoking ? 1 : 0}${b.snoring ? 1 : 0}${b.drinking ? 1 : 0}`;
        return keyA.localeCompare(keyB);
      });

    for (let i = 0; i < pool.length; i += 2) {
      const occupants = pool.slice(i, i + 2);
      const roomNo = `${gender === "male" ? "M" : "W"}-${String(roomCounter).padStart(2, "0")}`;
      roomCounter += 1;
      rooms.push({ roomNo, occupants });
    }
  }

  return rooms;
}
