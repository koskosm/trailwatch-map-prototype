/* TrailWatch map-first prototype */
(() => {
  const t = (k, v) => TWLang.t(k, v);
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    view: "map",
    chip: "foryou",
    exploreSub: "editorial",
    sheet: "peek", // peek | half | full
    communitySeg: "posts",
    communityFilter: "all",
    search: "",
    searchOpen: false,
    searchFilters: { district: "all", difficulty: "all", duration: "all", distance: "all" },
    searchRecent: [],
    communityQ: "",
    followTrailId: null,
    recordMode: "track", // track | plan
    recording: false,
    paused: false,
    recordIdx: 0,
    recordTimer: null,
    recordTick: 0,
    elevSamples: [],
    planPoints: [],
    planTool: "start",
    overlayMode: null,
    reportPhotos: [null, null, null],
    reportShowErrors: false,
  };

  let map, recordMap, trailDetailMap, trailExpandMap, reportLocMap;
  let pinLayer, liveLayer, userMarker, recordLine, recordMarker, planLine, planMarkers;
  let reportCameraStream = null;
  let trailMapItem = null;

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function icons() {
    if (typeof window.refreshIcons === "function") window.refreshIcons();
  }

  const INCIDENT_TYPES = {
    waste_dumping: { icon: "trash-2", tone: "amber" },
    tree_felling: { icon: "axe", tone: "red" },
    carcass: { icon: "skull", tone: "gray" },
    vandalism: { icon: "spray-can", tone: "purple" },
    suspicious: { icon: "shield-alert", tone: "blue" },
  };

  // Lucide UMD 0.468 exports PascalCase; a few kebab names differ from naive conversion
  const LUCIDE_EXPORT = {
    "trash-2": "Trash2",
    axe: "Axe",
    skull: "Skull",
    "spray-can": "SprayCan",
    "shield-alert": "ShieldAlert",
    "image-plus": "ImagePlus",
    locate: "Locate",
    camera: "Camera",
  };

  function incidentTypeMeta(type) {
    return INCIDENT_TYPES[type] || INCIDENT_TYPES.suspicious;
  }

  function lucideExportName(name) {
    if (LUCIDE_EXPORT[name]) return LUCIDE_EXPORT[name];
    return String(name)
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("");
  }

  /** Inline SVG so map pins / list badges stay in sync without createIcons timing. */
  function lucideIco(name, cls = "") {
    const key = lucideExportName(name);
    const icon = window.lucide && lucide[key];
    if (icon && typeof lucide.createElement === "function") {
      try {
        const el = lucide.createElement(icon, { "stroke-width": 1.75 });
        if (cls) el.setAttribute("class", cls);
        el.setAttribute("aria-hidden", "true");
        return el.outerHTML;
      } catch (_) {
        /* fall through */
      }
    }
    return `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
  }

  function chipBtn(label, active, attrs) {
    return `<button type="button" class="ios-chip ${active ? "ios-chip-active" : ""}" ${attrs || ""}>${label}</button>`;
  }

  function sheetTabBtn(label, active, attrs) {
    return `<button type="button" class="sheet-tab${active ? " is-active" : ""}" role="tab" aria-selected="${active ? "true" : "false"}" ${attrs || ""}>${label}</button>`;
  }

  function choiceBtn(label, active, attrs) {
    return `<button type="button" class="ios-chip ${active ? "ios-chip-active" : ""}" ${attrs || ""}>${label}</button>`;
  }

  function typeChipBtn(type, active) {
    const meta = incidentTypeMeta(type);
    return `<button type="button" class="ios-chip ios-chip-type type-tile type-${type} ${active ? "ios-chip-active" : ""}" data-type="${type}">
      <span class="type-tile-ico">${lucideIco(meta.icon)}</span>
      <span class="type-tile-label">${t("report_types." + type)}</span>
    </button>`;
  }

  function typeIconBadge(type, severity) {
    const meta = incidentTypeMeta(type);
    const high = severity === "high" ? " high" : "";
    return `<span class="type-ico type-${type}${high}" title="${esc(t("report_types." + type))}">${lucideIco(meta.icon)}</span>`;
  }

  function typeLabelBadge(type, severity) {
    const meta = incidentTypeMeta(type);
    const tone = severity === "high" ? "red" : meta.tone || "";
    return `<span class="ios-badge ${tone} ios-badge-type">${lucideIco(meta.icon)}${esc(t("report_types." + type))}</span>`;
  }

  function statCell(val, lbl) {
    return `<div class="stat-cell"><div class="val">${val}</div><div class="lbl">${lbl}</div></div>`;
  }

  function trailById(id) {
    return TWData.trails.find((x) => x.id === id);
  }

  function syntheticTrailPath(item) {
    const lat = item.lat;
    const lng = item.lng;
    const span = Math.max(0.014, (item.distanceKm || 5) * 0.0024);
    const pts = [];
    const n = 28;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const wobble = Math.sin(t * Math.PI * 3.2) * span * 0.12;
      pts.push([
        lat - span * 0.4 + span * 0.85 * t + wobble * 0.35,
        lng - span * 0.55 + span * 1.05 * t + wobble,
      ]);
    }
    return pts;
  }

  function trailPath(item) {
    if (!item) return TWData.recordPath.slice();
    if (item.path && item.path.length >= 2) return item.path.slice();
    return syntheticTrailPath(item);
  }

  async function ensureTrailPath(item) {
    if (!item) return TWData.recordPath.slice();
    if (item.path && item.path.length >= 2) return item.path;
    if (!item.pathUrl) {
      item.path = syntheticTrailPath(item);
      return item.path;
    }
    if (!item._pathPromise) {
      item._pathPromise = fetch(item.pathUrl)
        .then((r) => r.json())
        .then((data) => {
          item.path = (data.points || data).map((p) =>
            Array.isArray(p) ? p : [p.lat || p.latitude, p.lng || p.lon || p.longitude]
          );
          item.pathSource = data.source || item.sourceUrl || "";
          return item.path;
        })
        .catch(() => {
          item.path = syntheticTrailPath(item);
          return item.path;
        });
    }
    return item._pathPromise;
  }

  function destroyTrailDetailMap() {
    if (trailDetailMap) {
      trailDetailMap.remove();
      trailDetailMap = null;
    }
  }

  function destroyTrailExpandMap() {
    if (trailExpandMap) {
      trailExpandMap.remove();
      trailExpandMap = null;
    }
  }

  function paintRouteOnMap(mapInst, path, opts = {}) {
    const weight = opts.weight || 4;
    const line = L.polyline(path, {
      color: "#1a7f37",
      weight,
      opacity: 0.95,
      lineJoin: "round",
      lineCap: "round",
    }).addTo(mapInst);
    L.circleMarker(path[0], {
      radius: opts.radius || 6,
      color: "#fff",
      weight: 2,
      fillColor: "#1a7f37",
      fillOpacity: 1,
    }).addTo(mapInst);
    L.circleMarker(path[path.length - 1], {
      radius: opts.radius || 6,
      color: "#fff",
      weight: 2,
      fillColor: "#ff3b30",
      fillOpacity: 1,
    }).addTo(mapInst);
    mapInst.fitBounds(line.getBounds(), { padding: opts.padding || [18, 18] });
    return line;
  }

  async function mountTrailDetailMap(item) {
    destroyTrailDetailMap();
    const el = $("#trailDetailMap");
    if (!el || !window.L) return;
    trailMapItem = item;
    const path = await ensureTrailPath(item);
    if (!$("#trailDetailMap")) return;
    const sourceEl = $("#trailMapSource");
    if (sourceEl) {
      sourceEl.textContent = item.pathSource
        ? t("route_source") + " · " + item.pathSource.replace(/^https?:\/\//, "")
        : t("route_approx");
    }
    trailDetailMap = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(trailDetailMap);
    paintRouteOnMap(trailDetailMap, path, { weight: 4, padding: [16, 16] });
    setTimeout(() => trailDetailMap && trailDetailMap.invalidateSize(), 60);
    setTimeout(() => trailDetailMap && trailDetailMap.invalidateSize(), 220);
  }

  async function openTrailMapExpanded(item) {
    const trail = item || trailMapItem;
    if (!trail) return;
    const path = await ensureTrailPath(trail);
    const box = $("#trailMapLightbox");
    $("#trailMapLightboxTitle").textContent = locName(trail);
    box.hidden = false;
    destroyTrailExpandMap();
    const el = $("#trailDetailMapExpanded");
    trailExpandMap = L.map(el, {
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(trailExpandMap);
    paintRouteOnMap(trailExpandMap, path, { weight: 5, radius: 7, padding: [36, 36] });
    setTimeout(() => trailExpandMap && trailExpandMap.invalidateSize(), 50);
    setTimeout(() => trailExpandMap && trailExpandMap.invalidateSize(), 200);
    icons();
  }

  function closeTrailMapExpanded() {
    $("#trailMapLightbox").hidden = true;
    destroyTrailExpandMap();
  }

  async function loadTrailIntoPlan(trailId) {
    const trail = trailById(trailId);
    if (!trail) return;
    const path = await ensureTrailPath(trail);
    // Keep plan editable: sample waypoints along the real track
    const maxPts = 18;
    const step = Math.max(1, Math.floor((path.length - 1) / (maxPts - 1)));
    const sampled = [];
    for (let i = 0; i < path.length; i += step) sampled.push(path[i]);
    if (sampled[sampled.length - 1] !== path[path.length - 1]) sampled.push(path[path.length - 1]);
    state.followTrailId = trailId;
    state.recordMode = "plan";
    state.recording = false;
    state.planPoints = sampled.map((ll, i) => ({
      kind: i === 0 ? "start" : i === sampled.length - 1 ? "end" : "via",
      latlng: ll,
    }));
    closeOverlay();
    setView("record");
    setTimeout(() => {
      if (!recordMap) return;
      recordMap.invalidateSize();
      redrawPlan();
      if (state.planPoints.length) {
        recordMap.fitBounds(L.latLngBounds(state.planPoints.map((p) => p.latlng)), {
          padding: [40, 40],
        });
      }
      renderRecordChrome();
    }, 140);
    toast(t("toast_edit_route"));
  }

  function locName(item) {
    return TWLang.get() === "zh" ? item.nameZh || item.name || item.titleZh || item.title : item.name || item.title;
  }

  function formatAge(min) {
    if (min < 60) return t("age_ago", { t: min + "m" });
    if (min < 1440) return t("age_ago", { t: Math.round(min / 60) + "h" });
    return t("age_ago", { t: Math.round(min / 1440) + "d" });
  }

  function fmtKm(n) {
    return (Math.round(n * 10) / 10) + " " + t("km");
  }

  function fmtM(n) {
    return Math.round(n) + " " + t("m");
  }

  function fmtDuration(sec) {
    const total = Math.max(0, Math.floor(Number(sec) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
      return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function fmtPace(minPerKm) {
    if (!minPerKm || !isFinite(minPerKm) || minPerKm <= 0) return "—";
    const m = Math.floor(minPerKm);
    const s = Math.round((minPerKm - m) * 60);
    return m + ":" + String(s).padStart(2, "0") + " /" + t("km");
  }

  function fmtActivityWhen(ts) {
    try {
      return new Date(ts || Date.now()).toLocaleString(TWLang.get() === "zh" ? "zh-HK" : "en-HK", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_) {
      return "";
    }
  }

  function privacyLabel(privacy) {
    return privacy === "private" ? t("private") : t("public");
  }

  function fmtTrailDuration(min) {
    if (min == null) return "—";
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    if (h <= 0) return m + " " + t("min");
    if (m === 0) return h + " " + t("hr");
    return h + " " + t("hr") + " " + m + " " + t("min");
  }

  function categoryLabel(id) {
    const cat = (TWData.categories || []).find((c) => c.id === id);
    if (!cat) return id;
    return TWLang.get() === "zh" ? cat.labelZh || cat.label : cat.label;
  }

  const SEARCH_SAMPLES = [
    { q: "Miu Sam", qZh: "苗三" },
    { q: "Dragon's Back", qZh: "龍脊" },
    { q: "coastal", qZh: "海岸" },
    { q: "heritage", qZh: "古道" },
    { q: "accessible", qZh: "無障礙" },
    { q: "Tai Tam", qZh: "大潭" },
  ];

  function trailListedAt(tr) {
    return tr.listedAt || "2026-01-01";
  }

  function defaultSearchFilters() {
    return { district: "all", difficulty: "all", duration: "all", distance: "all" };
  }

  function activeSearchFilterCount() {
    const f = state.searchFilters || defaultSearchFilters();
    let n = 0;
    if (f.district && f.district !== "all") n += 1;
    if (f.difficulty && f.difficulty !== "all") n += 1;
    if (f.duration && f.duration !== "all") n += 1;
    if (f.distance && f.distance !== "all") n += 1;
    return n;
  }

  function updateSearchFilterDots() {
    const n = activeSearchFilterCount();
    ["mapSearchFilterDot", "searchFilterDot"].forEach((id) => {
      const el = $("#" + id);
      if (!el) return;
      el.hidden = n === 0;
    });
  }

  function matchDurationBucket(min, bucket) {
    if (!bucket || bucket === "all") return true;
    if (bucket === "short") return min < 120;
    if (bucket === "mid") return min >= 120 && min < 240;
    if (bucket === "long") return min >= 240;
    return true;
  }

  function matchDistanceBucket(km, bucket) {
    if (!bucket || bucket === "all") return true;
    if (bucket === "short") return km < 8;
    if (bucket === "mid") return km >= 8 && km < 15;
    if (bucket === "long") return km >= 15;
    return true;
  }

  function searchTrailMatches(tr, q) {
    const f = state.searchFilters || defaultSearchFilters();
    const hay = [
      tr.name,
      tr.nameZh,
      tr.summary,
      tr.summaryZh,
      tr.route,
      tr.district,
      ...(tr.categories || []).map(categoryLabel),
    ]
      .join(" ")
      .toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (f.district && f.district !== "all" && tr.district !== f.district) return false;
    if (f.difficulty && f.difficulty !== "all" && String(tr.difficulty) !== String(f.difficulty)) return false;
    if (!matchDurationBucket(tr.durationMin || 0, f.duration)) return false;
    if (!matchDistanceBucket(tr.distanceKm || 0, f.distance)) return false;
    return true;
  }

  function openSearchPanel(seed) {
    state.searchOpen = true;
    const panel = $("#searchPanel");
    if (panel) panel.hidden = false;
    const input = $("#searchPanelInput");
    if (seed != null) {
      state.search = seed;
      if (input) input.value = seed;
    } else if (input) {
      input.value = state.search || "";
    }
    renderSearchPanel();
    updateSearchFilterDots();
    icons();
    requestAnimationFrame(() => input?.focus());
  }

  function closeSearchPanel() {
    state.searchOpen = false;
    const panel = $("#searchPanel");
    if (panel) panel.hidden = true;
    updateMapSearchChrome();
    refreshMapUI();
  }

  function updateMapSearchChrome() {
    const label = $("#mapSearchLabel");
    if (label) {
      label.textContent = state.search || t("search_ph");
      label.style.color = state.search ? "var(--ios-label)" : "var(--ios-tertiary)";
    }
    updateSearchFilterDots();
  }

  function pushSearchRecent(q) {
    const query = (q || "").trim();
    if (!query) return;
    state.searchRecent = [query, ...state.searchRecent.filter((x) => x !== query)].slice(0, 6);
  }

  function renderSearchPanel() {
    const body = $("#searchPanelBody");
    const input = $("#searchPanelInput");
    const clear = $("#searchClear");
    if (!body) return;
    const q = (input?.value || state.search || "").trim();
    if (clear) clear.hidden = !q;
    const qLower = q.toLowerCase();
    const results = TWData.trails.filter((tr) => searchTrailMatches(tr, qLower));

    if (!q && activeSearchFilterCount() === 0) {
      const samples = SEARCH_SAMPLES.map((s) => {
        const label = TWLang.get() === "zh" ? s.qZh : s.q;
        return `<button type="button" class="search-sample-chip" data-sample-q="${esc(s.q)}">${esc(label)}</button>`;
      }).join("");
      const recent = state.searchRecent.length
        ? `<div class="search-section-label">${t("search_recent")}</div>
           <div class="search-sample-row">${state.searchRecent
             .map((r) => `<button type="button" class="search-sample-chip" data-sample-q="${esc(r)}">${esc(r)}</button>`)
             .join("")}</div>`
        : "";
      body.innerHTML = `
        <div class="search-section-label">${t("search_samples")}</div>
        <div class="search-sample-row">${samples}</div>
        ${recent}
      `;
      icons();
      return;
    }

    body.innerHTML = `
      <div class="search-section-label">${t("search_results")} · ${results.length}</div>
      ${
        results.length
          ? results
              .map((tr) => {
                const cats = (tr.categories || [])
                  .filter((c) => c !== "all")
                  .slice(0, 2)
                  .map((c) => `<span class="trail-cat">${esc(categoryLabel(c))}</span>`)
                  .join("");
                return `<button type="button" class="search-result-card" data-search-trail="${tr.id}">
                  ${tr.cover ? `<img src="${esc(tr.cover)}" alt="" loading="lazy" />` : `<div style="width:64px;height:64px;border-radius:12px;background:#dfe6df"></div>`}
                  <div style="min-width:0;flex:1">
                    <div class="title">${esc(locName(tr))}</div>
                    <div class="meta">${fmtKm(tr.distanceKm)} · ${fmtTrailDuration(tr.durationMin)} · ↑${fmtM(tr.elevGain)} · ${trailListedAt(tr)}</div>
                    ${cats ? `<div class="cats">${cats}</div>` : ""}
                  </div>
                </button>`;
              })
              .join("")
          : `<div class="empty-box">${t("search_no_results")}</div>`
      }
    `;
    icons();
  }

  function openSearchFilters() {
    const f = { ...defaultSearchFilters(), ...(state.searchFilters || {}) };
    const districts = Object.keys(TW_I18N.en.district_options);
    const districtOpts = [
      `<option value="all">${esc(t("search_district_all"))}</option>`,
      ...districts.map(
        (d) =>
          `<option value="${d}" ${f.district === d ? "selected" : ""}>${esc(t("district_options." + d))}</option>`
      ),
    ].join("");
    const diffs = ["all", "1", "2", "3", "4", "5"];
    const diffBtns = diffs
      .map((d) => {
        const label = d === "all" ? t("search_diff_all") : d;
        const on = String(f.difficulty || "all") === d;
        return `<button type="button" class="search-diff-chip${on ? " is-on" : ""}" data-search-diff="${d}">${esc(label)}</button>`;
      })
      .join("");
    openOverlay(
      t("search_filters"),
      `
      <div class="ov-field">
        <label class="ov-label" for="searchDistrict">${t("search_district")}</label>
        <select id="searchDistrict" class="ov-select">${districtOpts}</select>
      </div>
      <div class="ov-field">
        <label class="ov-label">${t("search_difficulty")}</label>
        <div class="search-diff-row" id="searchDiffRow">${diffBtns}</div>
        <p class="search-diff-hint">${t("search_diff_hint")}</p>
      </div>
      <div class="ov-field">
        <label class="ov-label" for="searchDuration">${t("search_duration")}</label>
        <select id="searchDuration" class="ov-select">
          <option value="all" ${f.duration === "all" ? "selected" : ""}>${esc(t("search_duration_all"))}</option>
          <option value="short" ${f.duration === "short" ? "selected" : ""}>${esc(t("search_duration_short"))}</option>
          <option value="mid" ${f.duration === "mid" ? "selected" : ""}>${esc(t("search_duration_mid"))}</option>
          <option value="long" ${f.duration === "long" ? "selected" : ""}>${esc(t("search_duration_long"))}</option>
        </select>
      </div>
      <div class="ov-field">
        <label class="ov-label" for="searchDistance">${t("search_distance")}</label>
        <select id="searchDistance" class="ov-select">
          <option value="all" ${f.distance === "all" ? "selected" : ""}>${esc(t("search_distance_all"))}</option>
          <option value="short" ${f.distance === "short" ? "selected" : ""}>${esc(t("search_distance_short"))}</option>
          <option value="mid" ${f.distance === "mid" ? "selected" : ""}>${esc(t("search_distance_mid"))}</option>
          <option value="long" ${f.distance === "long" ? "selected" : ""}>${esc(t("search_distance_long"))}</option>
        </select>
      </div>
    `,
      {
        footer: `<div class="ov-cta-row">
          <button type="button" class="ios-btn ios-btn-gray ios-btn-block" id="resetSearchFilters">${t("search_reset_filters")}</button>
          <button type="button" class="ios-btn ios-btn-fill ios-btn-block" id="applySearchFilters">${t("search_apply")}</button>
        </div>`,
      }
    );
  }

  function trailCatsHtml(item, limit = 2) {
    const cats = (item.categories || []).filter((c) => c !== "all").slice(0, limit);
    if (!cats.length) return "";
    return `<div class="trail-card-cats">${cats
      .map((c) => `<span class="trail-cat">${esc(categoryLabel(c))}</span>`)
      .join("")}</div>`;
  }

  function ovAction({ attrs, on, icon, count, label }) {
    return `<button type="button" class="ov-action${on ? " is-on" : ""}" ${attrs || ""}>
      <span class="ov-action-ico"><i data-lucide="${icon}"></i></span>
      ${count != null ? `<span class="ov-action-count">${esc(String(count))}</span>` : ""}
      <span class="ov-action-lbl">${esc(label)}</span>
    </button>`;
  }

  function ovUpvoteSaveRow({ id, up, count, saved, type }) {
    return `<div class="ov-action-row">
      ${ovAction({
        attrs: `data-upvote="${id}"`,
        on: up,
        icon: up ? "arrow-big-up" : "arrow-big-up",
        count,
        label: up ? t("upvoted") : t("upvote"),
      })}
      ${ovAction({
        attrs: `data-save="${id}" data-type="${type}"`,
        on: saved,
        icon: saved ? "bookmark-check" : "bookmark",
        label: saved ? t("saved") : t("save"),
      })}
    </div>`;
  }

  function allIncidents() {
    const base = TWData.incidents.map((inc) => {
      const rt = TWStore.getIncidentRuntime(inc);
      return { ...inc, ...rt };
    });
    const user = (TWStore.get().userReports || []).map((r) => ({
      ...r,
      confirms: r.confirms || 1,
      dismisses: r.dismisses || 0,
      status: r.status || "active",
    }));
    return base.concat(user).filter((i) => i.status !== "cleared");
  }

  function prefs() {
    return TWStore.get().prefs;
  }

  /* —— Filtering for map chips —— */
  function itemsForChip(chip) {
    const p = prefs();
    const store = TWStore.get();
    const q = (state.search || "").toLowerCase().trim();

    function matchQ(text) {
      return !q || text.toLowerCase().includes(q);
    }

    function matchTrail(tr) {
      return searchTrailMatches(tr, q);
    }

    if (chip === "incidents") {
      return allIncidents()
        .filter((i) => matchQ((i.title || "") + " " + (i.titleZh || "")))
        .map((i) => ({ kind: "incident", item: i }));
    }
    if (chip === "alerts") {
      return TWData.alerts
        .filter((a) => matchQ((a.title || "") + " " + (a.titleZh || "")))
        .map((a) => ({ kind: "alert", item: a }));
    }
    if (chip === "explore") {
      const sub = state.exploreSub || "editorial";
      return TWData.trails
        .filter((tr) => {
          if (sub === "all") return true;
          if (sub === "editorial") {
            return tr.editorial || (tr.tags || []).includes("editorial") || (tr.categories || []).includes("latest");
          }
          return (tr.categories || []).includes(sub);
        })
        .filter(matchTrail)
        .map((tr) => ({
          kind: "trail",
          item: tr,
          tag:
            tr.editorial || (tr.tags || []).includes("editorial") || (tr.categories || []).includes("latest")
              ? "explore"
              : (tr.tags || []).includes("trending")
                ? "trending"
                : (tr.tags || []).includes("new") || tr.isNew
                  ? "new"
                  : "recommended",
        }));
    }
    if (chip === "new") {
      return TWData.trails
        .filter((tr) => tr.isNew || (tr.tags || []).includes("new"))
        .filter(matchTrail)
        .map((tr) => ({ kind: "trail", item: tr, tag: "new" }));
    }
    if (chip === "trending") {
      return TWData.trails
        .filter((tr) => (tr.tags || []).includes("trending"))
        .filter(matchTrail)
        .map((tr) => ({ kind: "trail", item: tr, tag: "trending" }));
    }
    if (chip === "recommended") {
      return TWData.trails
        .filter((tr) => (tr.tags || []).includes("recommended"))
        .filter(matchTrail)
        .map((tr) => ({ kind: "trail", item: tr, tag: "recommended" }));
    }
    if (chip === "live") {
      if (p.liveMode === "off" || !p.layers.live) return [];
      return TWData.hikers
        .filter((h) => (p.liveMode === "friends" ? h.friend : true))
        .filter((h) => matchQ(h.name + " " + (h.nameZh || "")))
        .map((h) => ({ kind: "hiker", item: h }));
    }

    // For you — districts + interests, prefer recommended/trending/new + active incidents/alerts in prefs
    const out = [];
    if (p.layers.incidents) {
      allIncidents().forEach((i) => {
        const tr = trailById(i.trailId);
        if (tr && p.districts.includes(tr.district) && matchQ(i.title + " " + (i.titleZh || ""))) {
          out.push({ kind: "incident", item: i });
        }
      });
    }
    if (p.layers.alerts) {
      TWData.alerts.forEach((a) => {
        const tr = trailById(a.trailId);
        if (tr && p.districts.includes(tr.district) && matchQ(a.title + " " + (a.titleZh || ""))) {
          out.push({ kind: "alert", item: a });
        }
      });
    }
    TWData.trails.forEach((tr) => {
      if (!p.districts.includes(tr.district)) return;
      if (!matchTrail(tr)) return;
      const interestHit = (tr.interests || []).some((x) => p.interests.includes(x));
      const tags = tr.tags || [];
      let tag = null;
      if (p.layers.recommended && tags.includes("recommended") && interestHit) tag = "recommended";
      else if (p.layers.trending && tags.includes("trending")) tag = "trending";
      else if (p.layers.new && (tr.isNew || tags.includes("new"))) tag = "new";
      else if (interestHit) tag = "recommended";
      if (tag) out.push({ kind: "trail", item: tr, tag });
    });
    return out;
  }

  function visibleMapItems() {
    const p = prefs();
    const items = [];
    if (p.layers.incidents) {
      allIncidents().forEach((i) => items.push({ kind: "incident", item: i }));
    }
    if (p.layers.alerts) {
      TWData.alerts.forEach((a) => items.push({ kind: "alert", item: a }));
    }
    const q = (state.search || "").toLowerCase().trim();
    TWData.trails.forEach((tr) => {
      if (!searchTrailMatches(tr, q)) return;
      const tags = tr.tags || [];
      if (p.layers.new && (tr.isNew || tags.includes("new"))) {
        items.push({ kind: "trail", item: tr, tag: "new" });
      } else if (p.layers.trending && tags.includes("trending")) {
        items.push({ kind: "trail", item: tr, tag: "trending" });
      } else if (p.layers.recommended && tags.includes("recommended")) {
        items.push({ kind: "trail", item: tr, tag: "recommended" });
      }
    });
    if (p.layers.groups) {
      TWData.groups.forEach((g) => items.push({ kind: "group", item: g }));
    }
    return items;
  }

  function liveHikersVisible() {
    const p = prefs();
    if (!p.layers.live || p.liveMode === "off") return [];
    return TWData.hikers.filter((h) => (p.liveMode === "friends" ? h.friend : true));
  }

  /* —— Map —— */
  function pinHtml(kind, extra, type) {
    if (kind === "incident") {
      const meta = incidentTypeMeta(type || "suspicious");
      const cls = ["tw-pin", "incident", `type-${type || "suspicious"}`, extra || ""].filter(Boolean).join(" ");
      return `<div class="${cls}"><span class="tw-pin-ico">${lucideIco(meta.icon)}</span></div>`;
    }
    const cls = ["tw-pin", kind, extra || ""].filter(Boolean).join(" ");
    const mark = kind === "alert" ? "i" : kind === "new" ? "N" : kind === "trending" ? "↑" : "★";
    return `<div class="${cls}"><span>${mark}</span></div>`;
  }

  function makeIcon(kind, extra, type) {
    return L.divIcon({
      className: "",
      html: pinHtml(kind, extra, type),
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });
  }

  function makeLiveIcon(h) {
    const initial = (h.name || "?").charAt(0);
    return L.divIcon({
      className: "",
      html: `<div class="tw-live">${initial}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }

  function initMaps() {
    map = L.map("mapCanvas", {
      zoomControl: false,
      attributionControl: true,
    }).setView(TWData.userCenter, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OSM",
    }).addTo(map);

    pinLayer = L.layerGroup().addTo(map);
    liveLayer = L.layerGroup().addTo(map);

    userMarker = L.marker(TWData.userCenter, {
      icon: L.divIcon({
        className: "",
        html: '<div class="tw-user"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
      zIndexOffset: 500,
    }).addTo(map);

    recordMap = L.map("recordMap", {
      zoomControl: false,
      attributionControl: false,
    }).setView(TWData.recordPath[0], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(recordMap);

    recordLine = L.polyline([], { color: "#0b421a", weight: 4 }).addTo(recordMap);
    recordMarker = L.circleMarker(TWData.recordPath[0], {
      radius: 7,
      color: "#fff",
      weight: 2,
      fillColor: "#4a90c8",
      fillOpacity: 1,
    }).addTo(recordMap);
    planLine = L.polyline([], { color: "#1a6b32", weight: 3, dashArray: "6 6" }).addTo(recordMap);
    planMarkers = L.layerGroup().addTo(recordMap);

    setTimeout(() => {
      map.invalidateSize();
      recordMap.invalidateSize();
    }, 80);
  }

  function refreshMapPins() {
    pinLayer.clearLayers();
    liveLayer.clearLayers();

    const chipItems = itemsForChip(state.chip);
    const focusIds = new Set(
      chipItems.map((x) => x.item.id)
    );

    visibleMapItems().forEach(({ kind, item, tag }) => {
      let lat = item.lat;
      let lng = item.lng;
      if (lat == null) return;
      let iconKind = kind === "trail" ? tag || "recommended" : kind === "group" ? "alert" : kind;
      let extra = kind === "incident" && item.severity === "high" ? "high" : "";
      const m = L.marker([lat, lng], {
        icon: makeIcon(iconKind === "group" ? "alert" : iconKind, extra, kind === "incident" ? item.type : null),
        opacity: state.chip === "foryou" || focusIds.has(item.id) || (kind === "trail" && focusIds.has(item.id)) ? 1 : 0.45,
      });
      m.on("click", () => openItemDetail(kind === "trail" ? "trail" : kind, item, tag));
      m.addTo(pinLayer);
    });

    // Always show trails that match current chip even if layer toggles differ for chip-only views
    if (["explore", "new", "trending", "recommended"].includes(state.chip)) {
      chipItems.forEach(({ item, tag }) => {
        const m = L.marker([item.lat, item.lng], { icon: makeIcon(tag === "explore" ? "recommended" : tag || "recommended") });
        m.on("click", () => openItemDetail("trail", item, tag));
        m.addTo(pinLayer);
      });
    }
    if (state.chip === "incidents") {
      chipItems.forEach(({ item }) => {
        const m = L.marker([item.lat, item.lng], {
          icon: makeIcon("incident", item.severity === "high" ? "high" : "", item.type),
        });
        m.on("click", () => openItemDetail("incident", item));
        m.addTo(pinLayer);
      });
    }
    if (state.chip === "alerts") {
      chipItems.forEach(({ item }) => {
        const m = L.marker([item.lat, item.lng], { icon: makeIcon("alert") });
        m.on("click", () => openItemDetail("alert", item));
        m.addTo(pinLayer);
      });
    }

    liveHikersVisible().forEach((h) => {
      const m = L.marker([h.lat, h.lng], { icon: makeLiveIcon(h) });
      m.on("click", () => openItemDetail("hiker", h));
      m.addTo(liveLayer);
    });
    if (state.chip === "live") {
      chipItems.forEach(({ item }) => {
        const m = L.marker([item.lat, item.lng], { icon: makeLiveIcon(item) });
        m.on("click", () => openItemDetail("hiker", item));
        m.addTo(liveLayer);
      });
    }
  }

  /* —— Sheet —— */
  function setSheet(level) {
    state.sheet = level;
    const el = $("#mapSheet");
    el.classList.remove("peek", "half", "full");
    el.classList.add(level);
  }

  function exploreTrailPool() {
    const q = (state.search || "").toLowerCase().trim();
    return TWData.trails.filter((tr) => searchTrailMatches(tr, q));
  }

  function exploreSubCount(sub) {
    const pool = exploreTrailPool();
    if (sub === "all") return pool.length;
    if (sub === "editorial") {
      return pool.filter(
        (tr) => tr.editorial || (tr.tags || []).includes("editorial") || (tr.categories || []).includes("latest")
      ).length;
    }
    return pool.filter((tr) => (tr.categories || []).includes(sub)).length;
  }

  function renderExploreSubs() {
    const row = $("#sheetExploreSubs");
    if (!row) return;
    if (state.chip !== "explore") {
      row.hidden = true;
      row.innerHTML = "";
      return;
    }
    const subs = [
      { id: "all", label: t("explore_sub_all") },
      { id: "editorial", label: t("explore_sub_editorial") },
      ...(TWData.categories || [])
        .filter((c) => c.id !== "all")
        .map((c) => ({ id: c.id, label: categoryLabel(c.id) })),
    ];
    row.hidden = false;
    row.innerHTML = subs
      .map((s) => {
        const n = exploreSubCount(s.id);
        const on = state.exploreSub === s.id;
        return `<button type="button" class="ios-chip ios-chip-outline${on ? " ios-chip-active" : ""}" data-explore-sub="${s.id}">${esc(s.label)} (${n})</button>`;
      })
      .join("");
  }

  function renderChips() {
    const chips = [
      "foryou",
      "explore",
      "incidents",
      "alerts",
      "new",
      "trending",
      "recommended",
      "live",
    ];
    const el = $("#sheetChips");
    if (el) {
      el.setAttribute("role", "tablist");
      el.innerHTML = chips
        .map((c) => sheetTabBtn(t("chip_" + c), state.chip === c, `data-chip="${c}"`))
        .join("");
    }
    renderExploreSubs();
  }

  function renderPeek() {
    const incidents = allIncidents().length;
    const trending = TWData.trails.filter((tr) => (tr.tags || []).includes("trending")).length;
    $("#sheetPeek").textContent =
      incidents === 0
        ? t("peek_clear")
        : t("peek_summary", { incidents, trending });
  }

  function pinDot(kind, extra) {
    const colors = {
      incident: extra === "high" ? "#ff3b30" : "#ff9f0a",
      alert: "#1a7f37",
      new: "#007aff",
      trending: "#ffd60a",
      recommended: "#0b421a",
      explore: "#0b421a",
      live: "#007aff",
    };
    return `<span style="width:9px;height:9px;border-radius:50%;background:${colors[kind] || "#1a7f37"};flex-shrink:0;margin-top:5px"></span>`;
  }

  function badge(text, tone) {
    const cls = tone === "red" ? "danger" : tone === "amber" ? "warn" : tone === "gold" ? "gold" : "";
    return `<span class="ios-badge ${cls}">${text}</span>`;
  }

  function incidentPlaceLabel(item) {
    if (item.useCurrentLocation || item.trailId == null) return t("current_location");
    const tr = trailById(item.trailId);
    return tr ? locName(tr) : t("current_location");
  }

  function cardHtml(entry) {
    const { kind, item, tag } = entry;
    const store = TWStore.get();
    if (kind === "incident") {
      const thumb = (item.photos && item.photos[0]) || "";
      const typeKey = INCIDENT_TYPES[item.type] ? item.type : "suspicious";
      return `<button type="button" class="ios-card" data-open="incident" data-id="${item.id}">
        <div class="inc-card">
          ${thumb ? `<img class="inc-card-thumb" src="${esc(thumb)}" alt="" loading="lazy" />` : ""}
          <div class="inc-card-body">
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
              ${typeIconBadge(typeKey, item.severity)}
              <span style="flex:1;font-size:16px;font-weight:600;letter-spacing:-0.02em;line-height:1.25">${esc(TWLang.get() === "zh" ? item.titleZh : item.title)}</span>
              ${badge(t("status_active"), item.severity === "high" ? "red" : "amber")}
            </div>
            <div style="font-size:13px;color:var(--ios-secondary)">${esc(t("report_types." + typeKey))} · ${esc(incidentPlaceLabel(item))} · ${formatAge(item.ageMin || 0)}${item.photos && item.photos.length ? " · " + t("photo_count", { n: item.photos.length }) : ""}</div>
          </div>
        </div>
      </button>`;
    }
    if (kind === "alert") {
      return `<button type="button" class="ios-card" data-open="alert" data-id="${item.id}">
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          ${pinDot("alert")}
          <span style="flex:1;font-size:16px;font-weight:600;letter-spacing:-0.02em;line-height:1.25">${esc(TWLang.get() === "zh" ? item.titleZh : item.title)}</span>
        </div>
        <div style="font-size:13px;color:var(--ios-secondary)">${formatAge(item.ageMin || 0)} · ↑ ${item.upvotes + (store.upvotes[item.id] ? 1 : 0)}</div>
      </button>`;
    }
    if (kind === "hiker") {
      const tr = trailById(item.trailId);
      return `<button type="button" class="ios-card" data-open="hiker" data-id="${item.id}">
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          ${pinDot("live")}
          <span style="flex:1;font-size:16px;font-weight:600">${esc(TWLang.get() === "zh" ? item.nameZh || item.name : item.name)}</span>
        </div>
        <div style="font-size:13px;color:var(--ios-secondary)">${t("current_trail", { trail: tr ? locName(tr) : "—" })}</div>
      </button>`;
    }
    const up = item.upvotes + (store.upvotes[item.id] ? 1 : 0);
    const pin = tag || "recommended";
    const cover = item.cover
      ? `<img class="trail-card-cover" src="${esc(item.cover)}" alt="" loading="lazy" />`
      : "";
    const badgeLabel =
      pin === "explore"
        ? t("badge_editorial")
        : t("chip_" + (pin === "new" ? "new" : pin === "trending" ? "trending" : "recommended"));
    const why =
      pin === "explore"
        ? `<div class="trail-card-why">${esc(TWLang.get() === "zh" ? item.whyZh || item.why || "" : item.why || "")}</div>`
        : "";
    return `<button type="button" class="ios-card trail-card" data-open="trail" data-id="${item.id}" data-tag="${pin}">
      ${cover}
      <div class="trail-card-body">
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          ${pinDot(pin)}
          <span style="flex:1;font-size:16px;font-weight:600;letter-spacing:-0.02em;line-height:1.25">${esc(locName(item))}</span>
          ${badge(badgeLabel, pin === "trending" ? "gold" : "green")}
        </div>
        <div class="trail-card-meta">${fmtKm(item.distanceKm)} · ${fmtTrailDuration(item.durationMin)} · ↑${fmtM(item.elevGain)} · L${item.difficulty}</div>
        ${trailCatsHtml(item)}
        ${why}
        <div class="trail-card-meta" style="margin-top:6px">↑ ${up}</div>
      </div>
    </button>`;
  }

  function renderSheetBody() {
    const items = itemsForChip(state.chip);
    const body = $("#sheetBody");
    if (!items.length) {
      let msg = t("empty_generic");
      if (state.chip === "foryou") msg = t("empty_foryou");
      if (state.chip === "explore") msg = t("empty_explore");
      if (state.chip === "live") msg = t("empty_live");
      body.innerHTML = `<div class="empty-box"><strong>${t("chip_" + state.chip)}</strong>${msg}</div>`;
      return;
    }
    body.innerHTML = items.map(cardHtml).join("");
  }

  function refreshMapUI() {
    renderPeek();
    renderChips();
    renderSheetBody();
    refreshMapPins();
    // Remaining data-lucide nodes (chrome, overlays); incident SVGs are inlined
    requestAnimationFrame(() => icons());
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* —— Overlay details —— */
  function openOverlay(title, html, opts = {}) {
    destroyTrailDetailMap();
    destroyReportLocMap();
    stopReportCamera();
    $("#overlayTitle").textContent = title;
    const overlay = $("#overlay");
    const body = $("#overlayBody");
    const footer = $("#overlayFooter");
    const sheet = overlay.querySelector(".overlay-sheet");
    body.innerHTML = html;
    body.classList.toggle("ov-flush-top", !!opts.flushTop);
    body.classList.toggle("report-mode", !!opts.fullScreen);
    overlay.classList.toggle("is-fullscreen", !!opts.fullScreen);
    sheet.classList.toggle("is-fullscreen", !!opts.fullScreen);
    const closeBtn = $("#overlayClose");
    if (closeBtn) {
      closeBtn.classList.toggle("is-hidden", !!opts.hideClose);
      closeBtn.disabled = !!opts.hideClose;
      closeBtn.setAttribute("aria-hidden", opts.hideClose ? "true" : "false");
    }
    if (opts.footer) {
      footer.innerHTML = opts.footer;
      footer.classList.remove("hidden");
      body.classList.add("has-footer");
      sheet.classList.add("has-sticky-footer");
    } else {
      footer.innerHTML = "";
      footer.classList.add("hidden");
      body.classList.remove("has-footer");
      sheet.classList.remove("has-sticky-footer");
    }
    body.scrollTop = 0;
    overlay.classList.add("open");
    icons();
  }

  function closeOverlay() {
    closeTrailMapExpanded();
    destroyTrailDetailMap();
    trailMapItem = null;
    if (state.overlayMode === "report") {
      stopReportCamera();
      destroyReportLocMap();
      state.reportPhotos = [null, null, null];
      state.reportShowErrors = false;
    }
    const overlay = $("#overlay");
    const sheet = overlay.querySelector(".overlay-sheet");
    overlay.classList.remove("open", "is-fullscreen");
    sheet?.classList.remove("has-sticky-footer", "is-fullscreen");
    $("#overlayBody").classList.remove("ov-flush-top", "has-footer", "report-mode");
    const closeBtn = $("#overlayClose");
    if (closeBtn) {
      closeBtn.classList.remove("is-hidden");
      closeBtn.disabled = false;
      closeBtn.setAttribute("aria-hidden", "false");
    }
    const footer = $("#overlayFooter");
    footer.innerHTML = "";
    footer.classList.add("hidden");
    state.overlayMode = null;
  }

  function openItemDetail(kind, item, tag) {
    if (kind === "incident") return openIncident(item);
    if (kind === "alert") return openAlert(item);
    if (kind === "trail") return openTrail(item, tag);
    if (kind === "hiker") return openHiker(item);
    if (kind === "group") return openGroupDetail(item);
  }

  function openIncident(item) {
    state.overlayMode = "incident";
    const store = TWStore.get();
    const vote = store.votes[item.id] || {};
    const rt = TWStore.getIncidentRuntime(item);
    const photos = item.photos || [];
    const hero = photos[0];
    openOverlay(
      TWLang.get() === "zh" ? item.titleZh : item.title,
      `
      <div class="trail-detail">
        ${hero ? `<img class="inc-hero" src="${esc(hero)}" alt="" />` : ""}
        ${photos.length > 1 ? `<div class="inc-photo-row">${photos
          .slice(1)
          .map((src) => `<img src="${esc(src)}" alt="" loading="lazy" />`)
          .join("")}</div>` : ""}
        <div class="inc-detail-body">
          <div class="ov-chip-row">
            ${typeLabelBadge(item.type, item.severity)}
            ${badge(rt.status === "cleared" ? t("status_cleared") : t("status_active"), "green")}
            ${photos.length ? badge(t("photo_count", { n: photos.length }), "green") : ""}
          </div>
          <p class="ov-meta">${esc(incidentPlaceLabel(item))} · ${formatAge(item.ageMin || 0)}</p>
          <p class="ov-body-text" style="margin-top:0">${esc(TWLang.get() === "zh" ? item.noteZh || item.note : item.note)}</p>
          <div class="stat-grid">
            ${statCell(rt.confirms, t("still_there"))}
            ${statCell(rt.dismisses, t("not_there"))}
            ${statCell(rt.confirms + rt.dismisses, t("votes"))}
          </div>
          <p class="ov-meta">${t("confirmed_by", { n: rt.confirms })}</p>
        </div>
      </div>
    `,
      {
        flushTop: !!hero,
        footer: `<div class="ov-stack">
        <button type="button" class="ios-btn ios-btn-fill ios-btn-block" data-vote="still" data-id="${item.id}" ${vote.still ? "disabled" : ""}>${t("still_there")}</button>
        <button type="button" class="ios-btn ios-btn-danger ios-btn-block" data-vote="not" data-id="${item.id}" ${vote.not ? "disabled" : ""}>${t("not_there")}</button>
      </div>`,
      }
    );
  }

  function openAlert(item) {
    const store = TWStore.get();
    const up = !!store.upvotes[item.id];
    const saved = !!store.saved[item.id];
    const count = item.upvotes + (up ? 1 : 0);
    openOverlay(TWLang.get() === "zh" ? item.titleZh : item.title, `
      <p class="ov-body-text" style="margin-top:0">${esc(TWLang.get() === "zh" ? item.bodyZh : item.body)}</p>
      <p class="ov-meta" style="margin-top:10px">${formatAge(item.ageMin || 0)}</p>
    `, {
      footer: `${ovUpvoteSaveRow({ id: item.id, up, count, saved, type: "alert" })}
        <div style="height:10px"></div>
        <button type="button" class="ios-btn ios-btn-gray ios-btn-block" data-focus-map="${item.lat},${item.lng}">
          <i data-lucide="map-pin" style="width:18px;height:18px"></i>${t("view_on_map")}
        </button>`,
    });
  }

  function openTrail(item, tag) {
    const store = TWStore.get();
    const up = !!store.upvotes[item.id];
    const saved = !!store.saved[item.id];
    const count = item.upvotes + (up ? 1 : 0);
    const zh = TWLang.get() === "zh";
    const why = zh ? item.whyZh : item.why;
    const summary = zh ? item.summaryZh || item.summary : item.summary;
    const route = zh ? item.routeZh || item.route : item.route;
    const transport = zh ? item.transportZh || item.transport : item.transport;
    const notes = zh ? item.notesZh || item.notes || [] : item.notes || [];
    const photos = item.photos || (item.cover ? [item.cover] : []);
    const hero = item.cover || photos[0];
    const elevRange =
      item.elevMax != null && item.elevMin != null
        ? `${Math.round(item.elevMin)}–${Math.round(item.elevMax)} ${t("m")}`
        : fmtM(item.elevGain);
    openOverlay(
      locName(item),
      `
      <div class="trail-detail">
        ${hero ? `<img class="trail-hero" src="${esc(hero)}" alt="" />` : ""}
        ${photos.length > 1 ? `<div class="trail-photo-row">${photos
          .map((src) => `<img src="${esc(src)}" alt="" loading="lazy" />`)
          .join("")}</div>` : ""}
        <div class="trail-detail-body">
          <div class="trail-map-block">
            <div class="trail-map-label">${t("route_map")}</div>
            <div class="trail-map">
              <button type="button" class="trail-map-expand" data-expand-trail-map="${item.id}" title="${t("expand_map")}" aria-label="${t("expand_map")}">
                <i data-lucide="expand"></i>
              </button>
              <div id="trailDetailMap"></div>
            </div>
            <div class="trail-map-source" id="trailMapSource"></div>
          </div>
          <div class="stat-grid">
            ${statCell(fmtKm(item.distanceKm), t("distance"))}
            ${statCell(fmtTrailDuration(item.durationMin), t("duration"))}
            ${statCell(fmtM(item.elevGain), t("elev_change"))}
          </div>
          <div class="stat-grid">
            ${statCell("L" + item.difficulty, t("difficulty"))}
            ${statCell(elevRange, t("elev_range"))}
            ${statCell(String(count), t("votes"))}
          </div>
          ${trailCatsHtml(item, 4)}
          ${summary ? `<div class="trail-section"><h3>${t("about_trail")}</h3><p>${esc(summary)}</p></div>` : ""}
          ${why ? `<div class="trail-section"><h3>${t("why_for_you")}</h3><p>${esc(why)}</p></div>` : ""}
          ${route ? `<div class="trail-section"><h3>${t("route")}</h3><p>${esc(route)}</p></div>` : ""}
          ${transport ? `<div class="trail-section"><h3>${t("transport")}</h3><p>${esc(transport)}</p></div>` : ""}
          ${notes.length ? `<div class="trail-section"><h3>${t("notes")}</h3><ul>${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>` : ""}
        </div>
      </div>
    `,
      {
        flushTop: true,
        footer: `${ovUpvoteSaveRow({ id: item.id, up, count, saved, type: "trail" })}
        <div class="ov-cta-row" style="margin-top:10px">
          <button type="button" class="ios-btn ios-btn-gray ios-btn-block" data-edit-route="${item.id}">
            <i data-lucide="pencil" style="width:16px;height:16px"></i>${t("edit_route")}
          </button>
          <button type="button" class="ios-btn ios-btn-fill ios-btn-block" data-start-trail="${item.id}">
            <i data-lucide="navigation" style="width:16px;height:16px"></i>${t("start_route")}
          </button>
        </div>`,
      }
    );
    requestAnimationFrame(() => mountTrailDetailMap(item));
  }

  function openHiker(item) {
    const tr = trailById(item.trailId);
    openOverlay(TWLang.get() === "zh" ? item.nameZh || item.name : item.name, `
      <div class="ov-avatar">${esc((item.name || "?").charAt(0))}</div>
      <p class="ov-body-text" style="margin-top:0">${t("current_trail", { trail: tr ? locName(tr) : "—" })}</p>
      <p class="ov-meta" style="margin-top:6px">${t("mutual", { n: item.mutual || 0 })}</p>
    `, {
      footer: `<button type="button" class="ios-btn ios-btn-gray ios-btn-block" data-focus-map="${item.lat},${item.lng}">
          <i data-lucide="map-pin" style="width:18px;height:18px"></i>${t("view_on_map")}
        </button>`,
    });
  }

  function fmtCoords(lat, lng) {
    return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
  }

  function reportPhotoList() {
    return (state.reportPhotos || [null, null, null]).slice(0, 3);
  }

  function reportFilledPhotos() {
    return reportPhotoList().filter(Boolean);
  }

  function firstEmptyPhotoSlot() {
    const photos = reportPhotoList();
    const idx = photos.findIndex((p) => !p);
    return idx === -1 ? null : idx;
  }

  function stopReportCamera() {
    if (reportCameraStream) {
      reportCameraStream.getTracks().forEach((tr) => tr.stop());
      reportCameraStream = null;
    }
    const video = $("#reportCameraVideo");
    if (video) video.srcObject = null;
  }

  function startReportCamera() {
    const video = $("#reportCameraVideo");
    const fallback = $("#reportCameraFallback");
    if (!video) return;
    const showFallback = () => {
      if (!fallback) return;
      fallback.hidden = false;
      fallback.style.backgroundImage = 'url("assets/trails/miu-sam-3.jpg")';
    };
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showFallback();
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((stream) => {
        reportCameraStream = stream;
        video.srcObject = stream;
        video.play().catch(() => {});
        if (fallback) {
          fallback.hidden = true;
          fallback.style.backgroundImage = "";
        }
      })
      .catch(() => showFallback());
  }

  function captureReportPhoto() {
    const slot = firstEmptyPhotoSlot();
    if (slot == null) {
      toast(t("photo_count", { n: 3 }));
      return;
    }
    const video = $("#reportCameraVideo");
    let dataUrl = "";
    if (video && video.srcObject && video.videoWidth) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      // Mirror to match preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
      dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    } else {
      // Demo fallback when camera is unavailable
      dataUrl =
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640">
            <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop stop-color="#3a5a40"/><stop offset="1" stop-color="#1b4332"/></linearGradient></defs>
            <rect width="100%" height="100%" fill="url(#g)"/>
            <text x="50%" y="48%" fill="#fff" font-size="28" font-family="system-ui" text-anchor="middle">TrailWatch</text>
            <text x="50%" y="56%" fill="rgba(255,255,255,.75)" font-size="18" font-family="system-ui" text-anchor="middle">Demo photo ${slot + 1}</text>
          </svg>`
        );
    }
    const next = reportPhotoList();
    next[slot] = dataUrl;
    state.reportPhotos = next;
    renderReportPhotoSlots();
    setReportDetailsOpen(true);
  }

  function destroyReportLocMap() {
    if (reportLocMap) {
      reportLocMap.remove();
      reportLocMap = null;
    }
  }

  function mountReportLocMap(lat, lng) {
    destroyReportLocMap();
    const el = $("#reportLocMap");
    if (!el || !window.L) return;
    reportLocMap = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
    }).setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(reportLocMap);
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: "",
        html: '<div class="tw-user"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
      interactive: false,
    }).addTo(reportLocMap);
    requestAnimationFrame(() => {
      reportLocMap?.invalidateSize();
      setTimeout(() => reportLocMap?.invalidateSize(), 120);
    });
  }

  function setReportDetailsOpen(open) {
    const root = $(".report-fs");
    if (!root) return;
    root.classList.toggle("has-details", !!open);
    if (open) {
      requestAnimationFrame(() => {
        reportLocMap?.invalidateSize();
        setTimeout(() => reportLocMap?.invalidateSize(), 220);
      });
    }
  }

  function clearReportFieldErrors() {
    const hint = $("#reportPhotoHint");
    if (hint) hint.hidden = true;
    $("#reportTitle")?.classList.remove("is-invalid");
    $("#reportNote")?.classList.remove("is-invalid");
    $("#reportTitleError") && ($("#reportTitleError").hidden = true);
    $("#reportNoteError") && ($("#reportNoteError").hidden = true);
  }

  function openReportForm() {
    state.overlayMode = "report";
    state.reportPhotos = [null, null, null];
    state.reportShowErrors = false;
    stopReportCamera();
    destroyReportLocMap();
    const types = Object.keys(INCIDENT_TYPES);
    const [lat, lng] = TWData.userCenter;
    openOverlay(
      t("report_incident"),
      `
      <div class="report-fs">
        <div class="report-camera" id="reportCameraStage">
          <video id="reportCameraVideo" playsinline muted autoplay></video>
          <div class="ov-camera-fallback" id="reportCameraFallback" hidden>
            <div class="ov-camera-fallback-veil"></div>
          </div>
          <button type="button" class="report-close" id="reportClose" aria-label="${esc(t("close"))}">
            ${lucideIco("x")}
          </button>
          <div class="report-camera-ui">
            <div class="report-photo-stack">
              <div class="ov-photo-slots is-camera-stack" id="reportPhotoSlots"></div>
              <p class="report-camera-hint" id="reportPhotoHint" hidden>${esc(t("photo_required"))}</p>
            </div>
            <button type="button" class="report-shutter" id="reportShutter" aria-label="${esc(t("take_photo"))}">
              <span class="report-shutter-ring"></span>
              <span class="report-shutter-core"></span>
            </button>
          </div>
          <input type="file" id="reportPhotoInput" accept="image/*" capture="environment" hidden />
        </div>
        <section class="report-sheet" id="reportDetailsSheet" aria-label="${esc(t("report_details"))}">
          <div class="report-sheet-grabber" aria-hidden="true"></div>
          <div class="report-sheet-scroll">
            <div class="ov-field">
              <label class="ov-label">${t("incident_type")}</label>
              <div class="ov-type-grid" id="reportTypes">
                ${types.map((ty, i) => typeChipBtn(ty, i === 0)).join("")}
              </div>
            </div>
            <div class="ov-field">
              <label class="ov-label">${t("location")}</label>
              <div class="ov-loc-card has-map">
                <div class="ov-loc-map" id="reportLocMap" aria-hidden="true"></div>
                <div class="ov-loc-meta">
                  <div class="ov-loc-ico">${lucideIco("locate")}</div>
                  <div>
                    <strong>${esc(t("current_location"))}</strong>
                    <span>${esc(fmtCoords(lat, lng))}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="ov-field" id="reportTitleField">
              <label class="ov-label" for="reportTitle">${t("title")}</label>
              <input id="reportTitle" class="ov-input" type="text" maxlength="80" placeholder="${esc(t("title_placeholder"))}" />
              <p class="ov-field-error" id="reportTitleError" hidden>${esc(t("toast_title_required"))}</p>
            </div>
            <div class="ov-field" id="reportNoteField">
              <label class="ov-label" for="reportNote">${t("description")}</label>
              <textarea id="reportNote" class="ov-textarea" placeholder="${esc(t("description_placeholder"))}"></textarea>
              <p class="ov-field-error" id="reportNoteError" hidden>${esc(t("toast_description_required"))}</p>
            </div>
          </div>
          <div class="report-sheet-footer">
            <button type="button" class="ios-btn ios-btn-fill ios-btn-block" id="submitReport">${t("submit_report")}</button>
          </div>
        </section>
      </div>
    `,
      {
        fullScreen: true,
        flushTop: true,
        hideClose: true,
      }
    );
    clearReportFieldErrors();
    renderReportPhotoSlots();
    startReportCamera();
    mountReportLocMap(lat, lng);
    const titleEl = $("#reportTitle");
    const noteEl = $("#reportNote");
    titleEl?.addEventListener("input", () => {
      titleEl.classList.remove("is-invalid");
      const err = $("#reportTitleError");
      if (err) err.hidden = true;
    });
    noteEl?.addEventListener("input", () => {
      noteEl.classList.remove("is-invalid");
      const err = $("#reportNoteError");
      if (err) err.hidden = true;
    });
    const input = $("#reportPhotoInput");
    if (input) {
      input.addEventListener("change", () => {
        const file = (input.files || [])[0];
        if (!file) return;
        const slot = Number(input.dataset.slot);
        const reader = new FileReader();
        reader.onload = () => {
          const next = reportPhotoList();
          const target = Number.isFinite(slot) ? slot : firstEmptyPhotoSlot();
          if (target == null) return;
          next[target] = reader.result;
          state.reportPhotos = next;
          renderReportPhotoSlots();
          setReportDetailsOpen(true);
        };
        reader.readAsDataURL(file);
        input.value = "";
      });
    }
  }

  function renderReportPhotoSlots() {
    const box = $("#reportPhotoSlots");
    if (!box) return;
    const photos = reportPhotoList();
    const filled = reportFilledPhotos().length;
    const empty = firstEmptyPhotoSlot();
    const hint = $("#reportPhotoHint");
    if (hint) {
      const showErr = state.reportShowErrors && filled === 0;
      hint.hidden = !showErr;
      hint.textContent = t("photo_required");
      hint.classList.remove("is-ok");
    }
    const shutter = $("#reportShutter");
    if (shutter) shutter.disabled = empty == null;
    const stage = $("#reportCameraStage");
    if (stage) stage.classList.toggle("is-full", empty == null);

    box.innerHTML = [0, 1, 2]
      .map((i) => {
        const src = photos[i];
        if (src) {
          return `<div class="ov-photo-slot" data-slot="${i}">
            <img src="${esc(src)}" alt="" />
            <button type="button" class="ov-photo-remove" data-remove-photo="${i}" aria-label="Remove">×</button>
          </div>`;
        }
        return `<button type="button" class="ov-photo-slot is-empty" data-fill-slot="${i}" aria-label="${esc(t("add_photo"))}">
          <span class="slot-empty-ico">${lucideIco("image-plus")}</span>
        </button>`;
      })
      .join("");
    icons();
  }

  function openLayers() {
    const p = prefs();
    const layers = ["incidents", "alerts", "new", "trending", "recommended", "groups", "live"];
    openOverlay(
      t("layers"),
      `
      <div class="ov-field">
        <label class="ov-label">${t("live_mode")}</label>
        <div class="ov-chip-row" id="liveModeChoices">
          ${["off", "friends", "nearby"].map((m) => choiceBtn(t("live_" + m), p.liveMode === m, `data-live="${m}"`)).join("")}
        </div>
      </div>
      <div class="ov-field">
        <label class="ov-label">${t("layers")}</label>
        <div class="ov-chip-row" id="layerChoices">
          ${layers.map((l) => choiceBtn(t("layer_" + l), !!p.layers[l], `data-layer="${l}"`)).join("")}
        </div>
      </div>
    `,
      {
        footer: `<button type="button" class="ios-btn ios-btn-fill ios-btn-block" id="saveLayers">${t("save")}</button>`,
      }
    );
  }

  /* —— Onboarding —— */
  let onboardStep = 0;
  let draftPrefs = null;

  function ensureDraft() {
    if (!draftPrefs) {
      const p = prefs();
      draftPrefs = {
        districts: p.districts.slice(),
        interests: p.interests.slice(),
        liveMode: p.liveMode,
        layers: { ...p.layers },
      };
    }
  }

  function renderOnboard() {
    ensureDraft();
    const progress = $$("#onboardProgress i");
    progress.forEach((el, i) => {
      el.style.background = i <= onboardStep ? "var(--ios-tint)" : "var(--ios-fill)";
    });
    $("#onboardTitle").textContent = t("onboard_title_" + (onboardStep + 1));
    $("#onboardBody").textContent = t("onboard_body_" + (onboardStep + 1));
    $("#onboardSkip").textContent = t("skip");
    $("#onboardNext").textContent = onboardStep === 2 ? t("done") : t("next");

    const box = $("#onboardChoices");
    if (onboardStep === 0) {
      const opts = Object.keys(TW_I18N.en.district_options);
      box.innerHTML = `<div class="onboard-chips">${opts
        .map((d) => choiceBtn(t("district_options." + d), draftPrefs.districts.includes(d), `data-district="${d}"`))
        .join("")}</div>`;
    } else if (onboardStep === 1) {
      const opts = Object.keys(TW_I18N.en.interest_options);
      box.innerHTML = `<div class="onboard-chips">${opts
        .map((d) => choiceBtn(t("interest_options." + d), draftPrefs.interests.includes(d), `data-interest="${d}"`))
        .join("")}</div>`;
    } else {
      box.innerHTML = `
        <div class="ov-field">
          <label class="ov-label">${t("live_mode")}</label>
          <div class="onboard-chips">
            ${["off", "friends", "nearby"]
              .map((m) => choiceBtn(t("live_" + m), draftPrefs.liveMode === m, `data-live="${m}"`))
              .join("")}
          </div>
        </div>
      `;
    }
    icons();
  }

  function showOnboard(show) {
    $("#onboard").classList.toggle("open", !!show);
    if (show) {
      onboardStep = 0;
      draftPrefs = null;
      renderOnboard();
    }
  }

  function finishOnboard() {
    ensureDraft();
    draftPrefs.layers.live = draftPrefs.liveMode !== "off";
    TWStore.setPrefs(draftPrefs);
    TWStore.setOnboarded(true);
    showOnboard(false);
    toast(t("toast_prefs"));
    refreshMapUI();
  }

  /* —— Community —— */
  function renderCommunity() {
    $("#communityTitle").textContent = t("community");
    const segs = $$("#communitySegments button");
    segs[0].textContent = t("posts");
    segs[1].textContent = t("group_hikes");
    segs.forEach((b) => b.setAttribute("data-active", b.dataset.seg === state.communitySeg ? "true" : "false"));
    $("#communitySearch").placeholder = t("search_ph");

    const filters =
      state.communitySeg === "posts"
        ? [
            { id: "all", label: t("chip_foryou") },
            { id: "friends", label: t("friends") },
            { id: "nearby", label: t("nearby") },
          ]
        : [
            { id: "all", label: t("chip_foryou") },
            { id: "friends", label: t("friends") },
            { id: "nearby", label: t("nearby") },
            { id: "hosting", label: t("hosting") },
          ];
    if (!filters.some((f) => f.id === state.communityFilter)) state.communityFilter = "all";
    $("#communityFilters").innerHTML = filters
      .map((f) => chipBtn(f.label, state.communityFilter === f.id, `data-cf="${f.id}"`))
      .join("");

    const q = (state.communityQ || "").toLowerCase();
    const store = TWStore.get();
    const list = $("#communityList");
    const empty = `<div class="empty-box">${t("no_items")}</div>`;

    if (state.communitySeg === "posts") {
      let posts = TWData.posts.slice();
      if (state.communityFilter === "friends") posts = posts.filter((p) => p.friend);
      if (state.communityFilter === "nearby") posts = posts.filter((p) => ["miu-sam", "tai-tam", "lion-rock"].includes(p.trailId));
      if (q) posts = posts.filter((p) => (p.title + p.titleZh + p.body + p.bodyZh + p.user).toLowerCase().includes(q));
      list.innerHTML = posts
        .map((p) => {
          const tr = trailById(p.trailId);
          const title = TWLang.get() === "zh" ? p.titleZh : p.title;
          const media =
            p.media && String(p.media).includes("/")
              ? `<img class="post-media" src="${esc(p.media)}" alt="" loading="lazy" style="margin:0;border-radius:0;height:150px" />`
              : `<div style="aspect-ratio:16/10;display:grid;place-items:center;background:linear-gradient(145deg,#d8f5de,#a8e0b5);font-size:15px;font-weight:600;padding:12px;text-align:center">${esc(p.media || "")} ${esc(title)}</div>`;
          return `<article class="ios-card" style="padding:0;overflow:hidden">
            <div style="display:flex;align-items:center;gap:10px;padding:12px 14px 8px">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(145deg,#34c759,#1a7f37);color:#fff;display:grid;place-items:center;font-size:13px;font-weight:700">${esc(p.user.charAt(0))}</div>
              <div>
                <div style="font-size:15px;font-weight:600">${esc(TWLang.get() === "zh" ? p.userZh : p.user)}</div>
                <div style="font-size:12px;color:var(--ios-secondary)">${esc(p.ago)} · ${esc(tr ? locName(tr) : "")}</div>
              </div>
            </div>
            ${media}
            <div style="padding:12px 14px 14px">
              <div style="font-size:16px;font-weight:600;letter-spacing:-0.02em;margin-bottom:4px">${esc(title)}</div>
              <div style="font-size:15px;line-height:1.35;color:var(--ios-label)">${esc(TWLang.get() === "zh" ? p.bodyZh : p.body)}</div>
            </div>
          </article>`;
        })
        .join("") || empty;
    } else {
      let groups = TWData.groups.map((g) => ({
        ...g,
        joined: g.joined || !!store.joinedGroups[g.id],
      }));
      if (state.communityFilter === "friends") groups = groups.filter((g) => g.friend);
      if (state.communityFilter === "nearby") groups = groups.filter((g) => g.nearby);
      if (state.communityFilter === "hosting") groups = groups.filter((g) => g.hosting);
      if (q) groups = groups.filter((g) => (g.title + g.titleZh + g.host).toLowerCase().includes(q));
      list.innerHTML = groups
        .map((g) => {
          const tr = trailById(g.trailId);
          return `<article class="ios-card">
            <div style="display:flex;align-items:flex-start;gap:10px">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(145deg,#34c759,#1a7f37);color:#fff;display:grid;place-items:center;font-size:13px;font-weight:700;flex-shrink:0">${esc((g.host || "?").charAt(0))}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:16px;font-weight:600;letter-spacing:-0.02em">${esc(TWLang.get() === "zh" ? g.titleZh : g.title)}</div>
                <div style="margin-top:2px;font-size:13px;color:var(--ios-secondary)">${t("host")}: ${esc(TWLang.get() === "zh" ? g.hostZh : g.host)} · ${esc(TWLang.get() === "zh" ? g.whenZh : g.when)}</div>
                <div style="margin-top:4px;font-size:13px;font-weight:600;color:var(--ios-tint)">${t("spots_left", { n: Math.max(0, g.spots - (g.joined && !g.hosting ? 1 : 0)) })} · ${esc(tr ? locName(tr) : "")}</div>
              </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
              <button type="button" class="ios-btn ios-btn-gray ios-btn-sm" data-group="${g.id}">${t("group_detail")}</button>
              <button type="button" class="${g.joined ? "ios-btn ios-btn-fill" : "ios-btn ios-btn-gray"} ios-btn-sm" data-join="${g.id}" ${g.joined ? "disabled" : ""}>${g.joined ? t("joined") : t("join")}</button>
              <button type="button" class="ios-btn ios-btn-plain ios-btn-sm" data-group-map="${g.id}">${t("open_on_map")}</button>
            </div>
          </article>`;
        })
        .join("") || empty;
    }
    icons();
  }

  function openGroupDetail(g) {
    const store = TWStore.get();
    const joined = g.joined || !!store.joinedGroups[g.id];
    const tr = trailById(g.trailId);
    openOverlay(TWLang.get() === "zh" ? g.titleZh : g.title, `
      <div class="ov-kv">
        <div class="ov-kv-row"><span class="k">${t("host")}</span><span class="v">${esc(TWLang.get() === "zh" ? g.hostZh : g.host)}</span></div>
        <div class="ov-kv-row"><span class="k">${t("when")}</span><span class="v">${esc(TWLang.get() === "zh" ? g.whenZh : g.when)}</span></div>
        <div class="ov-kv-row"><span class="k">${t("route")}</span><span class="v">${esc(tr ? locName(tr) : "")}</span></div>
        <div class="ov-kv-row"><span class="k">${t("spots")}</span><span class="v" style="color:var(--ios-tint)">${t("spots_left", { n: g.spots })}</span></div>
      </div>
    `, {
      footer: `<div class="ov-stack">
        <button type="button" class="${joined ? "ios-btn ios-btn-fill" : "ios-btn ios-btn-gray"} ios-btn-block" data-join="${g.id}" ${joined ? "disabled" : ""}>${joined ? t("joined") : t("join")}</button>
        <button type="button" class="ios-btn ios-btn-gray ios-btn-block" data-group-map="${g.id}">
          <i data-lucide="map-pin" style="width:18px;height:18px"></i>${t("open_on_map")}
        </button>
      </div>`,
    });
  }

  /* —— Record —— */
  function renderRecordChrome() {
    const modes = $$("#modeToggle button");
    modes[0].textContent = t("mode_track");
    modes[1].textContent = t("mode_plan");
    modes.forEach((b) => b.setAttribute("data-active", b.dataset.mode === state.recordMode ? "true" : "false"));
    $("#btnStart").textContent = t("start");
    $("#btnPause").textContent = state.paused ? t("resume") : t("pause");
    $("#btnFinish").textContent = t("finish");
    $("#btnReportLive").textContent = t("report_incident");
    $("#lblPlanTitle").textContent = t("plan_title");
    $("#btnSavePlan").textContent = t("plan_save");
    $("#planTitle").placeholder = t("plan_title");

    if (state.followTrailId) {
      const tr = trailById(state.followTrailId);
      $("#followHint").textContent = tr ? t("following", { name: locName(tr) }) : "";
    } else {
      $("#followHint").textContent = "";
    }

    const gpsText = $("#gpsPillText") || $("#gpsPill");
    if (state.recording) {
      gpsText.textContent = state.paused ? t("gps_paused") : t("gps_recording");
    } else {
      gpsText.textContent = t("gps_ready");
    }

    $("#recordIdle").classList.toggle("hidden", state.recording || state.recordMode === "plan");
    $("#recordDrawer").classList.toggle("open", state.recording && state.recordMode === "track");
    $("#planPanel").classList.toggle("open", state.recordMode === "plan" && !state.recording);

    $("#planTools").innerHTML = ["start", "end", "via", "undo"]
      .map((tool) => {
        const label =
          tool === "start"
            ? t("plan_start")
            : tool === "end"
            ? t("plan_end")
            : tool === "via"
            ? t("plan_via")
            : t("plan_undo");
        return `<button type="button" class="${state.planTool === tool ? "ios-btn ios-btn-fill" : "ios-btn ios-btn-gray"} ios-btn-sm" data-plan-tool="${tool}">${label}</button>`;
      })
      .join("");

    updatePlanStats();
    updateLiveStats();
    icons();
  }

  function haversine(a, b) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function pathDistance(pts) {
    let d = 0;
    for (let i = 1; i < pts.length; i++) d += haversine(pts[i - 1], pts[i]);
    return d;
  }

  function updateLiveStats() {
    if (!state.recording) return;
    const pts = activeRecordPath().slice(0, state.recordIdx + 1);
    const dist = pathDistance(pts);
    const elev = 40 + state.recordIdx * 28;
    const pace = dist > 0.05 ? (state.recordTick / 60) / dist : 0;
    $("#liveStats").innerHTML = `
      ${statCell(fmtDuration(state.recordTick), t("duration"))}
      ${statCell(fmtKm(dist), t("distance"))}
      ${statCell(fmtM(elev), t("gain"))}
    `;
    $("#liveStatsExtra").innerHTML = `
      ${statCell(fmtPace(pace), t("pace"))}
      ${statCell(fmtM(120 + elev), t("altitude"))}
      ${statCell(fmtM(Math.max(0, elev * 0.25)), t("loss"))}
    `;
    const samples = state.elevSamples;
    if (samples.length > 1) {
      const max = Math.max(...samples);
      const min = Math.min(...samples);
      const span = Math.max(1, max - min);
      const w = 280;
      const h = 72;
      const ptsSvg = samples
        .map((v, i) => {
          const x = (i / (samples.length - 1)) * w;
          const y = h - 8 - ((v - min) / span) * (h - 16);
          return `${x},${y}`;
        })
        .join(" ");
      $("#elevGraph").innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="h-full"><polyline fill="none" stroke="#0b421a" stroke-width="2.5" points="${ptsSvg}"/></svg>`;
    }
  }

  function updatePlanStats() {
    const dist = pathDistance(state.planPoints.map((p) => p.latlng));
    const gain = state.planPoints.length * 35;
    const hours = dist / 3.5;
    $("#planStats").innerHTML = `
      ${statCell(fmtKm(dist), t("distance"))}
      ${statCell(hours ? hours.toFixed(1) + "h" : "—", t("duration"))}
      ${statCell(fmtM(gain), t("gain"))}
    `;
  }

  function redrawPlan() {
    const latlngs = state.planPoints.map((p) => p.latlng);
    planLine.setLatLngs(latlngs);
    planMarkers.clearLayers();
    state.planPoints.forEach((p, i) => {
      const color = p.kind === "start" ? "#0b421a" : p.kind === "end" ? "#d64545" : "#4a90c8";
      L.circleMarker(p.latlng, {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: color,
        fillOpacity: 1,
      })
        .bindTooltip(p.kind + " " + (i + 1), { direction: "top" })
        .addTo(planMarkers);
    });
    updatePlanStats();
  }

  function activeRecordPath() {
    const trail = trailById(state.followTrailId);
    return trailPath(trail);
  }

  function startRecording() {
    state.recording = true;
    state.paused = false;
    state.recordIdx = 0;
    state.recordTick = 0;
    state.elevSamples = [80];
    state.recordMode = "track";
    const path = activeRecordPath();
    recordLine.setLatLngs([path[0]]);
    recordMarker.setLatLng(path[0]);
    recordMap.setView(path[0], 14);
    renderRecordChrome();
    clearInterval(state.recordTimer);
    state.recordTimer = setInterval(() => {
      if (state.paused) return;
      state.recordTick += 1;
      const path = activeRecordPath();
      if (state.recordTick % 3 === 0 && state.recordIdx < path.length - 1) {
        state.recordIdx += 1;
        const pt = path[state.recordIdx];
        recordLine.addLatLng(pt);
        recordMarker.setLatLng(pt);
        recordMap.panTo(pt, { animate: true });
        state.elevSamples.push(80 + state.recordIdx * 28 + Math.sin(state.recordIdx) * 8);
      }
      updateLiveStats();
    }, 1000);
  }

  function finishRecording() {
    clearInterval(state.recordTimer);
    state.recording = false;
    const pts = activeRecordPath().slice(0, state.recordIdx + 1);
    const dist = pathDistance(pts);
    const elev = 40 + state.recordIdx * 28;
    const loss = Math.max(0, elev * 0.25);
    const pace = dist > 0.05 ? state.recordTick / 60 / dist : 0;
    const trail = trailById(state.followTrailId);
    const defaultTitle = trail ? locName(trail) : "";
    openOverlay(
      t("finish_summary"),
      `
      <div class="activity-summary">
        <div class="activity-summary-when">${esc(fmtActivityWhen(Date.now()))}</div>
        <div class="stat-grid" style="margin-top:14px">
          ${statCell(fmtDuration(state.recordTick), t("duration"))}
          ${statCell(fmtKm(dist), t("distance"))}
          ${statCell(fmtM(elev), t("gain"))}
        </div>
        <div class="stat-grid" style="margin-top:10px">
          ${statCell(fmtPace(pace), t("pace"))}
          ${statCell(fmtM(loss), t("loss"))}
          ${statCell(String(pts.length), t("track_points"))}
        </div>
      </div>
      <div class="ov-field" style="margin-top:16px">
        <label class="ov-label" for="hikeTitle">${t("hike_title")}</label>
        <input id="hikeTitle" class="ov-input" type="text" maxlength="80" value="${esc(defaultTitle)}" placeholder="${esc(t("hike_title_ph"))}" />
      </div>
      <div class="ov-field">
        <label class="ov-label" for="hikeDetails">${t("hike_details")}</label>
        <textarea id="hikeDetails" class="ov-textarea" placeholder="${esc(t("hike_details_ph"))}"></textarea>
      </div>
      <div class="ov-field">
        <label class="ov-label">${t("privacy")}</label>
        <div class="ios-segmented" id="privacyChoices" role="tablist" aria-label="${esc(t("privacy"))}">
          <button type="button" data-privacy="public" data-active="true">${esc(t("public"))}</button>
          <button type="button" data-privacy="private" data-active="false">${esc(t("private"))}</button>
        </div>
      </div>
      <div class="ios-settings-group" style="margin-top:12px">
        <label class="ios-switch-row" for="shareCommunity">
          <span>${esc(t("share_community"))}</span>
          <input type="checkbox" id="shareCommunity" class="ios-switch-input" />
          <span class="ios-switch" aria-hidden="true"></span>
        </label>
      </div>
    `,
      {
        footer: `<button type="button" class="ios-btn ios-btn-fill ios-btn-block" id="confirmSaveActivity"
          data-dist="${dist}" data-elev="${elev}" data-loss="${loss}" data-pace="${pace}" data-dur="${state.recordTick}"
          data-points="${pts.length}" data-trail="${trail ? trail.id : ""}">${t("save_activity")}</button>`,
      }
    );
    renderRecordChrome();
  }

  /* —— Profile —— */
  function lifetimeStats() {
    const acts = TWStore.get().activities;
    const seedKm = 128.4;
    const seedElev = 6420;
    const seedHikes = 24;
    const km = seedKm + acts.reduce((s, a) => s + (a.distanceKm || 0), 0);
    const elev = seedElev + acts.reduce((s, a) => s + (a.elevGain || 0), 0);
    const hikes = seedHikes + acts.length;
    return { km, elev, hikes };
  }

  function renderProfile() {
    const store = TWStore.get();
    $("#profileName").textContent = t("your_name");
    $("#profileAvatar").textContent = (t("your_name") || "A").charAt(0);
    const life = lifetimeStats();
    $("#profileStats").innerHTML = `
      ${statCell(life.km.toFixed(1), t("km"))}
      ${statCell(Math.round(life.elev), t("m"))}
      ${statCell(life.hikes, t("hikes"))}
    `;
    const menu = [
      { id: "activities", label: t("activities"), count: store.activities.length, icon: "footprints", color: "#34c759" },
      { id: "plans", label: t("plans"), count: store.plans.length, icon: "map", color: "#007aff" },
      { id: "reports", label: t("reports"), count: store.myReports.length, icon: "triangle-alert", color: "#ff9f0a" },
      { id: "groups", label: t("groups"), count: TWData.groups.filter((g) => g.hosting || store.joinedGroups[g.id] || g.joined).length, icon: "users", color: "#af52de" },
      { id: "saved", label: t("saved_items"), count: Object.keys(store.saved).length, icon: "bookmark", color: "#ff2d55" },
      { id: "friends", label: t("friends"), count: TWData.friends.length, icon: "heart", color: "#ff3b30" },
      { id: "prefs", label: t("map_prefs"), count: "", icon: "sliders-horizontal", color: "#8e8e93" },
    ];
    $("#profileMenu").innerHTML = menu
      .map(
        (m) =>
          `<button type="button" class="ios-row" data-profile="${m.id}">
            <span class="ios-row-icon" style="background:${m.color}"><i data-lucide="${m.icon}"></i></span>
            <span style="flex:1">${m.label}</span>
            ${m.count !== "" ? `<span class="ios-row-value">${m.count}</span>` : ""}
            <span class="ios-chevron">›</span>
          </button>`
      )
      .join("");
    icons();
  }

  function openProfileSub(id) {
    const store = TWStore.get();
    $("#profileHub").classList.add("hidden");
    $("#profileSub").classList.remove("hidden");
    const titles = {
      activities: t("activities"),
      plans: t("plans"),
      reports: t("reports"),
      groups: t("groups"),
      saved: t("saved_items"),
      friends: t("friends"),
      prefs: t("map_prefs"),
    };
    $("#profileSubTitle").textContent = titles[id] || id;
    const body = $("#profileSubBody");

    const empty = `<div class="empty-box">${t("no_items")}</div>`;
    const listCard = (title, meta, extra) =>
      `<div class="ios-card"><h3 style="font-size:16px;font-weight:600;letter-spacing:-0.02em">${title}</h3><p style="margin-top:4px;font-size:13px;color:var(--ios-secondary)">${meta}</p>${extra || ""}</div>`;

    if (id === "activities") {
      body.innerHTML =
        store.activities
          .map((a) => {
            const meta = [
              fmtDuration(a.durationSec),
              fmtKm(a.distanceKm),
              "↑" + fmtM(a.elevGain),
              a.paceMinPerKm ? fmtPace(a.paceMinPerKm) : null,
              privacyLabel(a.privacy),
              a.shared ? t("shared_community") : null,
            ]
              .filter(Boolean)
              .join(" · ");
            const when = fmtActivityWhen(a.at);
            const notes = (a.notes || "").trim();
            const extra = [
              notes ? `<p class="activity-card-notes">${esc(notes)}</p>` : "",
              when ? `<p class="activity-card-when">${esc(when)}</p>` : "",
            ].join("");
            return listCard(esc(a.title), meta, extra);
          })
          .join("") || empty;
    } else if (id === "plans") {
      body.innerHTML =
        store.plans
          .map(
            (p) =>
              listCard(
                esc(p.title),
                `${fmtKm(p.distanceKm)} · ${p.points} pts`,
                `<button type="button" class="ios-btn ios-btn-gray mt-2 ios-btn-sm" data-follow-plan="${p.id}">${t("start_recording")}</button>`
              )
          )
          .join("") || empty;
    } else if (id === "reports") {
      body.innerHTML =
        store.myReports
          .map((r) => {
            const label = r.kind === "filed" ? t("report") : r.kind === "confirm" ? t("still_there") : t("not_there");
            const title = TWLang.get() === "zh" ? r.titleZh || r.title : r.title;
            return listCard(esc(title), `${label} · ${new Date(r.at).toLocaleString()}`);
          })
          .join("") || empty;
    } else if (id === "groups") {
      const groups = TWData.groups.filter((g) => g.hosting || store.joinedGroups[g.id] || g.joined);
      body.innerHTML =
        groups
          .map((g) =>
            listCard(
              esc(TWLang.get() === "zh" ? g.titleZh : g.title),
              esc(TWLang.get() === "zh" ? g.whenZh : g.when),
              `<button type="button" class="ios-btn ios-btn-gray mt-2 ios-btn-sm" data-group="${g.id}">${t("group_detail")}</button>`
            )
          )
          .join("") || empty;
    } else if (id === "saved") {
      const ids = Object.keys(store.saved);
      body.innerHTML =
        ids
          .map((sid) => {
            const meta = store.saved[sid];
            const trail = trailById(sid);
            const alert = TWData.alerts.find((a) => a.id === sid);
            const title = trail
              ? locName(trail)
              : alert
              ? TWLang.get() === "zh"
                ? alert.titleZh
                : alert.title
              : sid;
            return listCard(esc(title), meta.type);
          })
          .join("") || empty;
    } else if (id === "friends") {
      body.innerHTML = TWData.friends
        .map((f) => listCard(esc(TWLang.get() === "zh" ? f.nameZh : f.name), ""))
        .join("");
    } else if (id === "prefs") {
      const p = prefs();
      const districts = Object.keys(TW_I18N.en.district_options);
      const interests = Object.keys(TW_I18N.en.interest_options);
      const layers = ["incidents", "alerts", "new", "trending", "recommended", "groups", "live"];
      body.innerHTML = `
        <div class="ov-field"><label class="ov-label">${t("districts")}</label>
          <div class="ov-chip-row" id="prefDistricts">
            ${districts.map((d) => choiceBtn(t("district_options." + d), p.districts.includes(d), `data-district="${d}"`)).join("")}
          </div>
        </div>
        <div class="ov-field"><label class="ov-label">${t("interests")}</label>
          <div class="ov-chip-row" id="prefInterests">
            ${interests.map((d) => choiceBtn(t("interest_options." + d), p.interests.includes(d), `data-interest="${d}"`)).join("")}
          </div>
        </div>
        <div class="ov-field"><label class="ov-label">${t("live_mode")}</label>
          <div class="ov-chip-row" id="prefLive">
            ${["off", "friends", "nearby"].map((m) => choiceBtn(t("live_" + m), p.liveMode === m, `data-live="${m}"`)).join("")}
          </div>
        </div>
        <div class="ov-field"><label class="ov-label">${t("layers")}</label>
          <div class="ov-chip-row" id="prefLayers">
            ${layers.map((l) => choiceBtn(t("layer_" + l), !!p.layers[l], `data-layer="${l}"`)).join("")}
          </div>
        </div>
        <button type="button" class="ios-btn ios-btn-fill ios-btn-block" id="saveProfilePrefs">${t("save")}</button>
      `;
    }
    icons();
  }

  function closeProfileSub() {
    $("#profileSub").classList.add("hidden");
    $("#profileHub").classList.remove("hidden");
    renderProfile();
  }

  /* —— Navigation —— */
  function setView(view) {
    state.view = view;
    $$(".view").forEach((v) => v.classList.toggle("active", v.dataset.view === view));
    $$("#bottomNav .ios-tab").forEach((b) => {
      const on = b.dataset.nav === view;
      b.setAttribute("data-active", on ? "true" : "false");
      b.classList.toggle("active", on);
    });
    if (view === "map") {
      setTimeout(() => map && map.invalidateSize(), 50);
      refreshMapUI();
    }
    if (view === "community") renderCommunity();
    if (view === "record") {
      setTimeout(() => {
        if (!recordMap) return;
        recordMap.invalidateSize();
        if (!state.recording) {
          if (state.recordMode === "plan" && state.planPoints.length) {
            redrawPlan();
            recordMap.fitBounds(L.latLngBounds(state.planPoints.map((p) => p.latlng)), {
              padding: [40, 40],
            });
          } else {
            const path = activeRecordPath();
            recordMap.fitBounds(L.latLngBounds(path), { padding: [40, 40] });
          }
        }
      }, 120);
      renderRecordChrome();
    }
    if (view === "you") {
      closeProfileSub();
      renderProfile();
    }
    icons();
  }

  function applyI18nChrome() {
    $("#appTitle").textContent = t("app_title");
    $("#resetDemo").textContent = t("reset_demo");
    $$("#langSwitch button").forEach((b) => {
      b.setAttribute("data-active", b.dataset.lang === TWLang.get() ? "true" : "false");
    });
    $$("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    const searchInput = $("#searchPanelInput");
    if (searchInput) searchInput.placeholder = t("search_ph");
    updateMapSearchChrome();
    document.documentElement.lang = TWLang.get() === "zh" ? "zh-Hant" : "en";
  }

  function refreshAll() {
    applyI18nChrome();
    refreshMapUI();
    renderCommunity();
    renderRecordChrome();
    renderProfile();
    if ($("#onboard").classList.contains("open")) renderOnboard();
  }

  /* —— Events —— */
  function bindEvents() {
    $("#langSwitch").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-lang]");
      if (!btn) return;
      TWLang.set(btn.dataset.lang);
      refreshAll();
    });

    $("#resetDemo").addEventListener("click", () => {
      TWStore.reset();
      state.followTrailId = null;
      state.planPoints = [];
      toast("Demo reset");
      showOnboard(true);
      setView("map");
      refreshAll();
    });

    $("#bottomNav").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-nav]");
      if (!btn) return;
      setView(btn.dataset.nav);
    });

    $("#sheetHandle").addEventListener("click", () => {
      if (state.sheet === "peek") setSheet("half");
      else if (state.sheet === "half") setSheet("full");
      else setSheet("peek");
    });

    $("#sheetPeek").addEventListener("click", () => {
      setSheet(state.sheet === "peek" ? "half" : "peek");
    });

    $("#sheetExploreSubs")?.addEventListener("click", (e) => {
      const sub = e.target.closest("[data-explore-sub]");
      if (!sub) return;
      state.exploreSub = sub.dataset.exploreSub || "editorial";
      if (state.sheet === "peek") setSheet("half");
      refreshMapUI();
    });

    $("#sheetChips").addEventListener("click", (e) => {
      const chip = e.target.closest("[data-chip]");
      if (!chip) return;
      state.chip = chip.dataset.chip;
      if (state.chip === "explore" && !state.exploreSub) state.exploreSub = "editorial";
      if (state.sheet === "peek") setSheet("half");
      refreshMapUI();
    });

    $("#sheetBody").addEventListener("click", (e) => {
      const card = e.target.closest("[data-open]");
      if (!card) return;
      const kind = card.dataset.open;
      const id = card.dataset.id;
      if (kind === "incident") {
        const item = allIncidents().find((x) => x.id === id);
        if (item) openIncident(item);
      } else if (kind === "alert") {
        const item = TWData.alerts.find((x) => x.id === id);
        if (item) openAlert(item);
      } else if (kind === "trail") {
        const item = trailById(id);
        if (item) openTrail(item, card.dataset.tag);
      } else if (kind === "hiker") {
        const item = TWData.hikers.find((x) => x.id === id);
        if (item) openHiker(item);
      }
    });

    $("#mapSearchTrigger")?.addEventListener("click", () => openSearchPanel());
    $("#searchBack")?.addEventListener("click", closeSearchPanel);
    $("#searchClear")?.addEventListener("click", () => {
      state.search = "";
      const input = $("#searchPanelInput");
      if (input) input.value = "";
      renderSearchPanel();
      updateMapSearchChrome();
    });
    $("#searchPanelInput")?.addEventListener("input", (e) => {
      state.search = e.target.value;
      renderSearchPanel();
      updateMapSearchChrome();
    });
    $("#btnSearchFilter")?.addEventListener("click", openSearchFilters);
    $("#searchPanelBody")?.addEventListener("click", (e) => {
      const sample = e.target.closest("[data-sample-q]");
      if (sample) {
        const q = sample.dataset.sampleQ || "";
        state.search = q;
        const input = $("#searchPanelInput");
        if (input) input.value = q;
        pushSearchRecent(q);
        renderSearchPanel();
        updateMapSearchChrome();
        return;
      }
      const card = e.target.closest("[data-search-trail]");
      if (card) {
        const tr = trailById(card.dataset.searchTrail);
        if (!tr) return;
        pushSearchRecent(state.search || locName(tr));
        closeSearchPanel();
        setSheet("half");
        openTrail(tr, (tr.tags || [])[0] || "recommended");
      }
    });

    $("#btnRecenter").addEventListener("click", () => {
      map.setView(TWData.userCenter, 13);
    });
    $("#btnLayers").addEventListener("click", openLayers);
    $("#btnReport").addEventListener("click", openReportForm);

    $("#overlayClose").addEventListener("click", closeOverlay);
    $("#overlay").addEventListener("click", (e) => {
      if (e.target === $("#overlay")) closeOverlay();
    });
    $("#trailMapLightboxClose").addEventListener("click", closeTrailMapExpanded);

    const onOverlayAction = (e) => {
      const vote = e.target.closest("[data-vote]");
      if (vote) {
        const inc = allIncidents().find((x) => x.id === vote.dataset.id) || TWData.incidents.find((x) => x.id === vote.dataset.id);
        if (!inc) return;
        TWStore.voteIncident(inc, vote.dataset.vote);
        const rt = TWStore.getIncidentRuntime(inc);
        if (rt.status === "cleared") toast(t("toast_cleared"));
        else toast(vote.dataset.vote === "still" ? t("toast_confirmed") : t("toast_dismissed"));
        closeOverlay();
        refreshMapUI();
        return;
      }

      const up = e.target.closest("[data-upvote]");
      if (up) {
        TWStore.toggleUpvote(up.dataset.upvote);
        toast(t("toast_upvoted"));
        const trail = trailById(up.dataset.upvote);
        const alert = TWData.alerts.find((a) => a.id === up.dataset.upvote);
        if (trail) openTrail(trail);
        else if (alert) openAlert(alert);
        return;
      }

      const saveBtn = e.target.closest("[data-save]");
      if (saveBtn) {
        TWStore.toggleSave(saveBtn.dataset.save, saveBtn.dataset.type);
        toast(t("toast_saved"));
        const trail = trailById(saveBtn.dataset.save);
        const alert = TWData.alerts.find((a) => a.id === saveBtn.dataset.save);
        if (trail) openTrail(trail);
        else if (alert) openAlert(alert);
        return;
      }

      const expandMap = e.target.closest("[data-expand-trail-map]");
      if (expandMap) {
        const trail = trailById(expandMap.dataset.expandTrailMap) || trailMapItem;
        openTrailMapExpanded(trail);
        return;
      }

      const editRoute = e.target.closest("[data-edit-route]");
      if (editRoute) {
        loadTrailIntoPlan(editRoute.dataset.editRoute);
        return;
      }

      const start = e.target.closest("[data-start-trail]");
      if (start) {
        const trail = trailById(start.dataset.startTrail);
        state.followTrailId = start.dataset.startTrail;
        state.recordMode = "track";
        state.recording = false;
        closeOverlay();
        setView("record");
        ensureTrailPath(trail).then((path) => {
          setTimeout(() => {
            if (!recordMap || !path) return;
            recordMap.invalidateSize();
            recordMap.fitBounds(L.latLngBounds(path), { padding: [40, 40] });
            if (recordLine) recordLine.setLatLngs([path[0]]);
            if (recordMarker) recordMarker.setLatLng(path[0]);
            renderRecordChrome();
          }, 140);
        });
        return;
      }

      const focus = e.target.closest("[data-focus-map]");
      if (focus) {
        const [lat, lng] = focus.dataset.focusMap.split(",").map(Number);
        closeOverlay();
        setView("map");
        map.setView([lat, lng], 15);
        return;
      }

      const join = e.target.closest("[data-join]");
      if (join) {
        TWStore.joinGroup(join.dataset.join);
        toast(t("toast_joined"));
        const g = TWData.groups.find((x) => x.id === join.dataset.join);
        if (g) openGroupDetail(g);
        renderCommunity();
        return;
      }

      const gmap = e.target.closest("[data-group-map]");
      if (gmap) {
        const g = TWData.groups.find((x) => x.id === gmap.dataset.groupMap);
        if (!g) return;
        TWStore.setPrefs({ layers: { ...prefs().layers, groups: true } });
        closeOverlay();
        setView("map");
        map.setView([g.lat, g.lng], 15);
        refreshMapUI();
        return;
      }

      const typeBtn = e.target.closest("#reportTypes .ios-chip");
      if (typeBtn) {
        $$("#reportTypes .ios-chip").forEach((c) => c.classList.remove("ios-chip-active"));
        typeBtn.classList.add("ios-chip-active");
        return;
      }

      const reportClose = e.target.closest("#reportClose");
      if (reportClose) {
        closeOverlay();
        return;
      }

      const shutter = e.target.closest("#reportShutter");
      if (shutter) {
        captureReportPhoto();
        return;
      }

      const fillSlot = e.target.closest("[data-fill-slot]");
      if (fillSlot) {
        const input = $("#reportPhotoInput");
        if (input) {
          input.dataset.slot = fillSlot.dataset.fillSlot;
          input.click();
        }
        return;
      }

      const removePhoto = e.target.closest("[data-remove-photo]");
      if (removePhoto) {
        const idx = Number(removePhoto.dataset.removePhoto);
        const next = reportPhotoList();
        next[idx] = null;
        state.reportPhotos = next;
        renderReportPhotoSlots();
        return;
      }

      const submitReport = e.target.closest("#submitReport");
      if (submitReport) {
        const type = ($("#reportTypes .ios-chip-active") || {}).dataset?.type || "waste_dumping";
        const titleEl = $("#reportTitle");
        const noteEl = $("#reportNote");
        const title = (titleEl?.value || "").trim();
        const note = (noteEl?.value || "").trim();
        const photos = reportFilledPhotos();
        state.reportShowErrors = true;
        clearReportFieldErrors();

        let valid = true;
        if (!photos.length) {
          valid = false;
          const hint = $("#reportPhotoHint");
          if (hint) hint.hidden = false;
        }
        if (!title) {
          valid = false;
          titleEl?.classList.add("is-invalid");
          const err = $("#reportTitleError");
          if (err) err.hidden = false;
        }
        if (!note) {
          valid = false;
          noteEl?.classList.add("is-invalid");
          const err = $("#reportNoteError");
          if (err) err.hidden = false;
        }
        if (!valid) {
          if (!photos.length) {
            /* keep camera focus for missing photo */
          } else if (!title) {
            titleEl?.focus();
          } else {
            noteEl?.focus();
          }
          return;
        }

        const [lat, lng] = TWData.userCenter;
        const report = {
          id: "user-" + Date.now(),
          type,
          title,
          titleZh: title,
          lat,
          lng,
          trailId: null,
          useCurrentLocation: true,
          severity: type === "tree_felling" || type === "suspicious" ? "high" : "med",
          ageMin: 0,
          confirms: 1,
          dismisses: 0,
          note,
          noteZh: note,
          status: "active",
          photos,
        };
        TWStore.addUserReport(report);
        stopReportCamera();
        state.reportPhotos = [null, null, null];
        state.reportShowErrors = false;
        toast(t("toast_reported"));
        closeOverlay();
        refreshMapUI();
        return;
      }

      const live = e.target.closest("#liveModeChoices [data-live]");
      if (live) {
        $$("#liveModeChoices .ios-chip").forEach((c) => c.classList.remove("ios-chip-active"));
        live.classList.add("ios-chip-active");
        return;
      }
      const layer = e.target.closest("#layerChoices [data-layer]");
      if (layer) {
        layer.classList.toggle("ios-chip-active");
        return;
      }
      const saveLayers = e.target.closest("#saveLayers");
      if (saveLayers) {
        const liveMode = ($("#liveModeChoices .ios-chip-active") || {}).dataset?.live || "off";
        const layers = {};
        $$("#layerChoices .ios-chip").forEach((c) => {
          layers[c.dataset.layer] = c.classList.contains("ios-chip-active");
        });
        layers.live = liveMode !== "off" ? true : layers.live;
        TWStore.setPrefs({ liveMode, layers });
        toast(t("toast_prefs"));
        closeOverlay();
        refreshMapUI();
        return;
      }

      const diffChip = e.target.closest("#searchDiffRow [data-search-diff]");
      if (diffChip) {
        $$("#searchDiffRow [data-search-diff]").forEach((c) => c.classList.remove("is-on"));
        diffChip.classList.add("is-on");
        return;
      }

      if (e.target.closest("#resetSearchFilters")) {
        state.searchFilters = defaultSearchFilters();
        closeOverlay();
        updateSearchFilterDots();
        if (state.searchOpen) renderSearchPanel();
        refreshMapUI();
        return;
      }

      if (e.target.closest("#applySearchFilters")) {
        const diffOn = $("#searchDiffRow [data-search-diff].is-on");
        state.searchFilters = {
          district: $("#searchDistrict")?.value || "all",
          difficulty: diffOn?.dataset.searchDiff || "all",
          duration: $("#searchDuration")?.value || "all",
          distance: $("#searchDistance")?.value || "all",
        };
        closeOverlay();
        updateSearchFilterDots();
        if (state.searchOpen) renderSearchPanel();
        else {
          if (state.sheet === "peek") setSheet("half");
          refreshMapUI();
        }
        return;
      }

      const priv = e.target.closest("#privacyChoices [data-privacy]");
      if (priv) {
        $$("#privacyChoices [data-privacy]").forEach((c) => c.setAttribute("data-active", "false"));
        priv.setAttribute("data-active", "true");
        return;
      }

      const confirmSave = e.target.closest("#confirmSaveActivity");
      if (confirmSave) {
        const btn = confirmSave;
        const privacy =
          ($("#privacyChoices [data-privacy][data-active='true']") || {}).dataset?.privacy || "public";
        const share = $("#shareCommunity")?.checked;
        const trail = trailById(btn.dataset.trail);
        const titleEl = $("#hikeTitle");
        const detailsEl = $("#hikeDetails");
        const title = (titleEl?.value || "").trim() || t("hike_untitled");
        const notes = (detailsEl?.value || "").trim();
        TWStore.addActivity({
          id: "act-" + Date.now(),
          title,
          titleZh: title,
          notes,
          trailId: trail ? trail.id : null,
          distanceKm: Number(btn.dataset.dist) || 0,
          elevGain: Number(btn.dataset.elev) || 0,
          elevLoss: Number(btn.dataset.loss) || 0,
          paceMinPerKm: Number(btn.dataset.pace) || 0,
          durationSec: Number(btn.dataset.dur) || 0,
          points: Number(btn.dataset.points) || 0,
          privacy,
          shared: !!share,
          at: Date.now(),
        });
        state.followTrailId = null;
        toast(t("toast_activity"));
        closeOverlay();
        setView("you");
        openProfileSub("activities");
        return;
      }
    };
    $("#overlayBody").addEventListener("click", onOverlayAction);
    $("#overlayFooter").addEventListener("click", onOverlayAction);

    // Onboarding
    $("#onboardChoices").addEventListener("click", (e) => {
      ensureDraft();
      const d = e.target.closest("[data-district]");
      if (d) {
        const id = d.dataset.district;
        const i = draftPrefs.districts.indexOf(id);
        if (i >= 0) draftPrefs.districts.splice(i, 1);
        else draftPrefs.districts.push(id);
        renderOnboard();
        return;
      }
      const interest = e.target.closest("[data-interest]");
      if (interest) {
        const id = interest.dataset.interest;
        const i = draftPrefs.interests.indexOf(id);
        if (i >= 0) draftPrefs.interests.splice(i, 1);
        else draftPrefs.interests.push(id);
        renderOnboard();
        return;
      }
      const live = e.target.closest("[data-live]");
      if (live) {
        draftPrefs.liveMode = live.dataset.live;
        renderOnboard();
      }
    });
    $("#onboardSkip").addEventListener("click", finishOnboard);
    $("#onboardNext").addEventListener("click", () => {
      if (onboardStep < 2) {
        onboardStep += 1;
        renderOnboard();
      } else finishOnboard();
    });

    // Community
    $("#communitySegments").addEventListener("click", (e) => {
      const b = e.target.closest("[data-seg]");
      if (!b) return;
      state.communitySeg = b.dataset.seg;
      state.communityFilter = "all";
      renderCommunity();
    });
    $("#communityFilters").addEventListener("click", (e) => {
      const b = e.target.closest("[data-cf]");
      if (!b) return;
      state.communityFilter = b.dataset.cf;
      renderCommunity();
    });
    $("#communitySearch").addEventListener("input", (e) => {
      state.communityQ = e.target.value;
      renderCommunity();
    });
    $("#communityList").addEventListener("click", (e) => {
      const join = e.target.closest("[data-join]");
      if (join) {
        TWStore.joinGroup(join.dataset.join);
        toast(t("toast_joined"));
        renderCommunity();
        return;
      }
      const g = e.target.closest("[data-group]");
      if (g) {
        const group = TWData.groups.find((x) => x.id === g.dataset.group);
        if (group) openGroupDetail(group);
        return;
      }
      const gmap = e.target.closest("[data-group-map]");
      if (gmap) {
        const group = TWData.groups.find((x) => x.id === gmap.dataset.groupMap);
        if (!group) return;
        TWStore.setPrefs({ layers: { ...prefs().layers, groups: true } });
        setView("map");
        map.setView([group.lat, group.lng], 15);
        refreshMapUI();
      }
    });

    // Record
    $("#modeToggle").addEventListener("click", (e) => {
      const b = e.target.closest("[data-mode]");
      if (!b || state.recording) return;
      state.recordMode = b.dataset.mode;
      renderRecordChrome();
    });
    $("#btnStart").addEventListener("click", startRecording);
    $("#btnPause").addEventListener("click", () => {
      state.paused = !state.paused;
      renderRecordChrome();
    });
    $("#btnFinish").addEventListener("click", finishRecording);
    $("#btnReportLive").addEventListener("click", openReportForm);
    $("#drawerHandle").addEventListener("click", () => {
      $("#recordDrawer").classList.toggle("expanded");
    });
    $("#planTools").addEventListener("click", (e) => {
      const b = e.target.closest("[data-plan-tool]");
      if (!b) return;
      if (b.dataset.planTool === "undo") {
        state.planPoints.pop();
        redrawPlan();
        renderRecordChrome();
        return;
      }
      state.planTool = b.dataset.planTool;
      renderRecordChrome();
    });
    $("#btnSavePlan").addEventListener("click", () => {
      if (state.planPoints.length < 2) {
        toast("Add start & end");
        return;
      }
      const title = $("#planTitle").value.trim() || "Plan " + new Date().toLocaleDateString();
      TWStore.addPlan({
        id: "plan-" + Date.now(),
        title,
        distanceKm: pathDistance(state.planPoints.map((p) => p.latlng)),
        points: state.planPoints.length,
        at: Date.now(),
      });
      toast(t("toast_plan"));
      state.planPoints = [];
      redrawPlan();
      $("#planTitle").value = "";
    });

    recordMap.on("click", (e) => {
      if (state.recordMode !== "plan" || state.recording) return;
      const kind = state.planTool === "via" ? "via" : state.planTool;
      if (kind === "start") {
        state.planPoints = state.planPoints.filter((p) => p.kind !== "start");
        state.planPoints.unshift({ kind: "start", latlng: [e.latlng.lat, e.latlng.lng] });
      } else if (kind === "end") {
        state.planPoints = state.planPoints.filter((p) => p.kind !== "end");
        state.planPoints.push({ kind: "end", latlng: [e.latlng.lat, e.latlng.lng] });
      } else {
        const endIdx = state.planPoints.findIndex((p) => p.kind === "end");
        const pt = { kind: "via", latlng: [e.latlng.lat, e.latlng.lng] };
        if (endIdx >= 0) state.planPoints.splice(endIdx, 0, pt);
        else state.planPoints.push(pt);
      }
      redrawPlan();
    });

    // Profile
    $("#profileMenu").addEventListener("click", (e) => {
      const item = e.target.closest("[data-profile]");
      if (!item) return;
      openProfileSub(item.dataset.profile);
    });
    $("#profileBack").addEventListener("click", closeProfileSub);
    $("#profileSubBody").addEventListener("click", (e) => {
      const g = e.target.closest("[data-group]");
      if (g) {
        const group = TWData.groups.find((x) => x.id === g.dataset.group);
        if (group) openGroupDetail(group);
        return;
      }
      const follow = e.target.closest("[data-follow-plan]");
      if (follow) {
        setView("record");
        return;
      }
      // prefs editors
      const d = e.target.closest("#prefDistricts [data-district]");
      if (d) {
        d.classList.toggle("ios-chip-active");
        return;
      }
      const interest = e.target.closest("#prefInterests [data-interest]");
      if (interest) {
        interest.classList.toggle("ios-chip-active");
        return;
      }
      const live = e.target.closest("#prefLive [data-live]");
      if (live) {
        $$("#prefLive .ios-chip").forEach((c) => c.classList.remove("ios-chip-active"));
        live.classList.add("ios-chip-active");
        return;
      }
      const layer = e.target.closest("#prefLayers [data-layer]");
      if (layer) {
        layer.classList.toggle("ios-chip-active");
        return;
      }
      if (e.target.id === "saveProfilePrefs") {
        const districts = $$("#prefDistricts .ios-chip-active").map((c) => c.dataset.district);
        const interests = $$("#prefInterests .ios-chip-active").map((c) => c.dataset.interest);
        const liveMode = ($("#prefLive .ios-chip-active") || {}).dataset?.live || "off";
        const layers = {};
        $$("#prefLayers .ios-chip").forEach((c) => {
          layers[c.dataset.layer] = c.classList.contains("ios-chip-active");
        });
        layers.live = liveMode !== "off";
        TWStore.setPrefs({ districts, interests, liveMode, layers });
        toast(t("toast_prefs"));
        refreshMapUI();
      }
    });

    icons();
  }

  function boot() {
    applyI18nChrome();
    initMaps();
    bindEvents();
    refreshMapUI();
    renderCommunity();
    renderRecordChrome();
    renderProfile();
    if (!TWStore.get().onboarded) showOnboard(true);
    setView("map");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
