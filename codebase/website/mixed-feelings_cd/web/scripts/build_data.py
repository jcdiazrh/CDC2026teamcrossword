"""
Turn the survey CSV into the small JSON files the web app reads.

    python scripts/build_data.py            # uses data/mxmh_survey_results.csv

Writes:
  src/data/survey.json   - every respondent's 16 genre frequencies (0-3),
                           4 mental-health scores (0-10) and music effect
(The team's regression model is built separately by scripts/build_r_model.py.)
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "data" / "mxmh_survey_results.csv"
OUT = ROOT / "src" / "data"

FREQ = {"Never": 0, "Rarely": 1, "Sometimes": 2, "Very frequently": 3}
EFFECT = {"Improve": 1, "No effect": 0, "Worsen": -1}
CONDITIONS = ["Anxiety", "Depression", "Insomnia", "OCD"]

df = pd.read_csv(CSV)
freq_cols = [c for c in df.columns if c.startswith("Frequency [")]
genres = [c[len("Frequency ["):-1] for c in freq_cols]

df = df.dropna(subset=freq_cols + CONDITIONS)
X = df[freq_cols].replace(FREQ).astype(int).to_numpy()
Y = df[CONDITIONS].astype(float).to_numpy()
eff = df["Music effects"].map(EFFECT)

rows = []
for i in range(len(df)):
    e = eff.iloc[i]
    rows.append(X[i].tolist() + [round(v, 1) for v in Y[i]] + [None if pd.isna(e) else int(e)])

survey = {
    "source": "MxMH survey (mxmh_survey_results.csv)",
    "n": len(rows),
    "genres": genres,
    "conditions": CONDITIONS,
    "columns": genres + CONDITIONS + ["MusicEffect"],
    "means": {c: round(float(df[c].mean()), 2) for c in CONDITIONS},
    "improveShare": round(float((eff == 1).sum() / eff.notna().sum()), 3),
    "rows": rows,
}
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "survey.json").write_text(json.dumps(survey, separators=(",", ":")))

print(f"wrote {len(rows)} respondents, {len(genres)} genres")
