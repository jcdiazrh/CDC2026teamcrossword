# CDC UNC 2026 Datathon: Mixed Feelings

Hackathon project (due Sun 2026-09-27, 10am ET). The dataset is `mxmh_survey_results.csv`
(MxMH survey: 736 respondents, 16 genre-frequency columns, self-rated 0–10 Anxiety /
Depression / Insomnia / OCD). The web app lives in `codebase/website/mixed-feelings_cd/web/` (called `web/` below); see its README for setup. The team's R linear model is in `musictomentalhealthlm.qmd` (genres coded 0 = never/rarely, 1 = sometimes/very frequently).

## What the app does
Receiptify-style: log in with Spotify → read top 50 artists (4 weeks / **6 months default** / all time) →
1. Radar of your top 5 genres (toggle: all 13). **13 display groups** = the survey's 16 with Hip hop+Rap, Pop+K pop, Rock+Metal merged (`web/src/lib/groups.js`); models still use all 16
2. A fun title ("Moody Metalhead"): noun from genre #1, adjective from genre #2 or taste variety, with a dice reroll
3. Radar of the 4 mental-health scores reported by survey respondents with similar genre habits,
   overlaid on the whole-survey average, plus a "% say music improves their mental health" callout

4. **Feelings → Music** (dark mode, slide switch at the top, no login): user sets the 4 scores → `web/src/model/reverse.js`
   finds the 60 nearest respondents by those scores → share who listen (Sometimes+) to each of the 13 groups vs everyone,
   the most over-represented group as the "predicted soundtrack", and their favorite genres

## Decisions already agreed with the team (don't undo without asking)
- Stack: React + Vite + Chart.js, browser-only Spotify PKCE login (no server, no client secret)
- Spotify only. Apple Music was dropped (needs a paid dev account plus a signed server token, and has no top-artists-by-time endpoint)
- No public demo mode: login is the point. `?mock=metal|pop|mixed|nogenres` exists **in dev only**
- Genre mapping: every Spotify/Last.fm tag goes to the nearest survey genre, plus a neighbour at half weight (`web/src/lib/genreMap.js`)
- The title must NEVER be based on the mental-health results
- Framing: "our model predicts for your taste" / "listeners like you reported…", never "you have…"; always shown next to the survey average, with a "not a diagnosis" note
- **Results use the team's R regression** (Ari, `musictomentalhealthlm.qmd`, `R results.pdf`, `takeaways_from_linear_model`): one lm per condition on 16 binary genres (1 = Sometimes/Very frequently). Stored in `web/src/data/r_model.json`, built by `web/scripts/build_r_model.py`: it uses `r_coefficients.csv` at the repo root if present (exact R numbers), else refits the same spec in Python on all 736 rows. The kNN model is only a comparison toggle in *Under the hood*
- The card shows which significant effects apply to the user and the honest fit caveat (held-out RMSE ≈ SD; multiple comparisons)
- Look: artsy, playful, app-like (the team referenced the Chick-fil-A app): cream background, bold colors, chunky offset shadows, Bricolage Grotesque + DM Sans

## Gotchas
- **Spotify Feb 2026 rules:** dev-mode apps allow 5 users max (added by hand in the dashboard), and the app owner needs Premium
- **Spotify artist `genres` is deprecated** and came back empty in real testing (the "Mysterious Listener, 0 artists" bug).
  `web/src/lib/genreSources.js` fills genres from Last.fm (`VITE_LASTFM_API_KEY`), falling back to MusicBrainz (top 15 artists, 1 request/second)
- Redirect URIs must match exactly with a trailing slash: `http://127.0.0.1:5173/` (never `localhost`) and `https://<user>.github.io/<repo>/`
- Env: `web/.env.local` (git-ignored) holds `VITE_SPOTIFY_CLIENT_ID` and `VITE_LASTFM_API_KEY`. Restart `npm run dev` after editing it
- Deploy: `.github/workflows/deploy-web.yml` (repo root) → GitHub Pages. Needs the repo variables `SPOTIFY_CLIENT_ID` and `LASTFM_API_KEY`

## Commands (run in `codebase/website/mixed-feelings_cd/web/`)
- `npm run dev`: http://127.0.0.1:5173/
- `npm run check`: runs the pipeline (genre mapping → profile → both models) on mock listeners
- `npm run build`, `npm run lint`
- `npm run data`: regenerate `src/data/survey.json` from the CSV (needs pandas + numpy)
- `npm run model`: rebuild `src/data/r_model.json` (from `r_coefficients.csv` if present; the Python refit needs statsmodels)

## Open ideas / next steps
- Get Ari to export `r_coefficients.csv` so the site uses the exact R coefficients
- Grow `genreMap.js` rules using the "Tags with no rule yet" list in the app's *Under the hood* panel
