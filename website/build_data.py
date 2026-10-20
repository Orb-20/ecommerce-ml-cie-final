"""Export model results and model parameters into JavaScript files used by the website.

Run from the project root after the notebooks have been executed:
    python website/build_data.py
Writes website/data.js (results, charts) and website/models.js (parameters for in-browser prediction).
"""
import json
import shutil
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import precision_recall_curve, roc_curve

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
from fraud_features import ANOMALY_FEATURES, add_fraud_features  # noqa: E402

OUT = ROOT / "website"
TABLES, PREDS, MODELS = ROOT / "outputs" / "tables", ROOT / "outputs" / "predictions", ROOT / "models"


def records(df):
    return json.loads(df.to_json(orient="records"))


def thin(x, y, n=120):
    idx = np.unique(np.linspace(0, len(x) - 1, n).astype(int))
    return [round(float(v), 4) for v in np.asarray(x)[idx]], [round(float(v), 4) for v in np.asarray(y)[idx]]


data = {}

# ---------------------------------------------------------------- overview
data["overview"] = records(pd.read_csv(TABLES / "00_data_overview.csv"))
data["cleaning"] = records(pd.read_csv(TABLES / "00_retail_cleaning_log.csv"))
data["summary"] = records(pd.read_csv(TABLES / "04_final_model_summary.csv"))

# ---------------------------------------------------------------- module A: forecasting
retail = pd.read_csv(ROOT / "data" / "processed" / "online_retail_clean.csv.gz",
                     usecols=["InvoiceDate", "revenue", "Country"], parse_dates=["InvoiceDate"])
daily = retail.set_index("InvoiceDate")["revenue"].resample("D").sum()
weekly_all = daily.resample("W-SUN").sum()
weekly = weekly_all.iloc[1:-1]
pred = pd.read_csv(PREDS / "01_forecast_test_predictions.csv")
pred_cols = [c for c in pred.columns if c.startswith("pred_")]
fc_bundle = joblib.load(MODELS / "01_forecast_selected.joblib")
xgb = fc_bundle["xgb_daily_model"]
importance = pd.Series(xgb.feature_importances_, index=fc_bundle["daily_feature_columns"]).sort_values(ascending=False)
weekday = retail.groupby(retail["InvoiceDate"].dt.day_name())["revenue"].sum()
data["forecast"] = {
    "metrics": records(pd.read_csv(TABLES / "01_forecast_metrics.csv")),
    "backtest": records(pd.read_csv(TABLES / "01_forecast_backtest.csv")),
    "weekly": {"dates": [d.strftime("%Y-%m-%d") for d in weekly.index], "revenue": [round(float(v), 2) for v in weekly]},
    "test": {"dates": pred["week_ending"].tolist(), "actual": pred["actual_revenue"].round(2).tolist(),
             "models": {c[5:]: pred[c].round(2).tolist() for c in pred_cols}},
    "selected": fc_bundle["selected_model_name"],
    "rule": fc_bundle["combination_rule"],
    "train_weeks": list(fc_bundle["train_weeks"]),
    "importance": {"features": importance.index.tolist(), "values": importance.round(4).tolist()},
    "weekday": {d: round(float(weekday.get(d, 0)), 2) for d in
                ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]},
}

# ---------------------------------------------------------------- module B: anomaly detection
scores = pd.read_csv(PREDS / "02_anomaly_test_scores.csv")
y = scores["class"].values
methods = {"Isolation Forest": scores["iforest_score"], "LOF": scores["lof_score"],
           "XGBoost (supervised)": scores["xgboost_fraud_probability"], "Rule-based": scores["rule_flag"]}
roc, pr = {}, {}
for name, s in methods.items():
    fpr, tpr, _ = roc_curve(y, s)
    roc[name] = dict(zip(("x", "y"), thin(fpr, tpr)))
    if name != "Rule-based":
        p, r, _ = precision_recall_curve(y, s)
        pr[name] = dict(zip(("x", "y"), thin(r[::-1], p[::-1])))
bins = np.linspace(scores["iforest_score"].min(), scores["iforest_score"].max(), 41)
hist_legit, _ = np.histogram(scores.loc[y == 0, "iforest_score"], bins=bins, density=True)
hist_fraud, _ = np.histogram(scores.loc[y == 1, "iforest_score"], bins=bins, density=True)
flag = scores["iforest_flag_5pct"].values
iso_bundle = joblib.load(MODELS / "02_isolation_forest_pipeline.joblib")
data["anomaly"] = {
    "comparison": records(pd.read_csv(TABLES / "02_anomaly_method_comparison.csv")),
    "flag_rates": records(pd.read_csv(TABLES / "02_anomaly_flag_rates.csv")),
    "burst": records(pd.read_csv(TABLES / "02_anomaly_train_burst_detection.csv")),
    "top": records(pd.read_csv(TABLES / "02_top_unusual_purchases.csv")),
    "roc": roc, "pr": pr,
    "hist": {"bins": [round(float(b), 4) for b in (bins[:-1] + bins[1:]) / 2],
             "legit": hist_legit.round(3).tolist(), "fraud": hist_fraud.round(3).tolist(),
             "threshold": round(float(np.quantile(scores["iforest_score"], 0.95)), 4)},
    "confusion": {"tp": int(((flag == 1) & (y == 1)).sum()), "fp": int(((flag == 1) & (y == 0)).sum()),
                  "fn": int(((flag == 0) & (y == 1)).sum()), "tn": int(((flag == 0) & (y == 0)).sum())},
    "test_rows": int(len(scores)), "test_fraud_rate": round(float(y.mean()), 4),
    "score_quantiles": [round(float(q), 4) for q in np.quantile(scores["iforest_score"], np.linspace(0, 1, 101))],
}

# ---------------------------------------------------------------- module C: segmentation
seg = pd.read_csv(PREDS / "03_customer_segments.csv")
sample = seg.sample(1600, random_state=42)
seg_bundle = joblib.load(MODELS / "03_segmentation_pipeline.joblib")
data["segmentation"] = {
    "profiles": records(pd.read_csv(TABLES / "03_cluster_profiles.csv")),
    "value": records(pd.read_csv(TABLES / "03_segment_value.csv")),
    "k_eval": records(pd.read_csv(TABLES / "03_k_evaluation.csv")),
    "future": records(pd.read_csv(TABLES / "03_future_value_metrics.csv")),
    "scatter": [{"r": int(r.Recency), "f": int(r.Frequency), "m": round(float(r.Monetary), 2), "s": r.segment}
                for r in sample.itertuples()],
    "customers": {str(int(r[0])): [int(r[1]), int(r[2]), round(float(r[3]), 2), r[4]]
                  for r in seg[["Customer ID", "Recency", "Frequency", "Monetary", "segment"]].itertuples(index=False)},
    "snapshot": seg_bundle["snapshot_date"],
    "silhouette": round(float(seg_bundle["silhouette"]), 4),
}

(OUT / "data.js").write_text("window.DATA = " + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")

# ---------------------------------------------------------------- model parameters for in-browser prediction
def avg_path_length(n):
    n = np.asarray(n, dtype=float)
    out = np.zeros_like(n)
    out[n == 2] = 1.0
    big = n > 2
    out[big] = 2.0 * (np.log(n[big] - 1.0) + np.euler_gamma) - 2.0 * (n[big] - 1.0) / n[big]
    return out


iso_pipe = iso_bundle["pipeline"]
scaler, forest = iso_pipe.named_steps["scaler"], iso_pipe.named_steps["model"]
trees = []
for est, feats in zip(forest.estimators_, forest.estimators_features_):
    t = est.tree_
    depth = np.zeros(t.node_count)
    for node in range(t.node_count):  # parents always precede children in sklearn trees
        for child in (t.children_left[node], t.children_right[node]):
            if child != -1:
                depth[child] = depth[node] + 1
    leaf = t.children_left == -1
    value = np.where(leaf, depth + avg_path_length(t.n_node_samples), 0)
    trees.append({"f": [int(feats[f]) if f >= 0 else -1 for f in t.feature],
                  "t": [round(float(v), 6) for v in t.threshold],
                  "l": t.children_left.tolist(), "r": t.children_right.tolist(),
                  "v": [round(float(v), 4) for v in value]})
iforest = {"features": ANOMALY_FEATURES, "mean": scaler.mean_.tolist(), "scale": scaler.scale_.tolist(),
           "norm": float(avg_path_length([forest.max_samples_])[0]), "trees": trees,
           "threshold": iso_bundle["threshold_from_training_cohort"], "review_rate": iso_bundle["review_rate"]}

seg_pipe = seg_bundle["pipeline"]
kmeans = {"columns": seg_bundle["rfm_columns"], "mean": seg_pipe.named_steps["scale"].mean_.tolist(),
          "scale": seg_pipe.named_steps["scale"].scale_.tolist(),
          "centers": seg_pipe.named_steps["kmeans"].cluster_centers_.tolist(),
          "names": {str(k): v for k, v in seg_bundle["segment_names"].items()}}

# Validation set: Python-side scores so the website's JS implementation can be checked against them
purchases = pd.read_csv(ROOT / "data" / "raw" / "Fraud_Data.csv", parse_dates=["signup_time", "purchase_time"])
tx = add_fraud_features(purchases)
check = tx[ANOMALY_FEATURES].sample(200, random_state=0)
iforest["check"] = {"X": check.round(6).values.tolist(), "score": (-iso_pipe.score_samples(check.round(6))).tolist()}
rfm_check = seg[["Recency", "Frequency", "Monetary"]].head(200)
kmeans["check"] = {"X": rfm_check.values.tolist(), "label": seg_pipe.predict(rfm_check).tolist()}
feature_ranges = tx[ANOMALY_FEATURES].describe(percentiles=[0.5]).T[["min", "50%", "max"]].round(3)
iforest["ranges"] = records(feature_ranges.reset_index().rename(columns={"index": "feature", "50%": "median"}))

(OUT / "models.js").write_text("window.MODELS = " + json.dumps({"iforest": iforest, "kmeans": kmeans},
                               separators=(",", ":")) + ";\n", encoding="utf-8")

# ---------------------------------------------------------------- notebook figures
fig_out = OUT / "figures"
fig_out.mkdir(exist_ok=True)
for png in (ROOT / "outputs" / "figures").glob("*.png"):
    shutil.copy2(png, fig_out / png.name)

print("data.js", round((OUT / "data.js").stat().st_size / 1e3), "kB | models.js",
      round((OUT / "models.js").stat().st_size / 1e3), "kB | figures", len(list(fig_out.glob("*.png"))))
