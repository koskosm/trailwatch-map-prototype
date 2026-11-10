/* localStorage store for preferences, votes, activities */
window.TWStore = (() => {
  const KEY = "tw_proto_v1";

  const defaults = () => ({
    onboarded: false,
    prefs: {
      districts: ["hki", "kln"],
      interests: ["ridge", "easy"],
      layers: {
        incidents: true,
        alerts: true,
        new: true,
        trending: true,
        recommended: true,
        groups: false,
        live: false,
      },
      liveMode: "off", // off | friends | nearby
    },
    votes: {
      // incidentId -> { still: bool, not: bool }
    },
    incidentState: {
      // incidentId -> { confirms, dismisses, status }
    },
    upvotes: {}, // id -> true
    saved: {}, // id -> { type, at }
    joinedGroups: {}, // groupId -> true
    activities: [],
    plans: [],
    myReports: [], // filed + confirm/dismiss history
    userReports: [], // user-submitted incidents
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      const base = defaults();
      return {
        ...base,
        ...parsed,
        prefs: {
          ...base.prefs,
          ...(parsed.prefs || {}),
          layers: { ...base.prefs.layers, ...((parsed.prefs && parsed.prefs.layers) || {}) },
        },
      };
    } catch (e) {
      return defaults();
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  let state = load();

  function get() {
    return state;
  }

  function update(mutator) {
    mutator(state);
    save(state);
    return state;
  }

  function reset() {
    localStorage.removeItem(KEY);
    state = defaults();
    return state;
  }

  function setOnboarded(done) {
    return update((s) => {
      s.onboarded = !!done;
    });
  }

  function setPrefs(partial) {
    return update((s) => {
      if (partial.districts) s.prefs.districts = partial.districts.slice();
      if (partial.interests) s.prefs.interests = partial.interests.slice();
      if (partial.liveMode) s.prefs.liveMode = partial.liveMode;
      if (partial.layers) Object.assign(s.prefs.layers, partial.layers);
    });
  }

  function getIncidentRuntime(inc) {
    const over = state.incidentState[inc.id];
    return {
      confirms: over ? over.confirms : inc.confirms,
      dismisses: over ? over.dismisses : inc.dismisses,
      status: over ? over.status : inc.status,
    };
  }

  function voteIncident(inc, kind) {
    // kind: 'still' | 'not'
    return update((s) => {
      const prev = s.votes[inc.id] || {};
      if (prev[kind]) return; // already voted this way
      const runtime = getIncidentRuntime(inc);
      let confirms = runtime.confirms;
      let dismisses = runtime.dismisses;
      let status = runtime.status;

      // undo opposite vote if switching
      if (kind === "still" && prev.not) dismisses = Math.max(0, dismisses - 1);
      if (kind === "not" && prev.still) confirms = Math.max(0, confirms - 1);

      if (kind === "still") confirms += 1;
      if (kind === "not") dismisses += 1;

      if (dismisses >= 3) status = "cleared";

      s.votes[inc.id] = {
        still: kind === "still" ? true : false,
        not: kind === "not" ? true : false,
      };
      s.incidentState[inc.id] = { confirms, dismisses, status };
      s.myReports.unshift({
        id: "vote-" + inc.id + "-" + Date.now(),
        kind: kind === "still" ? "confirm" : "dismiss",
        incidentId: inc.id,
        title: inc.title,
        titleZh: inc.titleZh,
        at: Date.now(),
      });
    });
  }

  function toggleUpvote(id) {
    return update((s) => {
      if (s.upvotes[id]) delete s.upvotes[id];
      else s.upvotes[id] = true;
    });
  }

  function toggleSave(id, type, meta) {
    return update((s) => {
      if (s.saved[id]) delete s.saved[id];
      else s.saved[id] = { type, at: Date.now(), ...(meta || {}) };
    });
  }

  function joinGroup(id) {
    return update((s) => {
      s.joinedGroups[id] = true;
    });
  }

  function addActivity(act) {
    return update((s) => {
      s.activities.unshift(act);
    });
  }

  function addPlan(plan) {
    return update((s) => {
      s.plans.unshift(plan);
    });
  }

  function addUserReport(report) {
    return update((s) => {
      s.userReports.unshift(report);
      s.myReports.unshift({
        id: "filed-" + report.id,
        kind: "filed",
        incidentId: report.id,
        title: report.title,
        titleZh: report.titleZh,
        at: Date.now(),
      });
    });
  }

  return {
    get,
    update,
    reset,
    setOnboarded,
    setPrefs,
    getIncidentRuntime,
    voteIncident,
    toggleUpvote,
    toggleSave,
    joinGroup,
    addActivity,
    addPlan,
    addUserReport,
    KEY,
  };
})();
