# CDC UNC 2026 Datathon: Mixed Feelings

Hackathon project (due Sun 2026-09-27, 10am ET). The dataset is `mxmh_survey_results.csv`
(MxMH survey: 736 respondents, 16 genre-frequency columns, self-rated 0–10 Anxiety /
Depression / Insomnia / OCD). The web app lives in `web/`; see `web/README.md` for setup.

## What the app does
Receiptify-style: log in with Spotify → read top 50 artists (4 weeks / **6 months default** / all time) →
1. Radar of your top 5 genres, using the survey's 16 broad genres (not Spotify micro-genres)
2. A fun title ("Moody Metalhead"): noun from genre #1, adjective from genre #2 or taste variety, with a dice reroll
3. Radar of the 4 mental-health scores reported by survey respondents with similar genre habits,
   overlaid on the whole-survey average, plus a "% say music improves their mental health" callout

## Decisions already agreed with the team (don't undo without asking)
- Stack: React + Vite + Chart.js, browser-only Spotify PKCE login (no server, no client secret)
- Spotify only. Apple Music was dropped (needs a paid dev account plus a signed server token, and has no top-artists-by-time endpoint)
- No public demo mode: login is the point. `?mock=metal|pop|mixed|nogenres` exists **in dev only**
- Genre mapping: every Spotify/Last.fm tag goes to the nearest survey genre, plus a neighbour at half weight (`web/src/lib/genreMap.js`)
- The title must NEVER be based on the mental-health results
- Framing: "listeners like you reported…", always shown next to the survey average, with a "not a diagnosis" note
- The team is building better models. `web/src/model/index.js` is the swap point (kNN default; `linear` reads `src/data/linear_model.json`)
- Look: artsy, playful, app-like (the team referenced the Chick-fil-A app): cream background, bold colors, chunky offset shadows, Bricolage Grotesque + DM Sans

## Gotchas
- **Spotify Feb 2026 rules:** dev-mode apps allow 5 users max (added by hand in the dashboard), and the app owner needs Premium
- **Spotify artist `genres` is deprecated** and came back empty in real testing (the "Mysterious Listener, 0 artists" bug).
  `web/src/lib/genreSources.js` fills genres from Last.fm (`VITE_LASTFM_API_KEY`), falling back to MusicBrainz (top 15 artists, 1 request/second)
- Redirect URIs must match exactly with a trailing slash: `http://127.0.0.1:5173/` (never `localhost`) and `https://<user>.github.io/<repo>/`
- Env: `web/.env.local` (git-ignored) holds `VITE_SPOTIFY_CLIENT_ID` and `VITE_LASTFM_API_KEY`. Restart `npm run dev` after editing it
- Deploy: `.github/workflows/deploy-web.yml` → GitHub Pages. Needs the repo variables `SPOTIFY_CLIENT_ID` and `LASTFM_API_KEY`

## Commands (run in `web/`)
- `npm run dev`: http://127.0.0.1:5173/
- `npm run check`: runs the pipeline (genre mapping → profile → both models) on mock listeners
- `npm run build`, `npm run lint`
- `npm run data`: regenerate `src/data/survey.json` and the sample `linear_model.json` from the CSV (needs pandas + numpy)

## Open ideas / next steps
- Replace the sample model with the team's model (keep the `predict(profile)` contract)
- Grow `genreMap.js` rules using the "Tags with no rule yet" list in the app's *Under the hood* panel
