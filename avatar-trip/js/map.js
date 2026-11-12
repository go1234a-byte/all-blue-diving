/* 지도: Google Maps API 키를 넣으면 구글 지도, 없으면 OpenStreetMap(Leaflet) */
window.TripMap = (() => {
  let gmapsPromise = null;

  function loadGoogle(key) {
    if (window.google?.maps) return Promise.resolve();
    if (gmapsPromise) return gmapsPromise;
    gmapsPromise = new Promise((resolve, reject) => {
      window.__dnyGmapsReady = () => resolve();
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=ko&callback=__dnyGmapsReady`;
      s.async = true;
      s.onerror = () => reject(new Error('Google Maps 스크립트를 불러오지 못했어요'));
      document.head.appendChild(s);
      setTimeout(() => reject(new Error('Google Maps 응답 없음')), 10000);
    });
    return gmapsPromise;
  }

  const TYPE_COLOR = { food: '#e0533d', cafe: '#a0703c', sight: '#0f8f86', shop: '#8a56c9', hotel: '#2f3d55', airport: '#5b6a80' };

  class LeafletMap {
    constructor(el) {
      this.el = el;
      this.map = L.map(el, { zoomControl: true, attributionControl: true }).setView([35, 135], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(this.map);
      this.layer = L.layerGroup().addTo(this.map);
      this.avatar = null;
    }
    onClick(fn) { this.map.on('click', e => fn({ lat: e.latlng.lat, lng: e.latlng.lng })); }
    setPlaces(places, route) {
      this.layer.clearLayers();
      if (route && route.length > 1) {
        L.polyline(route.map(p => [p.lat, p.lng]), { color: '#0f8f86', weight: 4, opacity: 0.7, dashArray: '6 8' }).addTo(this.layer);
      }
      places.forEach(p => {
        const icon = L.divIcon({
          className: 'pin',
          html: `<span style="background:${TYPE_COLOR[p.type] || '#0f8f86'}">${p.label}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        L.marker([p.lat, p.lng], { icon, title: p.name }).bindTooltip(p.name).addTo(this.layer);
      });
      this.bounds = places.map(p => [p.lat, p.lng]);
    }
    fit() {
      if (this.bounds && this.bounds.length) this.map.fitBounds(this.bounds, { padding: [30, 30], maxZoom: 15 });
    }
    setAvatar(pos, color) {
      if (!pos) return;
      if (!this.avatar) {
        const icon = L.divIcon({ className: 'avatar-pin', html: `<span style="--c:${color}"></span>`, iconSize: [26, 26], iconAnchor: [13, 13] });
        this.avatar = L.marker([pos.lat, pos.lng], { icon, zIndexOffset: 1000 }).addTo(this.map);
      } else {
        this.avatar.setLatLng([pos.lat, pos.lng]);
      }
    }
    follow(pos) { if (pos) this.map.panTo([pos.lat, pos.lng], { animate: true }); }
    resize() { this.map.invalidateSize(); }
  }

  class GoogleMap {
    constructor(el) {
      this.map = new google.maps.Map(el, { center: { lat: 35, lng: 135 }, zoom: 12, mapTypeControl: false, streetViewControl: true, fullscreenControl: false });
      this.items = [];
      this.avatar = null;
    }
    onClick(fn) { this.map.addListener('click', e => fn({ lat: e.latLng.lat(), lng: e.latLng.lng() })); }
    setPlaces(places, route) {
      this.items.forEach(i => i.setMap(null));
      this.items = [];
      if (route && route.length > 1) {
        this.items.push(new google.maps.Polyline({ path: route, strokeColor: '#0f8f86', strokeOpacity: 0.8, strokeWeight: 4, map: this.map }));
      }
      places.forEach(p => {
        this.items.push(new google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map: this.map,
          title: p.name,
          label: { text: String(p.label), color: '#fff', fontWeight: '700' },
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 13, fillColor: TYPE_COLOR[p.type] || '#0f8f86', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }
        }));
      });
      this.bounds = places;
    }
    fit() {
      if (!this.bounds || !this.bounds.length) return;
      const b = new google.maps.LatLngBounds();
      this.bounds.forEach(p => b.extend(p));
      this.map.fitBounds(b, 40);
      if (this.bounds.length === 1) this.map.setZoom(15);
    }
    setAvatar(pos, color) {
      if (!pos) return;
      if (!this.avatar) {
        this.avatar = new google.maps.Marker({
          position: pos, map: this.map, zIndex: 999,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 4 }
        });
      } else this.avatar.setPosition(pos);
    }
    follow(pos) { if (pos) this.map.panTo(pos); }
    resize() { if (this.bounds) this.fit(); }
  }

  class NoMap {
    constructor(el) {
      el.innerHTML = '<div class="map-off">지도를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.<br>아래 Google 지도 링크는 그대로 쓸 수 있어요.</div>';
    }
    onClick() {}
    setPlaces() {}
    fit() {}
    setAvatar() {}
    follow() {}
    resize() {}
  }

  async function create(el, googleKey) {
    if (googleKey) {
      try {
        await loadGoogle(googleKey);
        return { map: new GoogleMap(el), provider: 'google' };
      } catch (e) {
        console.warn(e);
      }
    }
    if (window.L) return { map: new LeafletMap(el), provider: 'osm' };
    return { map: new NoMap(el), provider: 'none' };
  }

  const gmapsSearch = (name, city) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + (city ? ' ' + city : ''))}`;
  const gmapsPoint = p => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
  const gmapsDir = (a, b, mode) => `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}&travelmode=${mode === 'walk' ? 'walking' : 'transit'}`;
  const streetView = p => `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat},${p.lng}`;

  return { create, gmapsSearch, gmapsPoint, gmapsDir, streetView };
})();
