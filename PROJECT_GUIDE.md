# E-commerce Machine Learning Project: Complete Guide and Viva Notes

This file explains the whole project in simple language: what we built, which data and tools we used, why we made each
choice, how every model works, what the results mean, and the questions that may be asked in the viva.

---

## Table of contents

1. [Project in one paragraph](#1-project-in-one-paragraph)
2. [The three modules at a glance](#2-the-three-modules-at-a-glance)
3. [Datasets: what and why](#3-datasets-what-and-why)
4. [Tools and libraries used](#4-tools-and-libraries-used)
5. [Project folder structure](#5-project-folder-structure)
6. [Notebook 00: Data exploration and cleaning](#6-notebook-00-data-exploration-and-cleaning)
7. [Module A: Revenue forecasting](#7-module-a-revenue-forecasting)
8. [Module B: Anomaly and risk detection](#8-module-b-anomaly-and-risk-detection)
9. [Module C: Customer segmentation and value](#9-module-c-customer-segmentation-and-value)
10. [Notebook 04: Final comparison](#10-notebook-04-final-comparison)
11. [Model theory (how each model works)](#11-model-theory-how-each-model-works)
12. [Metrics explained simply](#12-metrics-explained-simply)
13. [Important ML concepts used](#13-important-ml-concepts-used)
14. [The website (RetailMind dashboard)](#14-the-website-retailmind-dashboard)
15. [Limitations and future improvements](#15-limitations-and-future-improvements)
16. [Viva questions and answers](#16-viva-questions-and-answers)
17. [Key numbers to remember](#17-key-numbers-to-remember)

---

## 1. Project in one paragraph

An online shop needs answers to three business questions: **How much money will we make next week?**, **Which
purchases look suspicious and should be checked?**, and **Who are our customers and which ones are valuable?** We
built one machine-learning module for each question, using two real public datasets. Every model is tested on data it
has never seen (held-out data), compared against simple baselines, and the results are reported honestly, including
where the models did not help. All results are also shown on an interactive website.

---

## 2. The three modules at a glance

| | Module A: Revenue forecasting | Module B: Anomaly detection | Module C: Segmentation and value |
|---|---|---|---|
| **Business question** | How much net revenue next week? | Which purchases should be reviewed for fraud? | What types of customers do we have, and what are they worth? |
| **Type of ML** | Supervised regression (time series) | Unsupervised anomaly detection | Unsupervised clustering (+ a supervised future-spend model) |
| **Dataset** | UCI Online Retail II | E-commerce Fraud Data | UCI Online Retail II |
| **Selected model** | 50/50 combination of seasonal naive + daily XGBoost | Isolation Forest, 5 % review rate | RFM (log) + K-Means, K = 4 |
| **Main result** | Weekly MAE £31,966 (14.4 % MAPE, R² 0.65); 5.2 % better than seasonal naive, 55 % better than the mean | Precision 21.6 %, recall 23.5 %, lift 4.7x, ROC-AUC 0.64 on unseen customers | Champions = 19 % of customers but 72 % of revenue; silhouette 0.36; future-spend Spearman 0.64 |

---

## 3. Datasets: what and why

### 3.1 UCI Online Retail II (Modules A and C)

- **What:** real transactions from a UK online gift shop (many customers are wholesalers).
- **Size:** 1,067,371 invoice lines, from 1 Dec 2009 to 9 Dec 2011 (two years). 5,875 customers with an ID.
- **Source:** UCI Machine Learning Repository, dataset #502. Licence CC BY 4.0 (free to use with credit).
- **Columns:** `Invoice` (starts with **C** if cancelled), `StockCode` (product code), `Description`, `Quantity`,
  `InvoiceDate`, `Price` (in £), `Customer ID`, `Country`.

**Why we chose it:**
- Revenue has **real patterns**: a strong yearly cycle (big rise every September to November for Christmas) and a weekly
  cycle (no trading on Saturdays). A forecasting model needs patterns to learn.
- It has **real repeat customers with IDs**, which is needed for RFM segmentation.
- Two years of data lets us do an honest **future-spend test** (learn from the first 18 months, test on the next 6).

### 3.2 E-commerce Fraud Data (Module B)

- **What:** 151,112 first purchases on an e-commerce site in 2015. Each row has a **fraud label** (`class` = 1 fraud, 0 normal).
- **Columns:** `user_id`, `signup_time`, `purchase_time`, `purchase_value` ($), `device_id`, `source` (SEO/Ads/Direct),
  `browser`, `sex`, `age`, `ip_address`, `class`.
- **Fraud rate:** 9.36 % overall.

**Why we chose it:**
- It is one of very few public e-commerce datasets with a **confirmed fraud label** that can be downloaded without a
  login. With labels, we can **measure** how good the anomaly detector really is.
- Note: its origin and licence are not documented, so it is used only for education.

### 3.3 Why two datasets and not one?

No single public dataset supports all three modules well. The earlier version (v1) used one synthetic dataset whose
weekly revenue was pure random noise (nothing to forecast) and had no fraud label (nothing to measure). So we picked the
best dataset for each job.

### 3.4 Other datasets considered and rejected

| Dataset | Why rejected |
|---|---|
| Olist (Brazil) | Kaggle login needed; most customers buy only once, so RFM is weak |
| IEEE-CIS fraud | Kaggle login needed; features are anonymised (no meaning) |
| Kaggle "Fraudulent E-Commerce Transactions" | Kaggle login needed; column schema could not be verified |

---

## 4. Tools and libraries used

| Tool | Version | What we used it for |
|---|---|---|
| **Python** | 3.13 | Programming language |
| **Jupyter Notebook** | - | Writing code, results and explanations together step by step |
| **pandas** | 2.3.2 | Loading, cleaning and grouping tables (DataFrames) |
| **numpy** | 1.26.4 | Fast maths on arrays |
| **matplotlib** | 3.10.6 | Drawing charts |
| **seaborn** | 0.13.2 | Nicer statistical charts (histograms, distributions) |
| **scikit-learn** | 1.7.1 | Linear Regression, Random Forest, Isolation Forest, LOF, K-Means, StandardScaler, metrics, pipelines |
| **xgboost** | 3.1.3 | XGBoost (gradient boosting) models |
| **statsmodels** | 0.15.0 | Autocorrelation plot and Ljung-Box test (checking if revenue has patterns) |
| **scipy** | 1.16.1 | Spearman correlation and other statistics |
| **joblib** | 1.5.2 | Saving and loading trained models (`.joblib` files) |
| **openpyxl** | 3.1.5 | Reading the Excel file |
| **HTML, CSS, JavaScript, Chart.js** | Chart.js 4.4.1 | The results website |

---

## 5. Project folder structure

```text
ecommerce-ml-cie-v2/
├── data/
│   ├── raw/          online_retail_II.xlsx, Fraud_Data.csv (original files, never changed)
│   └── processed/    online_retail_clean.csv.gz (made by notebook 00)
├── notebooks/        00 to 04 (run in order)
├── src/
│   ├── forecast_features.py   features for forecasting (shared by notebooks 01 and 04)
│   └── fraud_features.py      features for anomaly detection (shared by notebooks 02 and 04)
├── outputs/
│   ├── figures/      charts (PNG)
│   ├── tables/       metric tables (CSV)
│   └── predictions/  model predictions (CSV)
├── models/           saved trained models (.joblib)
├── website/          the interactive dashboard
├── requirements.txt  list of libraries
├── HOW_TO_RUN.md     simple run steps
└── PROJECT_GUIDE.md  this file
```

**Why the `src/` folder?** Feature code is written once and imported by several notebooks, so training and later use
always build features in exactly the same way (no copy-paste mistakes).

---

## 6. Notebook 00: Data exploration and cleaning

### 6.1 Online Retail II cleaning rules

| Rule | Why | Rows removed |
|---|---|---|
| Remove exact duplicate rows | Same line recorded twice is a logging error | 34,335 |
| Remove service codes (`POST`, `DOT`, `C2`, `M`, `D`, `S`, `BANK CHARGES`, `AMAZONFEE`, `CRUK`, `ADJUST`, `B`, `TEST001/002`) and gift vouchers | These are postage, fees, discounts, accounting entries or tests, not product sales | 5,799 |
| Remove bad-debt adjustment invoices (`A...`) | Accounting entries | 0 (already caught) |
| Remove lines with `Price <= 0` | Free items or adjustments | 5,965 |
| Remove non-cancelled lines with `Quantity <= 0` | Stock corrections | 0 (already caught) |
| **Keep** cancellations (flag `is_cancellation`) | Needed for **net revenue** = sales minus cancellations | kept |
| **Keep** lines without Customer ID | Still real sales (guest checkouts); used for forecasting, but not for segmentation | kept |
| Add `revenue = Quantity x Price` | Cancellations have negative quantity, so negative revenue | - |

Result: 1,067,371 lines become **1,021,272** lines (about 4 % removed).

### 6.2 Main findings from exploration

- About **22.8 %** of lines have no Customer ID. We did **not** invent IDs (that would create fake customers).
- The four biggest lines (for example 80,995 paper birds worth £168k) were **cancelled in full**. Using net revenue removes them automatically.
- The UK makes about **85 %** of revenue.
- **Yearly pattern:** flat January to August, strong rise September to a peak in **November**, drop at Christmas.
- **Weekly pattern:** **no trading on Saturdays** (all 104 Saturdays are zero), Sunday is about half a weekday, Thursday is strongest.
- **Fraud data:** no missing values, no duplicates. **7,600 purchases happened within 1 second of signup, and all were fraud** (bots).
  When 6 or more users share one device, about **91 %** are fraud (vs 3 % for a single-user device).
- **January** fraud rate is about **76 %** (a bot burst); other months are about **4.5-6 %**.

---

## 7. Module A: Revenue forecasting

### 7.1 Goal

Predict **next week's total net revenue** (in £), using only information available at the end of the previous week.

### 7.2 Preparing the target

1. Add up revenue for each day (days with no trading = 0).
2. Add up days into weeks (Monday to Sunday, labelled by the Sunday date).
3. Drop the first and last weeks because they are incomplete. This leaves **104 complete weeks**.

### 7.3 Is there something to predict? (pattern check)

- The 2010 and 2011 curves follow almost the same shape.
- **Lag-1 autocorrelation is about 0.7**: last week's revenue is strongly related to this week's.
- **Ljung-Box test p-value is about 0**: the series is clearly **not random noise**, so it can be forecast.

### 7.4 Features (inputs to the models)

**Weekly models** (one row per week):

| Feature | Meaning |
|---|---|
| `lag_1`, `lag_2`, `lag_4` | Revenue 1, 2 and 4 weeks ago |
| `rolling_mean_4` | Average revenue of the previous 4 weeks |
| `month`, `week_of_year` | Position in the year (captures seasonality) |
| `holiday_week` | 1 if the week falls in 22 Dec - 4 Jan (shop closed) |

**Daily models** (one row per day; the 7 daily predictions are summed into a weekly total):

| Feature | Meaning |
|---|---|
| `prev_week`, `prev2_week` | Total revenue of the previous week and the week before |
| `rolling_mean_4_weeks` | Average of the previous 4 weekly totals |
| `same_weekday_last_week` | Revenue on the same weekday last week |
| `day_of_week` | Monday = 0 ... Sunday = 6 (learns "Saturday = 0") |
| `month`, `day_of_year` | Seasonality |
| `holiday_period` | 1 between 22 Dec and 4 Jan |

**No leakage:** every feature is known by the end of the previous Sunday. This is checked in code.

**Why daily models?** With only about 83 training weeks, tree models have very little data. Using days gives about
**7 times more training rows** and lets the model learn weekday effects. We still report weekly accuracy.

### 7.5 Train/test split

- **Time-based split:** the first **80 %** of weeks for training (13 Dec 2009 - 10 Jul 2011, 83 weeks), the **last 21 weeks** for testing (17 Jul - 4 Dec 2011).
- The test period includes the autumn peak, the hardest and most valuable part of the year.
- **Why not a random split?** In time series, a random split lets the model "see the future" during training. That is cheating.

### 7.6 Models compared

| Model | Type | Settings |
|---|---|---|
| Naive (last week) | Baseline | prediction = last week's revenue |
| Training mean | Baseline | prediction = average of all training weeks |
| **Seasonal naive** | Baseline | prediction = **same week last year** (fair baseline for seasonal data) |
| Linear Regression (weekly) | ML | with StandardScaler |
| Random Forest (weekly) | ML | 500 trees, min_samples_leaf = 2 |
| XGBoost (weekly) | ML | 300 trees, max_depth = 3, learning_rate = 0.05 |
| Random Forest (daily to weekly) | ML | 500 trees, min_samples_leaf = 3 |
| XGBoost (daily to weekly) | ML | 400 trees, max_depth = 3, learning_rate = 0.05 |
| **Combination** | Ensemble | **0.5 x seasonal naive + 0.5 x daily XGBoost** |

### 7.7 Results on the 21 test weeks

| Model | MAE | RMSE | R² | MAPE |
|---|---|---|---|---|
| **Combination (selected)** | **£31,966** | **£41,785** | **0.652** | **14.4 %** |
| Seasonal naive | £33,707 | £44,281 | 0.609 | 15.6 % |
| XGBoost (daily) | £35,196 | £43,327 | 0.626 | 15.3 % |
| XGBoost (weekly) | £37,109 | £49,511 | 0.512 | 16.2 % |
| Random Forest (daily) | £40,204 | £50,356 | 0.495 | 17.1 % |
| Random Forest (weekly) | £41,558 | £50,143 | 0.499 | 17.5 % |
| Linear Regression | £44,973 | £55,537 | 0.386 | 19.2 % |
| Naive (last week) | £44,982 | £56,519 | 0.364 | 19.5 % |
| Training mean | £71,648 | £96,037 | -0.837 | 26.2 % |

**What this means:**
- Every model that uses the past beats the training mean easily.
- **Seasonal naive** is very strong because autumn 2011 looked like autumn 2010.
- **Daily XGBoost** is the best single ML model, with fewer big misses than seasonal naive (better RMSE and R²).
- The **combination** wins on every metric because the two parts make **different mistakes**: seasonal naive copies last
  year's noise, XGBoost reacts to recent weeks. Averaging cancels part of both errors.

### 7.8 Robustness check (backtest)

The whole training procedure was repeated on 3 earlier 10-week windows inside the training data:

| Window | Combination MAE | Seasonal naive MAE |
|---|---|---|
| Dec 2010 - Feb 2011 | £46,727 | **£27,484** |
| Feb - Apr 2011 | **£20,773** | £21,779 |
| May - Jul 2011 | **£32,829** | £35,542 |

In the first window, ML had less than a year of history and had never seen a Christmas closure, so it failed. Once it
had a full year, the combination beat seasonal naive. **Lesson: ML needs at least one full seasonal cycle.**

### 7.9 Error analysis

- The forecast was **too low in 16 of 21 weeks** (average about +£13.7k under). Reason: 2011 grew compared with 2010,
  and half of the forecast is last year's value.
- The biggest misses are single weeks in Sept/Oct, probably large one-off wholesale orders that no calendar model can predict.
- **Most important XGBoost features:** `holiday_period`, `day_of_week`, `prev_week`, then `month`.

---

## 8. Module B: Anomaly and risk detection

### 8.1 Goal

Give every purchase an **"unusualness" score** and send the most unusual ones to a **review queue**. A flag means
"a person should check this", **not** "this is definitely fraud".

### 8.2 Features (7 behaviour features)

| Feature | Meaning | Why |
|---|---|---|
| `log_seconds_to_purchase` | log10 of seconds from signup to purchase | Bots buy instantly |
| `purchase_value` | amount in $ | Unusual basket sizes |
| `age` | customer age | Unusual age/value combinations |
| `prior_purchases_same_device` | number of **earlier** purchases from the same device | Shared devices were a strong fraud signal |
| `prior_purchases_same_ip` | number of **earlier** purchases from the same IP | Same idea for networks |
| `purchase_hour` | hour of the day (0-23) | Unusual timing |
| `log_seconds_since_device_last_used` | time since the device was last used (about 3 years if never) | Bursts of purchases from one device |

**Not used:**
- `user_id`, `device_id`, `ip_address` raw values: they are just IDs, the number itself means nothing.
- `source`, `browser`: fraud rates are almost the same in every category.
- `sex`: no signal, and using a protected attribute to flag people would be **unfair**.

**Why log transform for time?** Times range from 1 second to months. A log scale makes 1 s, 1 min, 1 hour and 1 day evenly spaced.

**No leakage:** device/IP counts only look at **earlier** purchases, never later ones.

### 8.3 Train/test split by signup cohort

- **Train:** customers who signed up **January to June** (about 121,000 purchases).
- **Test:** customers who signed up **July to August** (30,178 purchases, fraud rate **4.6 %**), never seen by the model.
- **Why not random?** All 7,600 bot purchases come from January. A random split would put easy bots in both train and test,
  making every method look unrealistically good. The cohort split asks the real question: *will it work on next month's customers?*

### 8.4 Four approaches compared

| Approach | Uses labels in training? | Settings |
|---|---|---|
| **Isolation Forest** (selected) | **No** | 300 trees, features scaled with StandardScaler |
| Local Outlier Factor (LOF) | No | 35 neighbours, novelty = True, fitted on every 3rd training row |
| Rule-based flag | No | flag if purchase within 60 s of signup **OR** device used before |
| XGBoost classifier | **Yes** (reference only) | 300 trees, max_depth = 4, learning_rate = 0.05 |

The fraud label is used **only to evaluate** the unsupervised methods.

### 8.5 Choosing how many to flag

| Review rate | Flagged | Fraud caught | Precision | Recall | Lift |
|---|---|---|---|---|---|
| 1 % | 302 | 66 | 21.9 % | 4.8 % | 4.8x |
| 2 % | 604 | 140 | 23.2 % | 10.1 % | 5.1x |
| **5 % (chosen)** | **1,509** | **326** | **21.6 %** | **23.5 %** | **4.7x** |
| 10 % | 3,018 | 472 | 15.6 % | 34.1 % | 3.4x |

5 % keeps lift near 5x while catching about a quarter of fraud. The flag rate is really a **business decision** based on
how many purchases the review team can check.

### 8.6 Results on the unseen cohort

| Method | ROC-AUC | PR-AUC | Precision | Recall | Lift |
|---|---|---|---|---|---|
| **Isolation Forest** | **0.638** | **0.120** | 21.6 % | 23.5 % | 4.71x |
| Rule-based (flags 6.3 %) | 0.632 | 0.104 | 23.0 % | 31.5 % | 5.01x |
| XGBoost (supervised) | 0.632 | 0.107 | 20.6 % | 22.4 % | 4.49x |
| LOF | 0.561 | 0.081 | 14.2 % | 15.4 % | 3.09x |

Random review would give precision 4.6 % and PR-AUC about 0.046.

**Confusion matrix at 5 %:** 326 fraud caught, 1,183 false alarms, 1,059 fraud missed, 27,610 correctly passed.

**What this means:**
- Isolation Forest ranks fraud best, **without ever seeing a label**.
- The simple rule is just as useful, which tells us the main signal after January is **device reuse**. About 95 % of
  Isolation Forest's flags are also rule flags: the model found the same signal by itself.
- **The supervised XGBoost did not win.** Its training labels were dominated by January bots, a pattern that disappears
  later. Labels only help if past fraud looks like future fraud.
- LOF is weakest: "local density" is not the right idea of unusual here.
- **On the training cohort**, Isolation Forest's top 5 % was **89 % fraud** (it found the January bot burst on its own).

### 8.7 Why flags are only "for review"

About **78 %** of flagged purchases are legitimate. A shared device can be a family computer or a shop terminal. So a
human reviewer makes the final decision; we never auto-block.

---

## 9. Module C: Customer segmentation and value

### 9.1 Goal

Part 1: Group customers into meaningful segments. Part 2: Predict how much each customer will spend in the next 6 months.

### 9.2 RFM features (one row per customer)

| Feature | Meaning |
|---|---|
| **Recency (R)** | Days since the last purchase (lower = more recent) |
| **Frequency (F)** | Number of different (non-cancelled) invoices |
| **Monetary (M)** | Total net spend in £ (purchases minus cancellations) |

- Snapshot date: **10 Dec 2011** (day after the last invoice).
- Only lines with a Customer ID are used. Customers with net spend <= 0 are removed.
- Result: **5,832 customers**.

### 9.3 Transformation

Frequency (skew about 12) and Monetary (skew about 27) are **extremely skewed**: a few wholesalers spend hugely more.
Without fixing this, K-Means would just separate those few giants from everyone else.

So we apply:
1. `log1p` (= log(1 + x)) to all three features, which shrinks big values.
2. **StandardScaler**, which puts all features on the same scale (mean 0, standard deviation 1).

Both steps are inside one **pipeline** with K-Means, so new customers are treated in exactly the same way.

### 9.4 Choosing K (number of clusters)

| K | Inertia | Silhouette |
|---|---|---|
| 2 | 8,545 | 0.439 |
| 3 | 6,333 | 0.347 |
| **4** | **4,930** | **0.365** |
| 5 | 4,110 | 0.341 |
| 6 | 3,566 | 0.333 |
| 7 | 3,196 | 0.302 |
| 8 | 2,906 | 0.303 |

- **Elbow:** inertia drops fast until K = 4, then gains get small.
- **Silhouette:** K = 2 is highest but only splits "active vs inactive" (not useful). **K = 4 is the best for K >= 3.**
- So we chose **K = 4** (good fit and easy to explain to a business).

### 9.5 The four segments

| Segment | Customers | Median recency | Median orders | Median spend | Share of revenue | Action |
|---|---|---|---|---|---|---|
| **Champions** | 1,107 (19 %) | 15 days | 13 | £5,032 | **72 %** | Protect and reward |
| **At-risk regulars** | 1,477 (25 %) | 158 days | 5 | £1,530 | 18 % | Win-back campaigns |
| **Recent low-spend** | 1,220 (21 %) | 23 days | 3 | £702 | 6 % | Nurture to grow |
| **Lapsed one-time buyers** | 2,028 (35 %) | 400 days | 1 | £281 | 4 % | Spend little |

**Naming rule (transparent):** highest median spend = Champions; of the rest, highest recency = Lapsed; of the last two,
higher recency = At-risk regulars, the other = Recent low-spend.

**Key insight:** Champions and At-risk regulars are 44 % of customers but **90 % of revenue** (Pareto principle).

### 9.6 Part 2: Predicting future value

- **Features** from the first 18 months (1 Dec 2009 - 9 Jun 2011): RFM, tenure, average order value.
- **Target:** spend in the next 6 months (10 Jun - 9 Dec 2011). 0 if the customer did not return.
- Customers split 70/30 into train/test. ML models predict `log1p(spend)` because the target is very skewed.

| Model | MAE | Spearman | Top-20 % capture |
|---|---|---|---|
| **XGBoost** | £752 | **0.640** | 78.2 % |
| Random Forest | **£705** | 0.625 | 77.2 % |
| Linear Regression | £943 | 0.607 | 75.7 % |
| Baseline (past monthly spend x 6) | £732 | 0.597 | **78.6 %** |

**What this means:** only 52 % of customers returned in the next 6 months, so this is hard. XGBoost ranks customers best
overall, Random Forest has the lowest £ error, but for picking the top 20 % the **simple baseline is just as good**.
Past spending already tells most of the story. This is a short-term value prediction, **not** full lifetime value.

---

## 10. Notebook 04: Final comparison

- Loads all saved tables, predictions and models. **Does no retraining.**
- Checks every expected file exists (stops with a clear message if one is missing).
- Shows a summary per module and demo predictions using the saved pipelines.
- **Important rule:** scores from different modules are **never compared with each other**. A £ error, a fraud precision
  and a silhouette score measure completely different things. Each model is compared only with its own baselines.

---

## 11. Model theory (how each model works)

### 11.1 Naive and seasonal naive forecasts (baselines)

- **Naive:** "next week will be the same as this week".
- **Seasonal naive:** "next week will be the same as the same week last year".
- **Why use them?** A fancy model is only useful if it beats these simple rules. For seasonal data, seasonal naive is
  the fair baseline.

### 11.2 Linear Regression

- **Idea:** draw the best straight line (or flat surface) through the data.
- **Formula:** `prediction = b0 + b1*x1 + b2*x2 + ...`, where each `b` is a weight learned from data.
- **How it learns:** chooses the weights that make the sum of squared errors as small as possible (Ordinary Least Squares).
- **Good:** simple, fast, easy to explain.
- **Weak:** can only learn straight-line relationships; cannot learn "Saturday = 0" style rules well.

### 11.3 Decision Tree (building block of Random Forest and XGBoost)

- **Idea:** ask a series of yes/no questions, like a flowchart.
  Example: "Is it a holiday period?" -> yes -> predict low. No -> "Is it Saturday?" -> ...
- **How it learns:** at each step it picks the question (feature + threshold) that best splits the data into similar groups.
- **Weak:** one deep tree memorises the training data (overfitting).

### 11.4 Random Forest

- **Idea:** build **many** decision trees and **average** their answers ("wisdom of the crowd").
- **How:** each tree is trained on a random sample of rows (bootstrap sampling) and looks at random subsets of features
  at each split. This makes the trees different from each other.
- **Why it works:** individual trees make different errors; averaging cancels much of the error. This method is called **bagging**.
- **Settings used:** 500 trees; `min_samples_leaf` = 2, 3 or 5 (each leaf needs at least that many rows, which reduces overfitting).

### 11.5 XGBoost (Extreme Gradient Boosting)

- **Idea:** build trees **one after another**, where each new tree **fixes the mistakes** of the trees before it.
- **How:**
  1. Start with a simple prediction (for example the average).
  2. Compute the errors (residuals).
  3. Train a small tree to predict those errors.
  4. Add that tree's prediction (multiplied by a small `learning_rate`) to the total.
  5. Repeat for hundreds of trees.
- **Difference from Random Forest:** Random Forest builds trees **in parallel** and averages (bagging). XGBoost builds
  trees **in sequence**, each correcting the last (boosting).
- **Extras:** built-in regularisation (penalises complex trees), handles missing values, very fast.
- **Settings used:** 300-400 trees, `max_depth` = 3 (small trees), `learning_rate` = 0.05 (small, careful steps).
- **XGBClassifier** works the same way but predicts a probability of fraud instead of a number.

### 11.6 Ensemble / combination model

- **Idea:** average two different forecasts. Our model: `0.5 x seasonal naive + 0.5 x daily XGBoost`.
- **Why it works:** if two models make **different** errors, averaging cancels part of both. This is the same idea as
  Random Forest, but with two different kinds of model.

### 11.7 Isolation Forest (selected anomaly detector)

- **Idea:** anomalies are **few and different**, so they are **easy to isolate**.
- **How:**
  1. Build a tree by picking a **random feature** and a **random split value**, again and again, until each point is alone.
  2. A normal point sits in a crowded area and needs **many** splits to be isolated (long path).
  3. An unusual point sits far away and is isolated in **few** splits (short path).
  4. Repeat with 300 random trees (each built on a sample of 256 rows) and average the path lengths.
  5. **Short average path = high anomaly score.**
- **Score formula:** `score = 2^(-average path length / c(n))`, where `c(n)` is the average path length expected for random data.
  Scores near 1 are very unusual; around 0.5 or less are normal.
- **Why we chose it:** unsupervised (no labels needed), fast on large data, works well with many features, gave the best
  ranking on unseen customers.
- **Threshold:** the top 5 % score in the training cohort (score about 0.656) becomes the review line.

### 11.8 Local Outlier Factor (LOF)

- **Idea:** compare how crowded a point's neighbourhood is with how crowded its neighbours' neighbourhoods are.
- **How:** for each point, look at its 35 nearest neighbours. If the point is in a much **emptier** area than its neighbours,
  it gets a high LOF score (outlier). LOF about 1 = normal.
- **Why it lost here:** fraud in the later cohort was not in "empty" areas; it looked like normal purchases except for device reuse.

### 11.9 Rule-based flag

- **Idea:** a human-written rule: flag if the purchase happened within 60 seconds of signup **OR** the device was used before.
- **Why include it:** easy to explain and a good check. If ML cannot beat a simple rule, we should know.

### 11.10 K-Means clustering

- **Idea:** split customers into K groups so that customers in the same group are similar.
- **How:**
  1. Pick K starting centre points.
  2. Assign each customer to the **nearest centre** (by distance).
  3. Move each centre to the **average** of its customers.
  4. Repeat steps 2-3 until the centres stop moving.
- **Settings:** K = 4, `n_init` = 20 (run 20 times with different starting points and keep the best, because the result
  depends on the start).
- **Why scale first?** K-Means uses distance. Without scaling, Monetary (in thousands of £) would dominate Recency (in days).
- **Predicting a new customer:** apply log + scaling, then assign to the nearest centre.

### 11.11 StandardScaler

- Converts each feature to `z = (x - mean) / standard deviation`, so every feature has mean 0 and standard deviation 1.
- Needed for distance-based methods (K-Means, LOF) and helpful for Linear Regression and Isolation Forest.
- **Always fitted on training data only**, then applied to test data (to avoid leakage).

### 11.12 Log transform (`log1p`)

- `log1p(x) = log(1 + x)`. Works for 0 (log(1) = 0).
- Shrinks very large values and spreads out small ones, so skewed data becomes more balanced.

---

## 12. Metrics explained simply

### Regression (forecasting, future spend)

| Metric | Simple meaning | Better when |
|---|---|---|
| **MAE** (Mean Absolute Error) | Average size of the miss, in £. `mean(|actual - predicted|)` | Lower |
| **RMSE** (Root Mean Squared Error) | Like MAE, but big misses are punished more (errors are squared first) | Lower |
| **R²** | Share of the ups and downs the model explains. 1 = perfect, 0 = no better than the average, negative = worse than the average | Higher |
| **MAPE** | Average miss as a % of the actual value | Lower |
| **Spearman correlation** | Does the model put customers in the right **order**? (-1 to 1) | Higher |
| **Top-20 % capture** | Share of future revenue coming from the 20 % of customers the model ranks highest | Higher |

### Classification / anomaly detection

| Metric | Simple meaning |
|---|---|
| **Precision** | Of the purchases we flagged, how many were really fraud? (21.6 % means about 1 in 5) |
| **Recall** | Of all the fraud, how much did we catch? (23.5 %) |
| **Lift** | Precision divided by the fraud rate. How many times better than checking random purchases (4.7x) |
| **ROC-AUC** | Chance that a random fraud gets a higher score than a random normal purchase. 0.5 = guessing, 1 = perfect |
| **PR-AUC** | Average precision over all thresholds. Better than ROC-AUC when fraud is rare. Random = fraud rate (0.046) |
| **Confusion matrix** | Table of true positives (caught), false positives (false alarms), false negatives (missed), true negatives |

### Clustering

| Metric | Simple meaning |
|---|---|
| **Inertia** | Total squared distance of customers from their cluster centre. Lower = tighter clusters (always falls as K grows) |
| **Elbow method** | Plot inertia vs K; pick the K where the curve bends and improvements become small |
| **Silhouette score** | How well each customer fits its own cluster compared with the nearest other cluster. -1 to 1, higher = better separated |

---

## 13. Important ML concepts used

| Concept | Simple explanation | Where in our project |
|---|---|---|
| **Supervised learning** | Learn from examples that have the correct answer | Forecasting, XGBoost fraud reference, future spend |
| **Unsupervised learning** | Find patterns without correct answers | Isolation Forest, LOF, K-Means |
| **Data leakage** | Accidentally using information the model would not have at prediction time. Makes results look fake-good | Prevented: features use only past data, scalers fitted on training only |
| **Time-based split** | Train on the past, test on the future | Forecasting (last 21 weeks), fraud (later signup cohort), future spend (18 + 6 months) |
| **Baseline** | A simple method every model must beat | Naive, seasonal naive, training mean, rule-based, past-spend x 6 |
| **Overfitting** | Model memorises training data and fails on new data | Controlled with small trees, min_samples_leaf, held-out testing |
| **Backtesting** | Repeat the train/test process on several earlier periods | 3 windows in forecasting |
| **Feature engineering** | Creating useful inputs from raw data | Lags, rolling means, holiday flags, device reuse counts, RFM |
| **Pipeline** | Chain preprocessing and model into one object | Scaler + Isolation Forest; log + scaler + K-Means |
| **Class imbalance** | One class is much rarer (fraud is 4.6 % in test) | Used PR-AUC, precision, recall, lift instead of plain accuracy |
| **Concept drift** | The pattern changes over time | January bots vs later fraud: why supervised XGBoost failed |
| **Random state = 42** | Fixed random seed so results are the same every run | All models |
| **Model saving** | Store trained models to reuse later | `models/*.joblib` |

---

## 14. The website (RetailMind dashboard)

- Name: **RetailMind**. Location: `website/index.html` (open in a browser).
- Every chart and table has a short "What it shows / Why it helps" note in simple words.
- Built with plain **HTML, CSS and JavaScript**, charts with **Chart.js**, colours cream, beige and brown.
- **Sections:** data and cleaning, Module A, Module B, Module C, final comparison, gallery of all 27 notebook figures.
- **Charts:** actual vs predicted (toggle each model), MAE ranking, backtest, feature importance, residuals, ROC and PR
  curves, score histogram, confusion matrix, review trade-off, customer map, segment shares, elbow/silhouette, future-value models.
- **Live predictions in the browser:**
  - Forecast: change the blend weight and see MAE, MAPE and R² update.
  - Anomaly: move sliders for a transaction and the real Isolation Forest (all 300 trees) scores it.
  - Segmentation: enter RFM values or a real customer ID and the real K-Means pipeline assigns a segment.
- **How the models run in the browser:** `website/build_data.py` exports the trained trees, scaler values and cluster
  centres into `models.js`. The JavaScript versions were checked against Python: **identical results** (score difference
  below 0.0000002, all test customers in the same segment).

---

## 15. Limitations and future improvements

| Module | Limitations | How to improve |
|---|---|---|
| Forecasting | Only 2 years = only one previous season; forecasts lag behind growth; one-off wholesale orders cause big misses; no promotion/marketing data; the combination was added after a first comparison (disclosed) | More years of data, a year-over-year growth adjustment, separate UK and wholesale forecasts, promotion calendars |
| Anomaly | About 78 % of flags are legitimate; fraud patterns change over time; only first purchases; dataset origin unknown and maybe partly simulated | Payment and address verification data, device fingerprints, chargeback results, regular retraining |
| Segmentation | 22 % of lines have no customer ID; wholesalers and retail customers are mixed; only a 6-month future window | Customer type (wholesale vs retail), marketing history, more years for true lifetime value |

---

## 16. Viva questions and answers

### General

**Q1. What is your project about?**
Three ML modules for an online shop: forecasting weekly revenue, detecting unusual (possibly fraudulent) purchases, and
segmenting customers by value. Each uses a real public dataset and is tested on held-out data.

**Q2. Why did you use two datasets?**
No single public dataset supports all three tasks. Online Retail II has real seasonality and repeat customers (good for
forecasting and segmentation); the fraud dataset has a real fraud label (so anomaly detection can be measured).

**Q3. What was wrong with version 1?**
It used a synthetic dataset whose weekly revenue was pure random noise (Ljung-Box showed nothing to forecast) and it had
no fraud label, so neither forecasting nor anomaly detection could be meaningfully evaluated.

**Q4. What is the difference between supervised and unsupervised learning? Give examples from your project.**
Supervised learns from labelled answers (forecasting models learn from actual revenue). Unsupervised finds patterns
without answers (Isolation Forest, LOF and K-Means never see a label).

**Q5. What is data leakage and how did you prevent it?**
Leakage is using information that would not be available at prediction time, which makes results look better than reality.
We prevented it by: using only past weeks in forecasting features, counting only earlier device/IP purchases, splitting by
time or cohort, fitting scalers on training data only, and computing future-value features from a window before the target.

**Q6. Why did you not use a random train/test split?**
For time series, random splitting lets the model learn from the future. For fraud, a random split would put the easy January
bots into both train and test, making results look too good. Time-based splits reflect real use.

**Q7. What is a baseline and why is it important?**
A very simple method (like "same as last year"). If an ML model cannot beat it, the ML model is not worth using.

**Q8. Why random_state = 42?**
To fix the randomness so anyone running the notebooks gets the same results (reproducibility). The number itself does not matter.

### Data cleaning

**Q9. Why did you keep cancellations?**
To compute **net** revenue (sales minus cancellations). It also automatically removes huge orders that were placed and then cancelled.

**Q10. Why didn't you fill in missing Customer IDs?**
Inventing IDs would create fake customers. Those lines are still real sales, so they are used for forecasting but excluded from segmentation.

**Q11. What did you remove during cleaning?**
Exact duplicates (34,335), non-product codes like postage, fees and tests (5,799), and lines with price <= 0 (5,965). About 4 % in total.

### Module A: Forecasting

**Q12. What are you forecasting exactly?**
Next week's total net revenue in £, using only information known at the end of the previous week.

**Q13. How did you know the revenue is predictable?**
The two years have the same seasonal shape, lag-1 autocorrelation is about 0.7, and the Ljung-Box test p-value is about 0,
so the series is not random noise.

**Q14. What is the seasonal naive model?**
It predicts this week's revenue as the revenue of the same week last year. It is the fair baseline for seasonal data.

**Q15. Why did you model daily data when the target is weekly?**
Only about 83 training weeks exist, too few for tree models. Daily rows give about 7 times more data and let the model learn
weekday effects like "no trading on Saturday". Daily predictions are summed into weekly totals.

**Q16. Why did the combination model win?**
Seasonal naive and daily XGBoost make different kinds of errors. Averaging them cancels part of each, giving the lowest error on every metric.

**Q17. Isn't adding the combination after seeing results a form of cheating?**
We disclosed it openly. To check it was not luck, we ran a 3-window backtest on periods the test set never touched; the
combination beat seasonal naive in the two windows where ML had a full year of history.

**Q18. What does MAE £31,966 mean?**
On average, the weekly forecast is off by about £32k, about 14 % of actual weekly revenue.

**Q19. What does R² = 0.65 mean?**
The model explains about 65 % of the week-to-week variation in revenue in the test period.

**Q20. Why is the training mean R² negative?**
Negative R² means it is worse than simply predicting the test-period average. The training mean cannot follow the autumn rise.

**Q21. Which features were most important?**
`holiday_period`, `day_of_week` and `prev_week`, then `month`. The model learned the calendar and the current demand level.

**Q22. Why does the forecast usually under-predict?**
2011 grew compared with 2010, and half of the forecast is last year's value, so it lags behind growth. A growth adjustment would help.

**Q23. Difference between MAE and RMSE?**
MAE treats all errors equally. RMSE squares errors first, so big misses count much more. RMSE >= MAE always.

### Module B: Anomaly detection

**Q24. Why use unsupervised anomaly detection when you have labels?**
In real life, fraud labels arrive late (chargebacks) and fraud keeps changing. An unsupervised detector works without labels.
We used labels only to measure performance honestly.

**Q25. How does Isolation Forest work?**
It builds random trees that split data on random features and values. Unusual points get isolated in fewer splits (short
paths). Averaging path lengths over 300 trees gives an anomaly score: shorter path = more unusual.

**Q26. Why did supervised XGBoost not beat Isolation Forest?**
Its training labels were dominated by the January bot burst. That pattern did not exist in the July-August test customers
(concept drift), so it learned the wrong lesson.

**Q27. Why only 5 % review rate?**
It is a capacity decision. At 5 %, lift stays near 5x and we catch about a quarter of fraud. Going to 10 % catches more but precision drops to 16 %.

**Q28. Precision is only 21.6 %. Isn't that bad?**
The fraud rate is only 4.6 %, so random checking finds fraud 4.6 % of the time. 21.6 % is 4.7 times better. Flags go to a
human reviewer, not automatic blocking.

**Q29. Why not use accuracy?**
With 95.4 % normal purchases, a model saying "never fraud" is 95.4 % accurate but useless. Precision, recall, lift, ROC-AUC and PR-AUC are meaningful for rare events.

**Q30. What is ROC-AUC 0.64?**
If you pick one fraud and one normal purchase at random, there is a 64 % chance the fraud gets the higher score (50 % = guessing).

**Q31. Why did you not use `sex` as a feature?**
It had no signal, and flagging people based on a protected attribute would be unfair.

**Q32. Why did you exclude device_id and ip_address?**
They are identifiers; their numeric values mean nothing. Instead we engineered meaningful features: how many earlier purchases came from the same device or IP.

**Q33. What did the rule-based method tell you?**
A simple rule (device used before, or purchase within 60 seconds) is as useful as Isolation Forest, showing that device
reuse is the main detectable signal after January. About 95 % of Isolation Forest flags are also rule flags.

**Q34. Did Isolation Forest really find fraud on its own?**
Yes. In the training cohort (no labels used), its top 5 % was 89 % fraud, mostly the January bots.

### Module C: Segmentation

**Q35. What is RFM?**
Recency (days since last purchase), Frequency (number of orders) and Monetary (total spend). A classic marketing way to describe customer value.

**Q36. Why log transform before K-Means?**
Frequency and Monetary are extremely skewed. Without the log, K-Means would mostly separate a few huge wholesalers from everyone else.

**Q37. Why scale the features?**
K-Means uses distances. Without scaling, Monetary (thousands of £) would dominate Recency (days).

**Q38. How did you choose K = 4?**
The elbow in inertia is around 4, and K = 4 has the best silhouette among K >= 3. K = 2 scores higher but only splits active vs inactive, which is not useful.

**Q39. What does silhouette 0.36 mean?**
Clusters are reasonably separated but boundaries are soft (customers form a continuum). Above 0.25 is usually considered a reasonable structure.

**Q40. What is the main business insight?**
Champions are 19 % of customers but bring 72 % of revenue. Together with At-risk regulars they bring 90 %. Protect
Champions, win back At-risk regulars, nurture Recent low-spend, and spend little on Lapsed buyers.

**Q41. What is the limitation of K-Means?**
You must choose K, it assumes round clusters of similar size, results depend on starting points (we used n_init = 20), and it is sensitive to scale and outliers.

**Q42. Is this Customer Lifetime Value?**
No. Segment value is historical. Our future-value model predicts only the next 6 months, which is a short-term, limited form of CLV.

**Q43. Did ML beat the simple baseline for future spend?**
Partly. XGBoost ranked customers better (Spearman 0.64 vs 0.60) and Random Forest had lower MAE, but for picking the top 20 %
customers the baseline was just as good (78.6 %). Past spending already explains most of it.

### Models and theory

**Q44. Difference between Random Forest and XGBoost?**
Random Forest builds many independent trees in parallel on random samples and averages them (bagging, reduces variance).
XGBoost builds trees one after another, each correcting the previous errors (boosting, reduces bias).

**Q45. What is a learning rate in XGBoost?**
How much each new tree's correction is trusted. A small value (0.05) means small careful steps, needing more trees but generalising better.

**Q46. What is max_depth?**
The maximum number of questions in a tree. We used 3 to keep trees small and avoid overfitting on little data.

**Q47. What is overfitting and how did you avoid it?**
When a model memorises training data and fails on new data. We used small trees, min_samples_leaf, modest settings not tuned
on the test set, and always measured on held-out data.

**Q48. What is a pipeline and why use it?**
A chain of steps (e.g. log -> scaler -> K-Means) saved as one object. It guarantees new data is processed exactly like the training data.

**Q49. Why save models with joblib?**
So notebook 04 and the website can use the trained models without retraining.

**Q50. How does the website make predictions without Python?**
`build_data.py` exports the trained Isolation Forest trees, scaler values and K-Means centres into a JavaScript file. The
browser runs the same maths. We verified the browser results match Python exactly.

---

## 17. Key numbers to remember

| What | Number |
|---|---|
| Online Retail II raw / clean lines | 1,067,371 / 1,021,272 |
| Fraud dataset purchases / fraud rate | 151,112 / 9.36 % (test cohort 4.6 %) |
| Customers segmented | 5,832 |
| Complete weeks / test weeks | 104 / 21 |
| Forecast MAE / MAPE / R² | £31,966 / 14.4 % / 0.65 |
| Improvement over seasonal naive / mean | 5.2 % / 55 % |
| Isolation Forest precision / recall / lift | 21.6 % / 23.5 % / 4.7x |
| Isolation Forest ROC-AUC / PR-AUC | 0.638 / 0.120 |
| Review rate | 5 % (1,509 of 30,178 test purchases) |
| Number of segments / silhouette | 4 / 0.365 |
| Champions share of customers / revenue | 19 % / 72 % |
| Future spend Spearman (XGBoost) | 0.64 |
| Instant bot purchases (all fraud) | 7,600 |
