"""
Builds the two models behind the "Feelings -> Music" page:

  src/data/truman_model.json   Truman's model: the '## Model' section of Music_predictor_Truman.qmd,
                               fit_mutDepMus2 = multinom(favorite genre ~ Age + Anxiety + Depression
                               + Insomnia + OCD + streaming service) on 13 merged genres, fitted like
                               nnet::multinom (no regularization) plus its tidy() table of p-values.
  src/data/python_model.json   The Python notebook's model ("python notebook/music_genre_model.joblib"):
                               13 genre clusters, one logistic regression each on the 4 standardized
                               scores, P(listens to the cluster at all). Exported exactly from the joblib.

    python scripts/build_feelings_models.py      (or: npm run feelings-models)
Needs pandas, numpy, scipy, scikit-learn, joblib.
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
    """fit_mutDepMus2 from the '## Model' section of Music_predictor_Truman.qmd:
    multinom(Fav.genre ~ Age + Anxiety + Depression + Insomnia + OCD + Primary.streaming.service, mut_train_DepMus)
    Fitted like R's nnet::multinom: plain (unregularized) softmax regression, BFGS from zero weights, 100 iterations
    (multinom's default maxit), first factor level as the reference class. p-values = Wald tests (what tidy() reports)."""
    from scipy.optimize import minimize
    from scipy.stats import norm

    collapse = {"Metal": "Rock & Metal", "Rock": "Rock & Metal", "Pop": "Pop & K-pop", "K pop": "Pop & K-pop",
                "Rap": "Hip hop & Rap", "Hip hop": "Hip hop & Rap"}
    d = df.copy()
    d["fav"] = d["Fav genre"].map(lambda g: collapse.get(g, g))
    n = len(d)
    train_idx = np.array(RRNG(101).sample(n, int(np.floor(0.85 * n)))) - 1   # mut_train_DepMus
    train = d.iloc[train_idx].dropna(subset=["Age", "Primary streaming service", "fav"])
    services = sorted(d["Primary streaming service"].dropna().unique())      # R factor levels; first = reference
    terms = ["(Intercept)", "Age"] + CONDS + [f"service: {s}" for s in services[1:]]

    def design(frame):
        return np.column_stack([np.ones(len(frame)), frame[["Age"] + CONDS].to_numpy(float)]
                               + [(frame["Primary streaming service"] == s).astype(float) for s in services[1:]])

    X = design(train)
    classes = sorted(train["fav"].unique())
    K, P = len(classes), X.shape[1]
    Y = np.zeros((len(train), K))
    Y[np.arange(len(train)), [classes.index(c) for c in train["fav"]]] = 1

    def nll(w):
        W = np.vstack([np.zeros(P), w.reshape(K - 1, P)])
        Z = X @ W.T
        Z -= Z.max(1, keepdims=True)
        lp = Z - np.log(np.exp(Z).sum(1, keepdims=True))
        return -(Y * lp).sum(), ((np.exp(lp) - Y)[:, 1:].T @ X).ravel()

    fit = minimize(nll, np.zeros((K - 1) * P), jac=True, method="BFGS", options={"maxiter": 100})
    W = np.vstack([np.zeros(P), fit.x.reshape(K - 1, P)])

    # Wald standard errors from the Hessian (as summary()/tidy() on a multinom fit)
    Z = X @ W.T
    Z -= Z.max(1, keepdims=True)
    Pr = np.exp(Z)
    Pr /= Pr.sum(1, keepdims=True)
    H = np.zeros(((K - 1) * P, (K - 1) * P))
    for i in range(len(X)):
        pi = Pr[i, 1:]
        H += np.kron(np.diag(pi) - np.outer(pi, pi), np.outer(X[i], X[i]))
    with np.errstate(invalid="ignore"):
        se = np.sqrt(np.diag(np.linalg.pinv(H)))
        pvals = 2 * (1 - norm.cdf(np.abs(fit.x / se)))
    pvals = np.nan_to_num(pvals, nan=1.0).reshape(K - 1, P)

    table = []   # the tidy() table from the '## Model' section: y.level, term, estimate, p.value
    for k in range(1, K):
        for j in range(P):
            table.append({"level": classes[k], "term": terms[j], "estimate": r(W[k, j], 4), "p": r(pvals[k - 1, j], 4)})
    base = train["fav"].value_counts(normalize=True).reindex(classes).fillna(0)
    model = {
        "name": "Truman's favorite-genre model",
        "source": "Music_predictor_Truman.qmd, ## Model: fit_mutDepMus2 (multinomial logistic regression)",
        "formula": "Fav genre ~ Age + Anxiety + Depression + Insomnia + OCD + Primary streaming service",
        "reference": classes[0],
        "classes": classes,
        "terms": terms,
        "services": services,             # services[0] is the reference level (no dummy)
        "W": [[r(v) for v in row] for row in W],   # one row per class (reference row = 0), columns = terms
        "table": table,
        "base": {c: r(base[c], 4) for c in classes},
        "n": int(len(train)),
        "ageDefault": int(d["Age"].median()),
    }
    (OUT / "truman_model.json").write_text(json.dumps(model, indent=1))
    sig = [t for t in table if t["p"] < 0.05 and t["term"] != "(Intercept)"]
    print(f"truman: {K} classes, n={len(train)}, BFGS iters {fit.nit}, significant terms: "
          + "; ".join(f"{t['level']} ~ {t['term']} {t['estimate']:+.3f} (p={t['p']:.3f})" for t in sig))


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
