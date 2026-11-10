# TrailWatch map-first prototype

Clickable phone-frame UX prototype that redesigns TrailWatch around a preference-driven map home (Waze-style alerts), one Community page for posts and group hikes, and an AllTrails-style hike recorder.

## Run

```bash
cd trailwatch-prototype
python3 -m http.server 5173
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## What to try

1. **Onboarding** — districts, interests, live-hiker mode (saved in `localStorage`).
2. **Map** — chips (For you / Incidents / Alerts / New / Trending / Recommended / Live), pin sheets, Still there / Not there, upvote & save on trails/news, report (+).
3. **Community** — Posts and Group hikes on one page; join a hike; open meeting point on the map.
4. **Record** — Track with simulated GPS, Pause / Finish summary; Plan mode with start/end/via.
5. **You** — Activities, Plans, Reports, Groups, Saved, Friends, Map preferences.
6. **EN / 繁** — language toggle above the phone; **Reset demo** clears saved state.

## Compared with the audited build

Audit target: [TrailWatch Community feed](https://claulung813-web.github.io/trailwatch-hk/app/home.html).

| Before | This prototype |
|--------|----------------|
| Community feed + Explore lists overlap | Map is home; Explore catalog removed |
| Group hikes on a Community subtab | Posts + Group hikes on one Community page |
| Mixed feed filters | Named map chips + preference-based For you |
| Profile “view more” previews | Structured activity lists |

## Stack

- Fixed **iPhone 18 Pro** canvas **402×874** (19.5:9) phone frame
- **iOS 26/27 Liquid Glass** shell: floating equal-weight tab bar (HIG — no raised FAB), glass materials, SF system font stack
- **Lucide** icons (SF Symbol–like weight)
- **Leaflet** + OSM tiles for maps
- TrailWatch green as iOS tint
- Sample routes in `js/data.js` (Miu Sam Ancient Trail + browse categories) with local covers in `assets/trails/`
