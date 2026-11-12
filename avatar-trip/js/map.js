/* 지도
 * 기본: MapLibre + OpenFreeMap 벡터 지도 (3D 건물, 기울이기), 위성 사진은 Esri World Imagery
 * 설정에 Google Maps 키가 있으면: Google 벡터 지도 (기울이기·회전, 위성 하이브리드)
 * 공통 인터페이스
 *   setPlaces(places)            번호 핀
 *   setRoutes(lines)             [{coords:[[lng,lat]...], mode:'walk'|'train'|'flight'}]
 *   addMarker(el, pos) → {set(pos), remove()}
 *   camera({center, zoom, pitch, bearing}, ms)
 *   fit(points), setSatellite(bool), onClick(fn), onUserMove(fn), resize()
 */
window.TripMap = (() => {
  const TYPE_COLOR = { food: '#ea4335', cafe: '#a0703c', sight: '#0f8f86', shop: '#8a56c9', hotel: '#3b4a6b', airport: '#5b6a80' };
  const ROUTE_STYLE = { walk: '#1a73e8', train: '#8a56c9', flight: '#5b6a80' };
  const OSM_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
  const SAT_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  function pinEl(p) {
    const el = document.createElement('div');
    el.className = 'gpin';
    el.innerHTML = `<span class="gpin-head" style="--c:${TYPE_COLOR[p.type] || '#ea4335'}"><b>${p.label}</b></span><span class="gpin-name">${String(p.name).replace(/[<>&]/g, '')}</span>`;
    el.title = p.name;
    return el;
  }

  /* ---------- MapLibre ---------- */
  class MLMap {
    constructor(el, opts) {
      this.el = el;
      this.opts = opts;
      this.pins = [];
      this.userMoveFns = [];
      this.map = new maplibregl.Map({
        container: el,
        style: OSM_STYLE,
        center: [opts.center.lng, opts.center.lat],
        zoom: opts.zoom || 13,
        pitch: opts.pitch || 0,
        maxPitch: 80,
        attributionControl: { compact: true, customAttribution: 'Satellite © Esri, Maxar, Earthstar Geographics' },
        localIdeographFontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'
      });
      this.map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      this.ready = new Promise(resolve => {
        let done = false;
        const finish = ok => { if (!done) { done = true; this.ok = ok; resolve(ok); } };
        this.map.on('load', () => { this.setup(); finish(true); });
        this.map.on('error', e => {
          if (!this.ok && /style|Failed to fetch|NetworkError/i.test(String(e?.error?.message || e?.error || ''))) {
            this.fallback();
          }
        });
        setTimeout(() => { if (!done) { this.fallback(); } }, 9000);
        this.finish = finish;
      });
      ['dragstart', 'rotatestart', 'pitchstart', 'zoomstart'].forEach(ev =>
        this.map.on(ev, e => { if (e.originalEvent) this.userMoveFns.forEach(f => f()); }));
    }
    fallback() {
      if (this.fellBack) return;
      this.fellBack = true;
      // 벡터 지도를 못 받으면 위성 사진만으로
      this.map.setStyle({
        version: 8,
        sources: { sat: { type: 'raster', tiles: [SAT_TILES], tileSize: 256, maxzoom: 19 } },
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#dfe6e9' } }, { id: 'sat', type: 'raster', source: 'sat' }]
      });
      this.map.once('styledata', () => { this.setup(); this.finish(true); });
    }
    setup() {
      const m = this.map;
      const layers = m.getStyle().layers || [];
      const firstSymbol = layers.find(l => l.type === 'symbol')?.id;
      // 한국어 이름 우선
      layers.filter(l => l.type === 'symbol' && l.layout && l.layout['text-field']).forEach(l => {
        try { m.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get', 'name:ko'], ['get', 'name']]); } catch { /* */ }
      });
      if (!m.getSource('sat')) {
        m.addSource('sat', { type: 'raster', tiles: [SAT_TILES], tileSize: 256, maxzoom: 19, attribution: '© Esri' });
        m.addLayer({ id: 'sat', type: 'raster', source: 'sat', layout: { visibility: 'none' } }, firstSymbol);
      }
      m.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'route-casing', type: 'line', source: 'routes', filter: ['==', ['get', 'mode'], 'walk'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#0b4fb3', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 4, 18, 12], 'line-opacity': 0.9 } }, firstSymbol);
      m.addLayer({ id: 'route-walk', type: 'line', source: 'routes', filter: ['==', ['get', 'mode'], 'walk'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ROUTE_STYLE.walk, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 2.5, 18, 8] } }, firstSymbol);
      m.addLayer({ id: 'route-other', type: 'line', source: 'routes', filter: ['!=', ['get', 'mode'], 'walk'], layout: { 'line-cap': 'round' }, paint: { 'line-color': ['match', ['get', 'mode'], 'train', ROUTE_STYLE.train, ROUTE_STYLE.flight], 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 18, 7], 'line-dasharray': [1.5, 1.2] } }, firstSymbol);
      if (this.pendingRoutes) this.setRoutes(this.pendingRoutes);
      if (this.sat) this.setSatellite(true);
    }
    setPlaces(places) {
      this.pins.forEach(p => p.remove());
      this.pins = places.map(p => new maplibregl.Marker({ element: pinEl(p), anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(this.map));
      this.points = places;
    }
    setRoutes(lines) {
      this.pendingRoutes = lines;
      const src = this.map.getSource && this.map.getSource('routes');
      if (!src) return;
      src.setData({ type: 'FeatureCollection', features: lines.map(l => ({ type: 'Feature', properties: { mode: l.mode }, geometry: { type: 'LineString', coordinates: l.coords } })) });
    }
    addMarker(el, pos, opts = {}) {
      const mk = new maplibregl.Marker({ element: el, anchor: opts.anchor || 'bottom', pitchAlignment: 'viewport', rotationAlignment: 'viewport' }).setLngLat([pos.lng, pos.lat]).addTo(this.map);
      return { set: p => mk.setLngLat([p.lng, p.lat]), remove: () => mk.remove(), el };
    }
    camera(c, ms) {
      const o = {};
      if (c.center) o.center = [c.center.lng, c.center.lat];
      if (c.zoom != null) o.zoom = c.zoom;
      if (c.pitch != null) o.pitch = c.pitch;
      if (c.bearing != null) o.bearing = c.bearing;
      if (ms) this.map.easeTo({ ...o, duration: ms, essential: true });
      else this.map.jumpTo(o);
    }
    getBearing() { return this.map.getBearing(); }
    fit(points) {
      const pts = points || this.points || [];
      if (!pts.length) return;
      const b = new maplibregl.LngLatBounds();
      pts.forEach(p => b.extend([p.lng, p.lat]));
      this.map.fitBounds(b, { padding: { top: 70, bottom: 50, left: 60, right: 60 }, maxZoom: 16, duration: 0, pitch: this.opts.pitch || 0 });
    }
    setSatellite(on) {
      this.sat = on;
      if (!this.map.getLayer || !this.map.getLayer('sat')) return;
      this.map.setLayoutProperty('sat', 'visibility', on ? 'visible' : 'none');
      (this.map.getStyle().layers || []).forEach(l => {
        if (l.type === 'fill-extrusion') this.map.setLayoutProperty(l.id, 'visibility', on ? 'none' : 'visible');
      });
    }
    setSky(top, horizon) {
      try {
        this.map.setSky({ 'sky-color': top, 'horizon-color': horizon, 'fog-color': horizon, 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.6, 'fog-ground-blend': 0.4 });
      } catch { /* 하늘 미지원 */ }
    }
    onClick(fn) { this.map.on('click', e => fn({ lat: e.lngLat.lat, lng: e.lngLat.lng })); }
    onUserMove(fn) { this.userMoveFns.push(fn); }
    resize() { this.map.resize(); }
  }

  /* ---------- Google ---------- */
  let gPromise = null;
  function loadGoogle(key) {
    if (window.google?.maps?.marker) return Promise.resolve();
    if (gPromise) return gPromise;
    gPromise = new Promise((resolve, reject) => {
      window.__dnyG = () => resolve();
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=marker&language=ko&callback=__dnyG`;
      s.async = true;
      s.onerror = () => reject(new Error('Google Maps 스크립트를 불러오지 못했어요'));
      document.head.appendChild(s);
      setTimeout(() => reject(new Error('Google Maps 응답 없음')), 10000);
    });
    return gPromise;
  }

  class GMap {
    constructor(el, opts) {
      this.opts = opts;
      this.map = new google.maps.Map(el, {
        center: opts.center, zoom: opts.zoom || 13, mapId: 'DEMO_MAP_ID', tilt: opts.pitch || 0, heading: 0,
        renderingType: google.maps.RenderingType?.VECTOR, mapTypeControl: false, streetViewControl: true, fullscreenControl: false,
        gestureHandling: 'greedy'
      });
      this.pins = [];
      this.lines = [];
      this.userMoveFns = [];
      this.ready = Promise.resolve(true);
      this.map.addListener('dragstart', () => this.userMoveFns.forEach(f => f()));
    }
    setPlaces(places) {
      this.pins.forEach(p => (p.map = null));
      this.pins = places.map(p => new google.maps.marker.AdvancedMarkerElement({ map: this.map, position: { lat: p.lat, lng: p.lng }, content: pinEl(p), title: p.name }));
      this.points = places;
    }
    setRoutes(lines) {
      this.lines.forEach(l => l.setMap(null));
      this.lines = lines.map(l => new google.maps.Polyline({
        map: this.map,
        path: l.coords.map(([lng, lat]) => ({ lat, lng })),
        strokeColor: ROUTE_STYLE[l.mode] || ROUTE_STYLE.walk,
        strokeOpacity: l.mode === 'walk' ? 0.95 : 0,
        strokeWeight: l.mode === 'walk' ? 7 : 4,
        icons: l.mode === 'walk' ? [] : [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4, strokeColor: ROUTE_STYLE[l.mode] }, offset: '0', repeat: '16px' }]
      }));
    }
    addMarker(el, pos) {
      const mk = new google.maps.marker.AdvancedMarkerElement({ map: this.map, position: pos, content: el, zIndex: 1000 });
      return { set: p => (mk.position = p), remove: () => (mk.map = null), el };
    }
    camera(c, ms) {
      const o = {};
      if (c.center) o.center = c.center;
      if (c.zoom != null) o.zoom = c.zoom;
      if (c.pitch != null) o.tilt = c.pitch;
      if (c.bearing != null) o.heading = c.bearing;
      this.map.moveCamera(o);
    }
    getBearing() { return this.map.getHeading() || 0; }
    fit(points) {
      const pts = points || this.points || [];
      if (!pts.length) return;
      const b = new google.maps.LatLngBounds();
      pts.forEach(p => b.extend({ lat: p.lat, lng: p.lng }));
      this.map.fitBounds(b, 60);
    }
    setSatellite(on) { this.map.setMapTypeId(on ? 'hybrid' : 'roadmap'); }
    setSky() {}
    onClick(fn) { this.map.addListener('click', e => fn({ lat: e.latLng.lat(), lng: e.latLng.lng() })); }
    onUserMove(fn) { this.userMoveFns.push(fn); }
    resize() {}
  }

  class NoMap {
    constructor(el) {
      el.innerHTML = '<div class="map-off">지도를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</div>';
      this.ready = Promise.resolve(false);
    }
    setPlaces() {} setRoutes() {} fit() {} setSatellite() {} setSky() {} onClick() {} onUserMove() {} resize() {}
    addMarker(el) { return { set() {}, remove() {}, el }; }
    camera() {}
    getBearing() { return 0; }
  }

  async function create(el, opts) {
    if (opts.googleKey) {
      try {
        await loadGoogle(opts.googleKey);
        return { map: new GMap(el, opts), provider: 'google' };
      } catch (e) {
        console.warn(e);
      }
    }
    if (window.maplibregl) {
      try {
        return { map: new MLMap(el, opts), provider: 'osm' };
      } catch (e) {
        console.warn(e);
      }
    }
    return { map: new NoMap(el), provider: 'none' };
  }

  const gmapsSearch = (name, city) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + (city ? ' ' + city : ''))}`;
  const gmapsDir = (a, b, mode) => `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}&travelmode=${mode === 'walk' ? 'walking' : 'transit'}`;
  const streetView = p => `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat},${p.lng}`;

  return { create, gmapsSearch, gmapsDir, streetView };
})();
