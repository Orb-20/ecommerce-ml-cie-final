# RetailMind: Complete Project Documentation

**E-commerce Machine Learning CIE Project (Version 2)**

This document explains the whole project from start to finish: **what we did** at every step and **why we did it**.
Everything is written in simple language.

---

## Contents

1. [The problem we are solving](#1-the-problem-we-are-solving)
2. [Our solution in short](#2-our-solution-in-short)
3. [Choosing the data](#3-choosing-the-data)
4. [Tools we used](#4-tools-we-used)
5. [How the project is organised](#5-how-the-project-is-organised)
6. [Step 1: Exploring and cleaning the data (Notebook 00)](#6-step-1-exploring-and-cleaning-the-data-notebook-00)
7. [Step 2: Module A - Revenue forecasting (Notebook 01)](#7-step-2-module-a---revenue-forecasting-notebook-01)
8. [Step 3: Module B - Anomaly and risk detection (Notebook 02)](#8-step-3-module-b---anomaly-and-risk-detection-notebook-02)
9. [Step 4: Module C - Customer segmentation and value (Notebook 03)](#9-step-4-module-c---customer-segmentation-and-value-notebook-03)
10. [Step 5: Final comparison (Notebook 04)](#10-step-5-final-comparison-notebook-04)
11. [Step 6: The RetailMind website](#11-step-6-the-retailmind-website)
12. [How the models work (simple theory)](#12-how-the-models-work-simple-theory)
13. [How we measured success (metrics)](#13-how-we-measured-success-metrics)
14. [Good practices we followed](#14-good-practices-we-followed)
15. [Final results](#15-final-results)
16. [Limitations](#16-limitations)
17. [Future improvements](#17-future-improvements)
18. [How to run the project](#18-how-to-run-the-project)
19. [Conclusion](#19-conclusion)

---

## 1. The problem we are solving

An online shop collects a huge amount of data every day: orders, cancellations, customers, sign-ups and payments. But
raw data alone does not help anyone make decisions. The shop's managers want answers to three questions:

| Question | Who needs it | Why it matters |
|---|---|---|
| **How much money will we make next week?** | Finance and stock planning teams | To order the right stock, plan staff and manage cash |
| **Which purchases look suspicious?** | Fraud / risk team | Fraud costs money; checking every order is impossible |
| **Who are our customers and which ones are valuable?** | Marketing team | To spend the marketing budget on the right people |

**Our goal:** build one machine-learning module for each question, test each one honestly on data it has never seen,
and present everything clearly on a website.

---

## 2. Our solution in short

| Module | Business question | What we built | Selected model | Headline result |
|---|---|---|---|---|
| **A. Revenue forecasting** | How much net revenue next week? | A model that predicts weekly revenue | 50/50 mix of **seasonal naive** and **daily XGBoost** | Average weekly error **£31,966** (14.4 %), R² 0.65 |
| **B. Anomaly and risk detection** | Which purchases should be reviewed? | A detector that scores how unusual each purchase is | **Isolation Forest**, review top 5 % | Flags are fraud **4.7 times** more often than random checks |
| **C. Customer segmentation and value** | Who are our customers? | Customer groups + a future-spend predictor | **RFM + K-Means (4 groups)** | **19 %** of customers (Champions) bring **72 %** of revenue |

Plus:
- **Notebook 04** brings all results together.
- The **RetailMind website** shows every chart, metric, comparison and live prediction.

---

## 3. Choosing the data

### What we did

We used **two real, public datasets** instead of one.

| Dataset | Used for | Size | Period |
|---|---|---|---|
| **UCI Online Retail II** | Module A and Module C | 1,067,371 invoice lines, 5,875 customers | Dec 2009 - Dec 2011 |
| **E-commerce Fraud Data** | Module B | 151,112 purchases, 9.36 % fraud | Jan - Dec 2015 |

### Why we did it

- **Version 1 of this project failed** because it used one synthetic (made-up) dataset. Its weekly revenue was pure
  random noise, so there was nothing to forecast, and it had no fraud label, so fraud detection could not be measured.
- **No single public dataset supports all three tasks well.** So we chose the best dataset for each job:
  - **Online Retail II** is real sales from a UK online gift shop. It has strong yearly and weekly patterns (needed for
    forecasting), real repeat customers with IDs (needed for segmentation), and two full years (needed for a future-spend test).
    It is free to use under the CC BY 4.0 licence.
  - **E-commerce Fraud Data** is one of very few public e-commerce datasets with a **real fraud label** that can be
    downloaded without a login. With labels we can **measure** how good the fraud detector really is.

### Datasets we rejected and why

| Dataset | Reason rejected |
|---|---|
| Olist (Brazil) | Needs a Kaggle login; most customers buy only once, so customer grouping is weak |
| IEEE-CIS fraud | Needs a Kaggle login; columns are anonymised, so features have no meaning |
| Kaggle "Fraudulent E-Commerce Transactions" | Needs a Kaggle login; column details could not be verified |

---

## 4. Tools we used

| Tool | What we used it for | Why this tool |
|---|---|---|
| **Python 3.13** | The programming language | The standard language for data science |
| **Jupyter Notebooks** | Writing code, charts and explanations together | Each step is shown with its result, easy to follow and present |
| **pandas** | Loading, cleaning and grouping data | The best library for tables |
| **numpy** | Maths on arrays | Fast and used by every other library |
| **matplotlib, seaborn** | Charts in the notebooks | Flexible and clear statistical charts |
| **scikit-learn** | Linear Regression, Random Forest, Isolation Forest, LOF, K-Means, scaling, metrics, pipelines | The standard, well-tested ML library |
| **XGBoost** | Gradient boosting models | One of the most accurate methods for table data |
| **statsmodels** | Autocorrelation and Ljung-Box test | To prove revenue has real patterns |
| **scipy** | Spearman correlation and statistics | Standard scientific functions |
| **joblib** | Saving trained models | So models can be reused without retraining |
| **openpyxl** | Reading the Excel file | Online Retail II comes as an Excel file |
| **HTML, CSS, JavaScript, Chart.js** | The RetailMind website | Runs in any browser, no server needed |

---

## 5. How the project is organised

```text
ecommerce-ml-cie-v2/
├── data/
│   ├── raw/          Original files (never changed)
│   └── processed/    Cleaned Online Retail data (made by notebook 00)
├── notebooks/        00 to 04, run in order
├── src/              Shared feature code (forecast_features.py, fraud_features.py)
├── outputs/
│   ├── figures/      Charts (PNG)
│   ├── tables/       Results tables (CSV)
│   └── predictions/  Model predictions (CSV)
├── models/           Saved trained models (.joblib)
├── website/          The RetailMind website
└── requirements.txt  List of libraries
```

### Why organised this way

- **Raw data is never changed**, so anyone can repeat the work from the original files.
- **Notebooks are numbered** so the order is clear; each one uses outputs from the one before.
- **Shared feature code lives in `src/`**, so training and later use build features in exactly the same way (no
  copy-paste mistakes).
- **Outputs and models are saved to files**, so the final notebook and the website can load them without retraining.

---

## 6. Step 1: Exploring and cleaning the data (Notebook 00)

### 6.1 Online Retail II

#### What we did

1. Loaded both sheets of the Excel file (2009-2010 and 2010-2011) and joined them.
2. Checked data quality: missing values, duplicates, strange product codes, negative values.
3. Applied clear, written cleaning rules:

| Rule | Rows removed | Why |
|---|---|---|
| Remove exact duplicate rows | 34,335 | The same line logged twice is an error |
| Remove non-product codes (postage, bank charges, Amazon fees, discounts, manual entries, samples, tests, gift vouchers) | 5,799 | These are fees or accounting entries, not product sales |
| Remove bad-debt adjustments | 0 (already caught) | Accounting entries, not sales |
| Remove lines with price <= 0 | 5,965 | Free items or adjustments with no sale value |
| Remove non-cancelled lines with quantity <= 0 | 0 (already caught) | Stock corrections, not customer orders |
| **Keep cancellations** | - | Needed to calculate **net revenue** (sales minus cancellations) |
| **Keep lines without a Customer ID** | - | They are real sales (guest checkouts), so they count for revenue |
| Add a `revenue` column = quantity x price | - | Cancellations get negative revenue automatically |

Result: **1,067,371 lines became 1,021,272 lines** (about 4 % removed). Saved as `data/processed/online_retail_clean.csv.gz`.

4. Explored patterns over time, countries, customers and extreme values.

#### Why we did it

- Real data is messy. Fees, duplicates and tests would make revenue look wrong and confuse the models.
- Every rule is written down so the cleaning is **transparent and repeatable**.
- We did **not invent missing Customer IDs**, because that would create fake customers.
- We saved one clean file so every later notebook uses **the same cleaned data**.

#### What we found

- **22.8 %** of lines have no Customer ID (used for revenue, not for customer grouping).
- The four biggest lines (for example 80,995 paper birds worth £168,000) were **cancelled in full**. Using net revenue
  removes them automatically, which is why we kept cancellations.
- The **UK** makes about **85 %** of revenue.
- **Yearly pattern:** steady from January to August, a big rise from September, a peak in **November** (Christmas
  orders), then a drop at Christmas when the shop closes.
- **Weekly pattern:** **no sales on Saturdays** (all 104 Saturdays are zero), Sunday about half a normal day, Thursday strongest.
- About 28 % of customers bought only once; a few wholesalers bought dozens of times.

**Why this matters:** these patterns prove there is something real to forecast, and the big differences between
customers make segmentation useful.

### 6.2 E-commerce Fraud Data

#### What we did

Loaded and checked the data, then compared fraud and normal purchases.

#### What we found

- No missing values, no duplicates, one row per user. No cleaning needed.
- **7,600 purchases happened within 1 second of signup, and every single one was fraud** (automated bots).
- When **6 or more users share one device**, about **91 %** of purchases are fraud (only about 3 % for a single-user device).
- Purchase value, source, browser and sex look almost the same for fraud and normal purchases.
- **January** has a fraud rate of about **76 %** (the bot burst); all other months are about **4.5-6 %**.

#### Why this matters

- It told us which features to build: **timing** and **device / IP sharing**, not demographics.
- It warned us that a random train/test split would be misleading, because the easy January bots would appear in both.
  So we split by time instead (see Module B).

---

## 7. Step 2: Module A - Revenue forecasting (Notebook 01)

### 7.1 Goal

Predict **next week's total net revenue** (in £), using only what is known at the end of the current week.

**Why:** a weekly forecast helps the shop plan stock, staff and cash. "Net" revenue (after cancellations) is what the
shop actually earns.

### 7.2 Building the target

**What we did:** added up revenue per day (days without sales = 0), then per week (Monday to Sunday). We removed the
first and last weeks because they were incomplete. This left **104 complete weeks**.

**Why:** an incomplete week would look like a sudden drop in sales and mislead the model.

### 7.3 Checking that revenue can be predicted

**What we did:**
- Drew 2010 and 2011 on top of each other by week of the year.
- Measured **autocorrelation** (how related this week is to past weeks): about **0.7** for last week.
- Ran the **Ljung-Box test**: p-value about **0**.

**Why:** before building a model, we must prove the data is not random. The two years follow the same shape and the
test confirms real patterns, unlike version 1.

### 7.4 Creating features (inputs)

**What we did:** built two sets of features.

**Weekly models** (one row per week):

| Feature | Meaning |
|---|---|
| `lag_1`, `lag_2`, `lag_4` | Revenue 1, 2 and 4 weeks ago |
| `rolling_mean_4` | Average of the last 4 weeks |
| `month`, `week_of_year` | Where we are in the year |
| `holiday_week` | Is it the Christmas closure (22 Dec - 4 Jan)? |

**Daily models** (one row per day, then the 7 days are added into a weekly total):

| Feature | Meaning |
|---|---|
| `prev_week`, `prev2_week` | Total revenue of the last week and the week before |
| `rolling_mean_4_weeks` | Average of the last 4 weekly totals |
| `same_weekday_last_week` | Sales on the same weekday last week |
| `day_of_week` | Monday to Sunday |
| `month`, `day_of_year` | Where we are in the year |
| `holiday_period` | Christmas closure flag |

**Why:**
- Past revenue tells the model the **current level** of demand.
- Calendar features teach it the **seasonal patterns** (November peak, Saturday zero, Christmas closure).
- **Why daily models?** Two years gives only about 83 training weeks, which is too little for tree models. Using days
  gives about **7 times more training rows**, and lets the model learn weekday effects. We still measure weekly accuracy.
- **No leakage:** every feature is known by the end of the previous Sunday. This is checked in code, so the model never
  "peeks" at the week it is predicting.

### 7.5 Splitting into training and test data

**What we did:** used the **first 83 weeks** (Dec 2009 - Jul 2011) for training and the **last 21 weeks** (Jul - Dec 2011)
for testing.

**Why:**
- In real life we always predict the future from the past, so the test must come **after** the training data.
- A random split would let the model learn from future weeks, which is cheating.
- The test period includes the autumn peak, the hardest and most important time to forecast.

### 7.6 Models we compared

| Model | Type | Why we included it |
|---|---|---|
| Naive (last week) | Baseline | The simplest possible forecast |
| Training mean | Baseline | "Revenue stays at its usual level" |
| **Seasonal naive** (same week last year) | Baseline | The fair baseline for seasonal data; every ML model must beat it |
| Linear Regression (weekly) | ML | Simple and explainable |
| Random Forest (weekly and daily) | ML | Learns non-linear patterns, robust |
| XGBoost (weekly and daily) | ML | Usually the most accurate on table data |
| **Combination** (0.5 x seasonal naive + 0.5 x daily XGBoost) | Ensemble | Mixes "last year" knowledge with recent-trend learning |

**Why baselines?** An ML model is only worth using if it beats simple rules. Without baselines, we would not know if
the model really learned anything.

**Model settings:** Random Forest 500 trees; XGBoost 300-400 trees, depth 3, learning rate 0.05. Settings were kept modest
and **not tuned on the test weeks**, to avoid overfitting to the test set.

### 7.7 Results (21 test weeks)

| Model | Average error (MAE) | RMSE | R² | % error (MAPE) |
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

**What this tells us:**
- Every model using the past easily beats the training mean.
- **Seasonal naive is very strong**, because autumn 2011 looked like autumn 2010.
- **Daily XGBoost** is the best single ML model and makes fewer big mistakes than seasonal naive.
- Using **daily** data helped both tree models (XGBoost £37.1k down to £35.2k).
- The **combination wins on every measure**: **5.2 % better than seasonal naive** and **55 % better than the mean**.

**Why the combination works:** the two parts make **different kinds of mistakes**. Seasonal naive copies last year's
random ups and downs; XGBoost reacts to recent weeks. Averaging them cancels part of both errors.

**Honesty note:** the combination was added after the first comparison. We say this openly, and we checked it with the
backtest below on periods the test never touched.

### 7.8 Backtest (robustness check)

**What we did:** repeated the whole process on three earlier 10-week periods inside the training data.

| Period | Combination | Seasonal naive |
|---|---|---|
| Dec 2010 - Feb 2011 | £46,727 | **£27,484** |
| Feb - Apr 2011 | **£20,773** | £21,779 |
| May - Jul 2011 | **£32,829** | £35,542 |

**Why:** one test period could be lucky. Testing on several periods shows how reliable the model really is.

**What we learned:** in the first period, ML had less than a year of history and had never seen Christmas, so it failed.
Once a full year was available, the combination beat seasonal naive. **ML needs at least one full seasonal cycle.**

### 7.9 Checking the errors

**What we did:** looked at the error for each test week and at feature importance.

**What we found:**
- The forecast was **too low in 16 of 21 weeks** (about £13.7k on average), because 2011 grew compared with 2010 and half
  the forecast copies last year.
- The biggest misses were single weeks in September/October, probably large one-off wholesale orders.
- XGBoost relies most on **holiday period**, **day of week** and **last week's revenue**, then month.

**Why:** error analysis shows **where** and **why** the model fails, and points to improvements (like a growth adjustment).

### 7.10 Saved outputs

Metrics and backtest tables, test predictions, charts, and the trained model (`models/01_forecast_selected.joblib`).

---

## 8. Step 3: Module B - Anomaly and risk detection (Notebook 02)

### 8.1 Goal

Give every purchase an **"unusualness" score** and send the most unusual ones to a **review queue** for a person to check.

**Why:** the shop cannot check every purchase. Ranking them lets a small team focus on the riskiest ones. A flag means
**"please check"**, not "this is fraud", because a human makes the final decision.

### 8.2 Why unsupervised (no labels during training)?

In real life, fraud labels arrive late (for example when a customer disputes a payment weeks later), and fraudsters keep
changing their methods. A detector that works **without labels** can be used from day one. We used the labels **only to
measure** how well it works. We also trained one supervised model, clearly separated, to see what labels would add.

### 8.3 Creating features

| Feature | Meaning | Why |
|---|---|---|
| `log_seconds_to_purchase` | Time from signup to purchase (log scale) | Bots buy instantly |
| `purchase_value` | Amount spent ($) | Unusual basket sizes |
| `age` | Customer age | Unusual age / amount combinations |
| `prior_purchases_same_device` | Earlier purchases from the same device | Shared devices were a strong fraud signal |
| `prior_purchases_same_ip` | Earlier purchases from the same IP address | Same idea for networks |
| `purchase_hour` | Hour of the day | Unusual timing |
| `log_seconds_since_device_last_used` | Time since the device last bought (about 3 years if never) | Bursts from one device |

**Features we deliberately did NOT use, and why:**
- `user_id`, `device_id`, `ip_address` raw values: they are just ID numbers with no meaning. Instead we counted how often they repeat.
- `source`, `browser`: fraud rates are almost the same in every category.
- `sex`: no useful signal, and flagging people by a protected attribute would be **unfair**.

**Why log scale for time?** Times range from 1 second to months. A log scale spreads them evenly so the model can tell
"1 second" from "1 hour" from "1 week".

**No leakage:** device and IP counts only look at **earlier** purchases, never at purchases that happen later.

### 8.4 Splitting the data by signup cohort

**What we did:** trained on customers who signed up **January to June** (120,934 purchases) and tested on customers who
signed up **July to August** (30,178 purchases, fraud rate 4.6 %).

**Why:** all 7,600 bot purchases come from January. A random split would put easy bots in both training and test, and
every method would look excellent for the wrong reason. Our split asks the real question: *will it work on next month's
new customers?* The scaler and every model are fitted on training customers only.

### 8.5 Methods we compared

| Method | Uses labels? | Why we included it |
|---|---|---|
| **Isolation Forest** (300 trees) | No | Main detector: fast, unsupervised, designed for anomalies |
| Local Outlier Factor (35 neighbours) | No | A different idea of "unusual" (empty neighbourhoods) |
| Rule-based flag | No | Simple human rule: purchase within 60 seconds of signup OR device used before |
| XGBoost classifier | **Yes** | Reference: shows what labelled history adds |

### 8.6 Choosing how many purchases to flag

| Review rate | Flagged | Fraud caught | Precision | Recall | Lift |
|---|---|---|---|---|---|
| 1 % | 302 | 66 | 21.9 % | 4.8 % | 4.8x |
| 2 % | 604 | 140 | 23.2 % | 10.1 % | 5.1x |
| **5 % (chosen)** | **1,509** | **326** | **21.6 %** | **23.5 %** | **4.7x** |
| 10 % | 3,018 | 472 | 15.6 % | 34.1 % | 3.4x |

**Why 5 %:** it keeps the detector almost 5 times better than random checking while catching about a quarter of all fraud.
Going to 10 % catches more fraud but most extra flags are innocent. In practice this number depends on how many orders
the review team can check.

### 8.7 Results on unseen customers

| Method | ROC-AUC | PR-AUC | Precision | Recall | Lift |
|---|---|---|---|---|---|
| **Isolation Forest** | **0.638** | **0.120** | 21.6 % | 23.5 % | 4.71x |
| Rule-based (flags 6.3 %) | 0.632 | 0.104 | 23.0 % | 31.5 % | 5.01x |
| XGBoost (supervised) | 0.632 | 0.107 | 20.6 % | 22.4 % | 4.49x |
| LOF | 0.561 | 0.081 | 14.2 % | 15.4 % | 3.09x |

Random checking would give precision 4.6 %.

**At the 5 % review rate:** 326 fraud cases caught, 1,183 false alarms, 1,059 fraud cases missed, 27,610 normal purchases correctly passed.

**What this tells us:**
- **Isolation Forest ranks fraud best, without ever seeing a label.** That is why we selected it.
- The **simple rule** is just as useful, showing the main detectable signal after January is **device reuse**. About 95 %
  of Isolation Forest's flags are also rule flags: the model found the same signal by itself.
- **The supervised XGBoost did not win.** Its training labels were mostly January bots, a pattern that disappeared later
  (this is called **concept drift**). Labels only help when past fraud looks like future fraud.
- **LOF was weakest**, because fraud here does not sit in "empty" areas of the data.
- **Inside the training customers**, Isolation Forest's top 5 % was **89 % fraud**: it found the January bots completely on its own.

### 8.8 Why flags are only "for review"

About **78 %** of flagged purchases are innocent. A shared device can be a family computer or a shop terminal. So a
person checks every flag; nothing is blocked automatically.

### 8.9 Saved outputs

Method comparison, flag-rate tables, top unusual purchases, test scores, charts, and the trained pipeline
(`models/02_isolation_forest_pipeline.joblib`).

---

## 9. Step 4: Module C - Customer segmentation and value (Notebook 03)

### 9.1 Goal

- **Part 1:** group customers into a few meaningful segments.
- **Part 2:** predict how much each customer will spend in the next 6 months.

**Why:** treating every customer the same wastes money. Groups let marketing give each type of customer the right message.

### 9.2 Building RFM features

**What we did:** made one row per customer with:

| Feature | Meaning |
|---|---|
| **Recency** | Days since the last purchase (smaller = more recent) |
| **Frequency** | Number of different orders |
| **Monetary** | Total net spend in £ |

Snapshot date: **10 December 2011**. Only lines with a Customer ID were used, and customers with zero or negative net
spend were removed. Result: **5,832 customers**.

**Why RFM:** it is a simple, proven marketing method. Recent, frequent, high-spending customers are the most valuable.

### 9.3 Transforming the features

**What we did:** applied `log(1 + x)` to all three features, then **standardised** them (mean 0, standard deviation 1).
Both steps are saved in one pipeline with K-Means.

**Why:**
- Frequency and Monetary are **extremely skewed**: most customers spend a little, a few wholesalers spend enormous amounts
  (up to about £578,000). Without the log, K-Means would just separate those few giants from everyone else.
- K-Means measures **distance**. Without scaling, Monetary (thousands of £) would overpower Recency (days).
- The pipeline makes sure new customers are processed in exactly the same way.

### 9.4 Choosing the number of groups (K)

| K | Inertia | Silhouette |
|---|---|---|
| 2 | 8,545 | 0.439 |
| 3 | 6,333 | 0.347 |
| **4** | **4,930** | **0.365** |
| 5 | 4,110 | 0.341 |
| 6 | 3,566 | 0.333 |
| 7 | 3,196 | 0.302 |
| 8 | 2,906 | 0.303 |

**What we did:** chose **K = 4**.

**Why:**
- The **elbow** in inertia is around 4: after that, extra groups add little.
- K = 4 has the **best silhouette score among K >= 3**.
- K = 2 scores higher, but only splits "active" from "inactive", which is too simple to be useful.
- Four groups are easy for a business to understand and act on.

### 9.5 The four customer segments

| Segment | Customers | Last bought (median) | Orders (median) | Spend (median) | Share of revenue | What to do |
|---|---|---|---|---|---|---|
| **Champions** | 1,107 (19 %) | 15 days ago | 13 | £5,032 | **72 %** | Protect and reward them |
| **At-risk regulars** | 1,477 (25 %) | 158 days ago | 5 | £1,530 | 18 % | Win them back |
| **Recent low-spend** | 1,220 (21 %) | 23 days ago | 3 | £702 | 6 % | Help them grow |
| **Lapsed one-time buyers** | 2,028 (35 %) | 400 days ago | 1 | £281 | 4 % | Spend very little |

**How we named them:** a clear rule based on the medians (highest spend = Champions; of the rest, longest since last
purchase = Lapsed; of the last two, longer gap = At-risk, the other = Recent low-spend).

**Why it matters:** **Champions are only 19 % of customers but bring 72 % of the money.** Together with At-risk regulars,
44 % of customers bring 90 % of revenue. This tells marketing exactly where to focus.

### 9.6 Part 2: Predicting future spend

**What we did:**
- Built features from the **first 18 months** (Dec 2009 - Jun 2011): RFM, how long they have been a customer, average order value.
- Target: how much each customer spent in the **next 6 months** (Jun - Dec 2011), 0 if they did not return.
- Split customers 70 % train / 30 % test.
- Compared a simple **baseline** (past monthly spend x 6), Linear Regression, Random Forest and XGBoost.

**Why:**
- Using two separate time windows means the features never contain future information (no leakage).
- The baseline shows whether ML adds anything over a simple business rule.

| Model | Average error (MAE) | Ranking (Spearman) | Top-20 % capture |
|---|---|---|---|
| **XGBoost** | £752 | **0.640** | 78.2 % |
| Random Forest | **£705** | 0.625 | 77.2 % |
| Linear Regression | £943 | 0.607 | 75.7 % |
| Baseline | £732 | 0.597 | **78.6 %** |

**What this tells us:**
- Future spending is hard to predict: only **52 %** of customers came back in the next 6 months.
- XGBoost **ranks** customers best overall; Random Forest has the smallest £ error.
- But for picking the **top 20 %** of customers, the **simple baseline is just as good**. Past spending already explains most of it.
- This is short-term value (6 months), **not** full lifetime value.

### 9.7 Saved outputs

Cluster profiles, segment values, K evaluation, future-value metrics, customer segments, charts, and the trained pipeline
(`models/03_segmentation_pipeline.joblib`).

---

## 10. Step 5: Final comparison (Notebook 04)

### What we did

- Loaded all saved tables, predictions and models from notebooks 00-03. **No retraining.**
- Checked that every expected file exists (and stops with a clear message if one is missing).
- Showed the summary for each module and made demo predictions with the saved models.

### Why we did it

- A separate summary notebook makes the final presentation quick and avoids accidentally changing results.
- Loading saved models proves they can be **reused** without training again.
- **Important rule:** we never compare scores **between** modules. A £ error, a fraud precision and a silhouette score
  measure completely different things. Each model is only compared with its own baselines.

| Module | Selected approach | How it was tested | Main result | Main limitation |
|---|---|---|---|---|
| Revenue forecasting | Seasonal naive + daily XGBoost | Last 21 weeks + 3-period backtest | MAE £31,966 (14.4 %), R² 0.65; 5.2 % better than seasonal naive | Only one previous season |
| Anomaly detection | Isolation Forest, 5 % review | Unseen July-August customers with labels | ROC-AUC 0.64; precision 21.6 %, recall 23.5 %, lift 4.7x | Most flags are still innocent |
| Segmentation & value | RFM (log) + K-Means, K = 4 | Elbow, silhouette, profiles; 18 + 6-month split | Champions 19 % of customers, 72 % of revenue; Spearman 0.64 | Historical value is not lifetime value |

---

## 11. Step 6: The RetailMind website

### What we did

Built an interactive website, **RetailMind** (`website/index.html`), in cream, beige and brown colours with smooth animations.

| Section | What it shows |
|---|---|
| **Opening section** | Project title, illustration, animated revenue line, key numbers that count up |
| **00 Data** | The two datasets, cleaning steps, revenue by weekday |
| **A Forecasting** | Key results, actual vs predicted chart (switch each model on/off), error ranking, backtest, sortable metrics table, feature importance, weekly errors |
| **B Anomaly** | Key results, ROC and precision-recall curves, method comparison, score distribution, confusion matrix, review trade-off, most unusual purchases |
| **C Segmentation** | Key results, customer map, customers vs revenue, segment profile cards, choosing K, future-spend models |
| **Comparison** | Each selected model against its baselines, final summary table, honest limitations |
| **Notebook figures** | All 27 charts from the notebooks, with filters and click-to-enlarge |

**Every block** has a short "What it shows / Why it helps" note in simple words.

**Three live "playgrounds":**
1. **Forecast:** move a slider to change the mix of the two forecasts and see accuracy update instantly.
2. **Anomaly:** describe a purchase with sliders (or pick a preset) and the real trained Isolation Forest scores it on a gauge.
3. **Segmentation:** enter RFM values or a real customer ID and the real trained K-Means model assigns a segment.

### How the live models work in the browser

`website/build_data.py` reads the saved results and models and writes them into two JavaScript files:
- `data.js`: all results for the charts and tables.
- `models.js`: the 300 trained Isolation Forest trees, the scaler values and the K-Means centres.

The browser then runs the same maths as Python. We checked this: the browser scores match Python almost exactly
(difference less than 0.0000002), and all test customers get the same segment.

### Why we did it

- Notebooks are great for developers, but managers and examiners need a **clear, visual summary**.
- Interactive charts let people explore the results themselves.
- Live playgrounds show the models are **real and working**, not just numbers in a table.
- It runs in any browser without installing Python.

---

## 12. How the models work (simple theory)

### Seasonal naive (baseline)
Predicts this week's revenue as **the same week last year**. Simple, but strong when every year looks similar.

### Linear Regression
Draws the **best straight line** through the data: `prediction = b0 + b1*x1 + b2*x2 + ...`. It picks the weights that make
the squared errors as small as possible. Easy to explain but can only learn straight-line relationships.

### Decision Tree
Asks a chain of **yes/no questions**, like a flowchart ("Is it Christmas? Is it Saturday?"), and gives a prediction at the
end. One big tree tends to memorise the training data (overfitting), so we use groups of trees.

### Random Forest
Builds **hundreds of different trees** (each on a random sample of rows and features) and **averages** their answers.
Different trees make different mistakes, so the average is more reliable. This is called **bagging**.

### XGBoost (gradient boosting)
Builds trees **one after another**. Each new small tree tries to **fix the mistakes** of all the trees before it, and its
correction is added with a small step size (learning rate). After hundreds of trees the errors become small. It also
penalises overly complex trees. This is called **boosting**.
- **Random Forest:** trees built independently, then averaged.
- **XGBoost:** trees built in sequence, each correcting the last.

### Combination (ensemble)
Averages two different forecasts. When models make different errors, the average is better than either one alone.

### Isolation Forest
Based on the idea that **unusual points are few and different, so they are easy to separate**.
1. Build a tree by repeatedly choosing a **random feature** and a **random split value**.
2. A normal purchase sits in a crowd and needs **many splits** to be isolated.
3. An unusual purchase is far from the crowd and is isolated in **few splits**.
4. Repeat with 300 trees and average the number of splits.
5. **Fewer splits = higher anomaly score.**

The score is between 0 and 1: close to 1 means very unusual, around 0.5 or below means normal.

### Local Outlier Factor (LOF)
Compares how crowded a point's neighbourhood is with its neighbours' neighbourhoods. A point in a much emptier area than
its neighbours is an outlier.

### K-Means
Splits customers into K groups:
1. Place K centre points.
2. Assign every customer to the **nearest centre**.
3. Move each centre to the **average** of its customers.
4. Repeat until the centres stop moving.

We ran it 20 times with different starting points and kept the best result, because the start can change the outcome.

### StandardScaler
Changes each feature to `(value - average) / standard deviation`, so all features are on the same scale. Always learned
from training data only.

### Log transform
`log(1 + x)` shrinks very large values, so extreme customers or long times do not dominate the model.

---

## 13. How we measured success (metrics)

### For forecasting and future spend

| Metric | Simple meaning | Good when |
|---|---|---|
| **MAE** | Average size of the mistake, in £ | Low |
| **RMSE** | Like MAE but big mistakes count more | Low |
| **R²** | How much of the ups and downs the model explains (1 = perfect, 0 = no better than the average) | High |
| **MAPE** | Average mistake as a percentage | Low |
| **Spearman** | Does the model put customers in the right order? | High |
| **Top-20 % capture** | Share of future revenue from the customers the model ranked in the top 20 % | High |

### For anomaly detection

| Metric | Simple meaning |
|---|---|
| **Precision** | Of the purchases we flagged, how many were really fraud? |
| **Recall** | Of all the fraud, how much did we catch? |
| **Lift** | How many times better than checking purchases at random |
| **ROC-AUC** | Chance a random fraud scores higher than a random normal purchase (0.5 = guessing) |
| **PR-AUC** | Average precision across all thresholds; best for rare events like fraud |
| **Confusion matrix** | Counts of caught, missed, false alarms and correctly passed |

**Why not accuracy?** Only 4.6 % of test purchases are fraud. A model that says "never fraud" would be 95.4 % accurate
but completely useless.

### For clustering

| Metric | Simple meaning |
|---|---|
| **Inertia** | How tightly customers sit around their group centre (lower = tighter) |
| **Elbow method** | Choose K where adding more groups stops helping much |
| **Silhouette** | How well each customer fits its own group compared with the next group (-1 to 1, higher = better) |

---

## 14. Good practices we followed

| Practice | What we did | Why |
|---|---|---|
| **Real data** | Used two real public datasets | Results mean something in the real world |
| **Documented cleaning** | Every rule written down with row counts | Transparent and repeatable |
| **No data leakage** | Features use only past information; scalers fitted on training data | Results are realistic, not fake-good |
| **Time-based testing** | Test data always comes after training data | Matches how the model would be used |
| **Baselines** | Every model compared with simple rules | Proves ML actually adds value |
| **Robustness check** | 3-period backtest for forecasting | One lucky test period is not enough |
| **Right metrics** | Precision/recall/lift for rare fraud, not accuracy | Accuracy is misleading for rare events |
| **Fairness** | Did not use `sex` to flag customers | Avoids unfair treatment |
| **Honesty** | Reported where models did not help and disclosed late additions | Builds trust |
| **Reproducibility** | Fixed random seed (42), saved models, shared feature code | Same results every run |
| **Pipelines** | Preprocessing and model saved together | New data is handled exactly like training data |

---

## 15. Final results

| | Result |
|---|---|
| **Forecasting** | Weekly MAE **£31,966** (14.4 % error), R² **0.65**; **5.2 %** better than seasonal naive, **55 %** better than the mean |
| **Anomaly detection** | At a 5 % review rate: precision **21.6 %**, recall **23.5 %**, lift **4.7x**, ROC-AUC **0.64** on unseen customers |
| **Segmentation** | 4 clear segments; Champions are **19 %** of customers but **72 %** of revenue; silhouette **0.365** |
| **Future value** | XGBoost ranks future spend best (Spearman **0.64**); a simple baseline is equally good for top-20 % targeting |
| **Website** | All results, comparisons and three live model playgrounds in one place |

---

## 16. Limitations

| Module | Limitation |
|---|---|
| Forecasting | Only two years of data, so only one previous season to learn from. Forecasts lag behind growth. One-off wholesale orders cause big single-week misses. No promotion or marketing data. The combination was added after a first comparison. |
| Anomaly detection | About 78 % of flags are innocent. Fraud patterns change over time. Only first purchases are available. The dataset's origin is undocumented and may be partly simulated. |
| Segmentation | 22 % of lines have no Customer ID and are excluded. Wholesale and retail customers are mixed. Future value covers only 6 months, which includes the busy autumn season. |

---

## 17. Future improvements

| Module | Improvement |
|---|---|
| Forecasting | More years of history, a year-over-year growth adjustment, separate forecasts for UK and wholesale customers, promotion calendars |
| Anomaly detection | Payment and address verification data, device fingerprints, chargeback outcomes, regular retraining as fraud changes |
| Segmentation | Customer type (wholesale or retail), marketing contact history, more years of data for true lifetime value |
| Website | Connect to live shop data so forecasts and fraud scores update automatically |

---

## 18. How to run the project

```bash
# 1. Go to the project folder
cd ecommerce-ml-cie-v2

# 2. (Optional) create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

# 3. Install libraries
pip install -r requirements.txt

# 4. Run the notebooks in order: 00 -> 01 -> 02 -> 03 -> 04
cd notebooks
jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=1800 00_Data_Exploration_and_Preparation.ipynb 01_Revenue_Demand_Forecasting.ipynb 02_Transaction_Anomaly_Detection.ipynb 03_Customer_Segmentation_Value.ipynb 04_Final_Model_Comparison_and_Summary.ipynb
cd ..

# 5. Refresh the website data
python website/build_data.py

# 6. Open website/index.html in a browser
```

In VS Code you can also open each notebook, select the Python kernel and click **Run All**. The notebooks have already
been run, so their outputs are visible under each cell as soon as you open them. See `HOW_TO_RUN.md` for more detail and
common fixes.

---

## 19. Conclusion

We built **RetailMind**, a three-part machine-learning system for an online shop:

- **Forecasting** shows that ML helps once it has a full year of history, and that combining a seasonal rule with XGBoost
  gives the most accurate weekly revenue forecast.
- **Anomaly detection** shows that an unsupervised Isolation Forest can find fraud almost 5 times better than random
  checking on brand-new customers, without needing labels, and that labels from the past can mislead when fraud changes.
- **Segmentation** shows that a small group of Champions brings most of the revenue, giving marketing a clear focus, and
  that simple past spending is already a strong guide to future value.

Above all, every result was tested on unseen data, compared with simple baselines, and reported honestly, including
where machine learning did **not** help. That honesty is what makes the results trustworthy.
