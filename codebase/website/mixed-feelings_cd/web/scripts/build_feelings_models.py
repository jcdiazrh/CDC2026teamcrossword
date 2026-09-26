"""
Builds the two models behind the "Feelings -> Music" page:

  src/data/truman_model.json   Truman's multinomial model (Music_predictor_Truman.qmd, final model
                               fit_mutDepMus2): favorite genre ~ Age + Anxiety + Depression + Insomnia
                               + OCD + Primary streaming service, with Rock+Metal, Pop+K pop and
                               Hip hop+Rap merged (13 classes). Refit here with the same predictors and
                               the same set.seed(101) 85% training split as the R code.
  src/data/python_model.json   The Python notebook's model ("python notebook/music_genre_model.joblib"):
                               13 genre clusters, one logistic regression each on the 4 standardized
                               scores, P(listens to the cluster at all). Exported exactly from the joblib.

    python scripts/build_feelings_models.py      (or: npm run feelings-models)
Needs pandas, numpy, scikit-learn, joblib.
"""
import json
import sys
import warnings
from pathlib import Path

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")
WEB = Path(__file__).resolve().parents[1]
REPO = next((p for p in WEB.parents if (p / ".git").exists()), WEB)
CSV = WEB / "data" / "mxmh_survey_results.csv"
JOBLIB = REPO / "python notebook" / "music_genre_model.joblib"
OUT = WEB / "src" / "data"
sys.path.insert(0, str(Path(__file__).parent))
from r_sample import RRNG  # noqa: E402

CONDS = ["Anxiety", "Depression", "Insomnia", "OCD"]
df = pd.read_csv(CSV)
r = lambda x, n=5: float(round(float(x), n))  # noqa: E731


# ------------------------------------------------------------------ Truman
def build_truman():
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import log_loss

    collapse = {"Metal": "Rock & Metal", "Rock": "Rock & Metal", "Pop": "Pop & K-pop", "K pop": "Pop & K-pop",
                "Rap": "Hip hop & Rap", "Hip hop": "Hip hop & Rap"}
    d = df.copy()
    d["fav"] = d["Fav genre"].map(lambda g: collapse.get(g, g))
    n = len(d)
    train_idx = np.array(RRNG(101).sample(n, int(np.floor(0.85 * n)))) - 1   # same split as the R code
    test_idx = np.setdiff1d(np.arange(n), train_idx)
    services = sorted(d["Primary streaming service"].dropna().unique())
    numeric = ["Age"] + CONDS

    def design(frame, mean=None, scale=None):
        num = frame[numeric].astype(float).to_numpy()
        if mean is None:
            mean, scale = num.mean(0), num.std(0)
        Xn = (num - mean) / scale
        Xs = np.column_stack([(frame["Primary streaming service"] == s).astype(float) for s in services])
        return np.column_stack([Xn, Xs]), mean, scale

    need = numeric + ["Primary streaming service", "fav"]
    train = d.iloc[train_idx].dropna(subset=need)   # multinom drops rows with NA
    test = d.iloc[test_idx].dropna(subset=need)
    Xtr, mean, scale = design(train)
    Xte, _, _ = design(test, mean, scale)
    # Light L2 keeps coefficients finite for genres with only a handful of fans (e.g. Latin, Gospel)
    m = LogisticRegression(C=10, max_iter=5000).fit(Xtr, train["fav"])
    classes = list(m.classes_)
    base = train["fav"].value_counts(normalize=True).reindex(classes).fillna(0)
    probs = m.predict_proba(Xte)
    acc = float((m.predict(Xte) == test["fav"].to_numpy()).mean())
    majority = base.idxmax()
    maj_acc = float((test["fav"] == majority).mean())
    ll = log_loss(test["fav"], probs, labels=classes)
    ll_base = log_loss(test["fav"], np.tile(base.to_numpy(), (len(test), 1)), labels=classes)
    model = {
        "name": "Truman's favorite-genre model",
        "source": "Music_predictor_Truman.qmd (fit_mutDepMus2), refit in Python with the same predictors and "
                  "set.seed(101) 85% training split",
        "classes": classes,
        "numeric": numeric,
        "mean": [r(v, 4) for v in mean],
        "scale": [r(v, 4) for v in scale],
        "services": services,
        "coef": [[r(v) for v in row] for row in m.coef_],
        "intercept": [r(v) for v in m.intercept_],
        "base": {c: r(base[c], 4) for c in classes},
        "ageDefault": int(d["Age"].median()),
        "test": {"n": int(len(test)), "accuracy": r(acc, 3), "majorityClass": majority,
                 "majorityAccuracy": r(maj_acc, 3), "logLoss": r(ll, 3), "baseLogLoss": r(ll_base, 3)},
    }
    (OUT / "truman_model.json").write_text(json.dumps(model, indent=1))
    print(f"truman: {len(classes)} classes, train n={len(train)}, test acc {acc:.3f} vs always-'{majority}' {maj_acc:.3f}, "
          f"log loss {ll:.3f} vs base {ll_base:.3f}")


# ------------------------------------------------------------------ Python notebook
def build_python():
    import joblib
    b = joblib.load(JOBLIB)
    freq_cols = [c for c in df.columns if c.startswith("Frequency [")]
    genre_names = [c[len("Frequency ["):-1] for c in freq_cols]
    listens = (df[freq_cols] != "Never").astype(int)   # the notebook's coding: listened at all
    listens.columns = genre_names
    clusters = []
    for key, members in b["cluster_map"].items():
        idx = int(key.rsplit("_", 1)[1])
        est = b["model"].estimators_[idx]
        clusters.append({
            "label": " & ".join(members) if len(members) < 3 else ", ".join(members[:-1]) + " & " + members[-1],
            "members": members,
            "coef": [r(v) for v in est.coef_[0]],
            "intercept": r(est.intercept_[0]),
            "prevalence": r(listens[members].max(axis=1).mean(), 4),
        })
    model = {
        "name": "Python notebook model",
        "source": "python notebook/notebook.ipynb -> music_genre_model.joblib (exported exactly)",
        "inputs": list(b["input_features"]),
        "mean": [r(v, 6) for v in b["scaler"].mean_],
        "scale": [r(v, 6) for v in b["scaler"].scale_],
        "clusters": clusters,
        # From the notebook's evaluation cell (5-fold out-of-fold, k=13, 4 scores)
        "reported": {"macroAuc": 0.519, "baselineAuc": 0.453, "permutationP": "< 0.001",
                     "bestClusterAuc": 0.631, "brier": 0.197},
    }
    (OUT / "python_model.json").write_text(json.dumps(model, indent=1))
    print(f"python: {len(clusters)} clusters: " + ", ".join(c["label"] for c in clusters))


build_truman()
build_python()
