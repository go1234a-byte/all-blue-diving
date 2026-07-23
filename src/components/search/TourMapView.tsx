import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getSiteCoordinate } from "@/lib/siteCoordinates";
import { applyPlatformFee, formatKRW } from "@/lib/pricing";
import type { Tour } from "@/types";

interface TourMapViewProps {
  tours: Tour[];
}

interface SiteGroup {
  key: string;
  country: string;
  site: string;
  lat: number;
  lng: number;
  tours: Tour[];
}

/** 개수를 표시하는 원형 마커 아이콘(외부 이미지 에셋 없이 divIcon으로 렌더링). */
function createCountIcon(count: number) {
  return L.divIcon({
    className: "",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:34px;height:34px;border-radius:9999px;
      background:hsl(199 89% 42%);color:white;
      font-size:13px;font-weight:700;
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);
    ">${count}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

/** 검색 결과를 다이브 사이트 위치 기준 지도로 보여준다(사이트 좌표는 대표 좌표 사용). */
export function TourMapView({ tours }: TourMapViewProps) {
  const groups = useMemo<SiteGroup[]>(() => {
    const map = new Map<string, SiteGroup>();
    for (const tour of tours) {
      const coord = getSiteCoordinate(tour.country, tour.site);
      if (!coord) continue;
      const key = `${tour.country}-${tour.site}`;
      const existing = map.get(key);
      if (existing) {
        existing.tours.push(tour);
      } else {
        map.set(key, { key, country: tour.country, site: tour.site, lat: coord.lat, lng: coord.lng, tours: [tour] });
      }
    }
    return Array.from(map.values());
  }, [tours]);

  if (groups.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        지도에 표시할 투어가 없습니다.
      </div>
    );
  }

  const center: [number, number] = [groups[0].lat, groups[0].lng];

  return (
    <div className="h-[420px] overflow-hidden rounded-xl border border-border">
      <MapContainer center={center} zoom={3} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {groups.map((group) => (
          <Marker key={group.key} position={[group.lat, group.lng]} icon={createCountIcon(group.tours.length)}>
            <Popup>
              <div className="min-w-[180px] space-y-1.5">
                <p className="text-sm font-semibold">
                  {group.country} · {group.site}
                </p>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {group.tours.map((tour) => (
                    <Link
                      key={tour.id}
                      to={`/tour/${tour.id}`}
                      className="block rounded-md px-1.5 py-1 text-xs text-foreground hover:bg-secondary"
                    >
                      <span className="line-clamp-1 font-medium">{tour.title}</span>
                      <span className="text-[11px] text-muted-foreground">{formatKRW(applyPlatformFee(tour.basePrice))}~</span>
                    </Link>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
