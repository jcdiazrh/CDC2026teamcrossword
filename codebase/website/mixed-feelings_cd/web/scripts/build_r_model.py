"""
Builds src/data/r_model.json: the team's linear model (Ari's R analysis,
musictomentalhealthlm.qmd) in the format the website reads.

Model spec (same as the R code):
    score ~ classical + country + ... + vgm        (one lm per condition)
    each genre = 1 if "Sometimes" or "Very frequently", else 0 ("Never"/"Rarely")

Where the numbers come from:
  1. If the repo root has r_coefficients.csv (exported from R, see README), we use
     Ari's coefficients exactly.
  2. Otherwise we fit the same model here in Python on all survey responses.

    python scripts/build_r_model.py        (or: npm run model)
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

WEB = Path(__file__).resolve().parents[1]
# repo root = nearest parent folder containing .git (falls back to the web folder)
REPO = next((p for p in WEB.parents if (p / ".git").exists()), WEB)
CSV = WEB / "data" / "mxmh_survey_results.csv"
R_COEFS = REPO / "r_coefficients.csv"
OUT = WEB / "src" / "data" / "r_model.json"

CONDITIONS = ["Anxiety", "Depression", "Insomnia", "OCD"]
# R variable name -> survey genre
R_NAMES = {"classical": "Classical", "country": "Country", "edm": "EDM", "folk": "Folk", "gospel": "Gospel",
           "hiphop": "Hip hop", "jazz": "Jazz", "kpop": "K pop", "latin": "Latin", "lofi": "Lofi",
           "metal": "Metal", "pop": "Pop", "rnb": "R&B", "rap": "Rap", "rock": "Rock", "vgm": "Video game music"}
GENRES = list(R_NAMES.values())

# Held-out fit reported in "R results.pdf" (85/15 split): RMSE vs. SD of the outcome
REPORTED_FIT = {"Anxiety": {"rmse": 2.922, "sd": 2.894}, "Depression": {"rmse": 3.017, "sd": 3.108},
                "Insomnia": {"rmse": 3.080, "sd": 3.128}, "OCD": {"rmse": 2.937, "sd": 2.883}}


def from_r(path):
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]
    conds = {}
    for cond in CONDITIONS:
        rows = df[df["outcome"].str.lower() == cond.lower()]
        if rows.empty:
            raise SystemExit(f"{path.name}: no rows for outcome {cond}")
        c = {"intercept": None, "coef": {}, "se": {}, "p": {}}
        for _, r in rows.iterrows():
            term = str(r["term"]).strip()
            if term == "(Intercept)":
                c["intercept"] = float(r["estimate"])
                continue
            g = R_NAMES[term.lower()]
            c["coef"][g] = float(r["estimate"])
            c["se"][g] = float(r["std.error"])
            c["p"][g] = float(r["p.value"])
        conds[cond] = c
    return conds, f"Coefficients exported from R ({path.name})"


def fit_python():
    import statsmodels.api as sm
    df = pd.read_csv(CSV)
    X = pd.DataFrame({g: df[f"Frequency [{g}]"].isin(["Sometimes", "Very frequently"]).astype(int) for g in GENRES})
    conds = {}
    for cond in CONDITIONS:
        m = sm.OLS(df[cond].astype(float), sm.add_constant(X)).fit()
        conds[cond] = {
            "intercept": float(m.params["const"]),
            "coef": {g: float(m.params[g]) for g in GENRES},
            "se": {g: float(m.bse[g]) for g in GENRES},
            "p": {g: float(m.pvalues[g]) for g in GENRES},
        }
    return conds, f"Same model as the team's R code, refit in Python on all {len(df)} survey responses"


if R_COEFS.exists():
    conditions, source = from_r(R_COEFS)
else:
    conditions, source = fit_python()

for c in conditions.values():
    for k in ("coef", "se", "p"):
        c[k] = {g: round(v, 5) for g, v in c[k].items()}
    c["intercept"] = round(c["intercept"], 5)

model = {
    "type": "linear",
    "name": "Team regression model",
    "coding": "binary",            # listener = 1 if Sometimes / Very frequently
    "binaryMinLevel": 2,           # on the app's 0-3 scale (Never, Rarely, Sometimes, Very frequently)
    "source": source,
    "description": "Linear regression per condition on 16 genres (listens sometimes or more = 1).",
    "features": GENRES,
    "conditions": conditions,
    "reportedFit": REPORTED_FIT,
}
OUT.write_text(json.dumps(model, indent=2))
print(f"wrote {OUT.relative_to(WEB)} from: {source}")
for cond, c in conditions.items():
    sig = {g: round(c["coef"][g], 2) for g in GENRES if c["p"][g] < 0.05}
    print(f"  {cond:10s} intercept {c['intercept']:.2f}  significant: {sig}")
