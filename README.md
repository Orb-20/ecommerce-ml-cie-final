# E-commerce Machine Learning CIE Project — Version 2

Three machine-learning modules, each built on the most suitable public dataset, plus a final summary notebook.
This version replaces the single synthetic dataset used in `../ecommerce-ml-cie/` (version 1). That dataset's weekly
revenue was statistically pure noise and it had no fraud label.

| Module | Dataset | Selected approach | Headline result (held-out data) |
|---|---|---|---|
| A. Revenue forecasting | UCI Online Retail II | Seasonal naive + daily XGBoost combination | Weekly MAE £32.0k (14 % MAPE, R² 0.65); 5 % better than seasonal naive, 55 % better than the mean |
| B. Anomaly & risk detection | E-commerce Fraud Data | Isolation Forest (unsupervised), 5 % review rate | On unseen customers: 21.6 % of flags are fraud vs 4.6 % at random (4.7× lift), recall 23.5 % |
| C. Segmentation & value | UCI Online Retail II | RFM (log) + K-Means, K = 4 | Champions = 19 % of customers, 72 % of revenue; future-spend ranking Spearman 0.64 |

## Datasets and why they were chosen

| Dataset | Source | Size / period | Licence | Why |
|---|---|---|---|---|
| **Online Retail II** | [UCI ML Repository #502](https://archive.ics.uci.edu/dataset/502/online+retail+ii) (Chen, 2012, DOI 10.24432/C5CG6D) | 1,067,371 invoice lines, 1 Dec 2009 – 9 Dec 2011, UK online gift retailer | CC BY 4.0 | Real sales with strong yearly and weekly seasonality (Ljung–Box p ≈ 0), real repeat customers, and two years of data, which makes a genuine future-spend test possible |
| **E-commerce Fraud Data** (`Fraud_Data.csv`) | Widely mirrored teaching dataset, e.g. [github.com/rzhou1/FraudDetection](https://github.com/rzhou1/FraudDetection) (identical copies in several repositories) | 151,112 first purchases, 2015, 9.36 % labelled fraud | Not documented, so used for education only | One of very few public e-commerce datasets with a **confirmed fraud label** that can be downloaded without a login, so anomaly detection can be measured |

Other options considered:
- **Olist (Brazil):** it is Kaggle-only (requires a login), and most of its customers buy just once, which is weak for RFM.
- **IEEE-CIS fraud:** it requires a Kaggle login and its features are anonymised.
- **Kaggle "Fraudulent E-Commerce Transactions":** it requires a Kaggle login and its column schema could not be verified.

## Setup

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
jupyter notebook
```

## Execution order

Run each notebook top-to-bottom in a fresh kernel, in this order:

1. `00_Data_Exploration_and_Preparation.ipynb` explores both datasets and writes `data/processed/online_retail_clean.csv.gz`. Reading the Excel file takes about a minute.
2. `01_Revenue_Demand_Forecasting.ipynb` is Module A.
3. `02_Transaction_Anomaly_Detection.ipynb` is Module B.
4. `03_Customer_Segmentation_Value.ipynb` is Module C.
5. `04_Final_Model_Comparison_and_Summary.ipynb` loads the saved results and does no retraining.

Command line:

```bash
cd notebooks
jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=1800 00_*.ipynb 01_*.ipynb 02_*.ipynb 03_*.ipynb 04_*.ipynb
```

## Results website

`website/index.html` (**RetailMind**) is an interactive dashboard of all three modules: charts, metrics tables, model comparisons, every
notebook figure, and live in-browser predictions. The saved Isolation Forest and K-Means pipelines are ported to JavaScript
and match the Python scores exactly. Open the file in a browser (an internet connection is needed for Chart.js and fonts).
After re-running the notebooks, refresh its data with:

```bash
python website/build_data.py
```

## Project structure

```text
ecommerce-ml-cie-v2/
├── data/
│   ├── raw/                  online_retail_II.xlsx, Fraud_Data.csv (never modified)
│   └── processed/            online_retail_clean.csv.gz (created by notebook 00)
├── notebooks/                00–04
├── src/
│   ├── forecast_features.py  forecasting features (shared by notebooks 01 and 04)
│   └── fraud_features.py     anomaly features (shared by notebooks 02 and 04)
├── outputs/{figures,tables,predictions}/
├── models/                   saved pipelines (joblib)
├── requirements.txt
└── README.md
```

## Key design decisions

**Data cleaning (notebook 00)**
- The Online Retail II cleaning is documented rule by rule. It removes:
  - exact duplicate rows
  - postage, fee, bank-charge, adjustment, test and gift-voucher codes
  - lines with a price of zero or below
- Cancellations are kept, because forecasting uses **net** revenue (sales minus cancellations).

**Forecasting (notebook 01)**
- The test set is the last 21 complete weeks, which include the autumn peak.
- Every feature is known by the end of the previous week. This is enforced in code with leakage checks.
- Models trained on daily rows (with predictions summed into weeks) give the tree models 7× more training data.
- A 3-window backtest inside the training period checks how robust the results are.

**Anomaly detection (notebook 02)**
- Detectors are trained on Jan–Jun signups and evaluated on Jul–Aug signups. This is because a single January bot burst (7,600 instant purchases) would make a random split look misleadingly good.
- The fraud label is used only for evaluation. The supervised XGBoost is kept clearly separate, as a reference.
- Device and IP features count only earlier purchases.

**Segmentation and value (notebook 03)**
- A log transform is applied before K-Means.
- Future value uses features from the first 18 months to predict spend in the following 6 months.

## Honest caveats

- **Forecasting:** the combination model was added after a first comparison; this is disclosed in the notebook. In the earliest backtest window, before XGBoost had a full year of history, seasonal naive was better.
- **Anomaly detection:** about 78 % of flagged purchases are legitimate, so flags mean "review", not "block". The supervised model did not beat the unsupervised one, because the fraud pattern changed after January.
- **Customer value:** for top-20 % targeting, a simple past-spending baseline is as good as ML.
- **Fraud dataset:** its origin and licence are undocumented.

See `ecommerce_ml_cie_build_guide.md` for the original implementation plan.
