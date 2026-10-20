# E-commerce Machine Learning CIE Project --- Step-by-Step Build Guide

## 1. Project goal

Build three independent machine-learning modules from
`ecommerce_sales_34500.csv`, then create one final notebook that brings
the results together.

1.  **Module A --- Revenue & Demand Forecasting:** predict weekly
    revenue.
2.  **Module B --- Transaction Anomaly & Risk Detection:** flag unusual
    transactions for review.
3.  **Module C --- Customer Segmentation & Value:** group customers
    using RFM features and describe their historical value.

Keep the implementation understandable and suitable for a college CIE
project. Prefer clear code, visual explanations, and a small number of
well-tested models over unnecessary complexity.

> **Important:** An anomaly is not automatically fraud. The dataset does
> not contain a confirmed fraud label. Also, historical customer
> spending is not the same as true future Customer Lifetime Value (CLV).
> Do not claim to detect fraud or predict true CLV unless a valid target
> and evaluation method have been defined.

------------------------------------------------------------------------

## 2. Dataset

Input file: `ecommerce_sales_34500.csv`

The provided file has **34,500 rows and 17 columns**. Its columns are:

-   Identifiers: `order_id`, `customer_id`, `product_id`
-   Product/order information: `category`, `price`, `discount`,
    `quantity`, `payment_method`, `order_date`
-   Delivery and location: `delivery_time_days`, `region`
-   Outcome/financial fields: `returned`, `total_amount`,
    `shipping_cost`, `profit_margin`
-   Customer information: `customer_age`, `customer_gender`

Use the column names exactly as they appear in the CSV. Parse
`order_date` as a datetime column before using it.

### Questions to answer during data analysis

-   What dates does the dataset cover?
-   Are there missing values, duplicate rows, or duplicate order IDs?
-   What are the distributions of price, quantity, discount, total
    amount, delivery time, and profit margin?
-   Which categories and regions have the highest sales?
-   How does revenue change over time?
-   What proportion of transactions is marked as returned?
-   Are there extreme values that might be valid large orders rather
    than data errors?

Do not remove records merely because they look unusual. Investigate them
first.

------------------------------------------------------------------------

## 3. Recommended project folder structure

Create the following folder structure:

``` text
ecommerce-ml-cie/
├── data/
│   └── ecommerce_sales_34500.csv
├── notebooks/
│   ├── 00_Data_Exploration_and_Preparation.ipynb
│   ├── 01_Revenue_Demand_Forecasting.ipynb
│   ├── 02_Transaction_Anomaly_Detection.ipynb
│   ├── 03_Customer_Segmentation_Value.ipynb
│   └── 04_Final_Model_Comparison_and_Summary.ipynb
├── outputs/
│   ├── figures/
│   ├── tables/
│   └── predictions/
├── models/
├── requirements.txt
└── README.md
```

Keep the notebooks separate by module. The final notebook should load
saved result tables and predictions from the module notebooks wherever
possible instead of repeating all training code.

If model files are saved, use `joblib` and save only the models needed
for demonstration or later predictions. Do not commit large generated
files unnecessarily.

------------------------------------------------------------------------

## 4. Environment setup

Use Python with Jupyter Notebook or JupyterLab. Create a virtual
environment if you are comfortable doing so.

Install the required libraries:

``` bash
pip install pandas numpy matplotlib seaborn scikit-learn xgboost statsmodels joblib jupyter
```

If `xgboost` installation causes problems, first complete the notebooks
with scikit-learn models and add XGBoost later. Keep a
`requirements.txt` containing the libraries actually used.

Start Jupyter from the project folder:

``` bash
jupyter notebook
```

Use relative paths such as `../data/ecommerce_sales_34500.csv` from
notebooks stored in the `notebooks/` folder. Add a small file-loading
cell near the beginning of each notebook and check that it works from
the project root.

------------------------------------------------------------------------

## 5. Notebook documentation rules

Every notebook must be written as a teaching document, not just a
sequence of code cells.

For each major step, include:

1.  **Markdown explanation:** what this step does.
2.  **Why it is needed:** what problem it solves.
3.  **Code cell:** short, readable code with meaningful variable names.
4.  **Visualization or output:** where it helps explain the result.
5.  **Interpretation:** a Markdown cell immediately after the output
    explaining what the chart or metric tells us.
6.  **Decision:** state how the result affects the next step.

Use descriptive titles, readable chart labels, legends, units, and
`tight_layout()`. Avoid plotting every column without explaining why it
matters. Use consistent colors and formatting across notebooks.

Every notebook should run from top to bottom in a fresh kernel. Set
random seeds for models that use randomness. Do not use future
information when forecasting or evaluating models.

------------------------------------------------------------------------

# Notebook 00 --- Data Exploration and Preparation

**File:** `00_Data_Exploration_and_Preparation.ipynb`

This notebook introduces the dataset and documents data-quality
decisions. It should not train the three final models.

### Step 1 --- Import libraries and load the dataset

-   Import pandas, NumPy, Matplotlib, Seaborn, and any utilities needed.
-   Load the CSV.
-   Display the first five rows, shape, column names, data types, and
    `info()` output.
-   Convert `order_date` using `pd.to_datetime()`.

**Explain:** We need to understand the structure and types before
selecting features or training models.

### Step 2 --- Check data quality

-   Count missing values by column.
-   Count exact duplicate rows.
-   Check duplicate `order_id` values.
-   Check the range of dates.
-   Check unexpected values in `returned`, `discount`, `quantity`, and
    other important fields.

**Visualizations:** - Bar chart of missing-value counts. - Bar chart of
numerical columns' missing-value percentages if any are missing.

**Interpretation:** Explain whether the dataset is sufficiently complete
and what, if anything, needs cleaning. Do not invent missing values or
delete rows without a reason.

### Step 3 --- Explore numerical features

Use histograms and boxplots for selected columns such as:

-   `price`
-   `discount`
-   `quantity`
-   `total_amount`
-   `shipping_cost`
-   `profit_margin`
-   `delivery_time_days`

**Why:** Histograms show distribution and skew; boxplots help identify
unusual values. An outlier may be a legitimate transaction, so inspect
before changing it.

### Step 4 --- Explore categories and returns

-   Plot order counts by `category`, `payment_method`, `region`, and
    `returned`.
-   Plot total revenue by category and region.
-   Plot return rate by category, if the data supports a meaningful
    comparison.

**Interpretation:** Distinguish transaction count from revenue. A
category with many orders does not necessarily have the highest revenue.

### Step 5 --- Explore time patterns

-   Group `total_amount` by day or week.
-   Plot revenue over time.
-   Plot monthly revenue to look for broad seasonal patterns.
-   Make sure dates are sorted before plotting.

**Interpretation:** Discuss visible peaks, drops, trends, and possible
seasonality without assuming every change has a known cause.

### Step 6 --- Save reusable, prepared data if useful

Save a cleaned copy only if a documented cleaning operation was
required. Keep the original CSV unchanged. If a cleaned file is saved,
record the decisions made in Markdown.

### Deliverables

-   A clear overview of the dataset.
-   Important data-quality findings.
-   At least 5 useful, labeled visualizations with written
    interpretations.
-   A short conclusion listing which fields are suitable for each
    module.

------------------------------------------------------------------------

# Notebook 01 --- Revenue & Demand Forecasting

**File:** `01_Revenue_Demand_Forecasting.ipynb`

## Objective

Predict future weekly revenue using historical information. The main
candidate is **XGBoost Regressor**, compared with simpler baselines and
alternative regressors.

## Step 1 --- Define the target

-   Parse and sort `order_date`.
-   Aggregate `total_amount` by week to calculate weekly revenue.
-   Plot the weekly revenue series.

Explain that the target is **weekly total revenue**, not an individual
transaction's amount. Use a consistent weekly frequency and document how
incomplete first or last weeks are handled.

## Step 2 --- Create time-based features

Build features using only information available at the prediction time.
Possible features include:

-   Week number or month, if useful.
-   Previous week's revenue (`lag_1`).
-   Previous 2, 4, or 8 weeks' revenue, where enough history exists.
-   Rolling average of past revenue, shifted so the current target is
    not included.

Do not use the current week's revenue to predict that same week's
revenue. Do not randomly shuffle time-series rows.

## Step 3 --- Visualize the forecasting problem

Create:

1.  Weekly revenue line chart.
2.  Trend or rolling-average chart.
3.  Training-versus-test time split chart.
4.  Actual versus predicted revenue plot for each candidate.
5.  Residual/error plot for the selected model.

Explain what trend, variability, possible seasonality, and forecast
errors mean.

## Step 4 --- Split by time

Use an earlier portion of the timeline for training and the latest
portion for testing, for example the first 80% of weeks for training and
the final 20% for testing.

For a fair comparison, every model must use the same test period. Fit
preprocessing and models using training data only.

## Step 5 --- Train and compare models

Start with a simple, understandable selection:

-   **Baseline:** predict the previous week's revenue (or use a
    training-period mean baseline).
-   **Linear Regression:** simple reference model.
-   **Random Forest Regressor:** captures nonlinear patterns.
-   **XGBoost Regressor:** primary candidate.

ARIMA may be tested as an optional extension if it can be implemented
and evaluated consistently. Do not add it merely to increase the number
of models.

## Step 6 --- Evaluate

Report:

-   **MAE:** average absolute prediction error, in revenue units.
-   **RMSE:** penalizes larger errors more heavily.
-   **R²:** optional supporting metric; it can be negative on a test
    set.

Use a comparison table and a bar chart for MAE and RMSE. Lower MAE/RMSE
is better. Do not select a model using training score alone.

## Step 7 --- Select and save the model

-   Select the model with the best test performance, considering whether
    its predictions are reasonable and stable.
-   Plot actual versus predicted weekly revenue.
-   Plot residuals to see whether errors are systematically high or low.
-   Save the selected model and a CSV of test dates, actual revenue, and
    predictions to `outputs/predictions/`.
-   Save a metrics table to `outputs/tables/`.

### Deliverables

-   Model comparison table.
-   Actual-versus-predicted graph.
-   Error/residual graph.
-   Selected model, reasons for selection, and a short limitations
    section.

**Important:** A small dataset of weekly observations limits the
complexity of forecasting. Use a time-based split and describe results
as an experiment, not a guarantee of future business performance.

------------------------------------------------------------------------

# Notebook 02 --- Transaction Anomaly & Risk Detection

**File:** `02_Transaction_Anomaly_Detection.ipynb`

## Objective

Flag transactions whose patterns differ from most transactions. The
primary model is **Isolation Forest**.

**Important:** There is no confirmed fraud label in the supplied
dataset. The model detects unusual records, not proven fraud. Use terms
such as "anomaly," "unusual transaction," and "requires review."

## Step 1 --- Choose useful transaction features

Begin with numerical fields that describe transaction behavior, for
example:

-   `price`
-   `discount`
-   `quantity`
-   `total_amount`
-   `shipping_cost`
-   `profit_margin`
-   `delivery_time_days`

Include category, payment method, and region only if they add value.
Encode categorical fields appropriately. Do not feed raw IDs such as
`order_id` or `product_id` directly into the model as if their numerical
identity represented risk.

Consider whether `total_amount` is derived from price, discount, and
quantity. Correlated or duplicated information is not automatically
wrong, but explain the selected feature set.

## Step 2 --- Prepare the data

-   Handle missing values if any are discovered.
-   Scale numeric features for algorithms that are sensitive to feature
    scale.
-   Encode categorical features if used.
-   Keep a record of the transformation steps so future predictions use
    the same preparation.
-   Do not use `returned` as a training target for Isolation Forest.

Use a pipeline where practical so preprocessing is applied consistently.

## Step 3 --- Visualize normal transaction behavior

Create:

1.  Histograms of important numeric features.
2.  Boxplots for amount, discount, profit margin, and delivery time.
3.  Scatter plot of `total_amount` against `profit_margin`, with
    detected anomalies highlighted.
4.  Scatter plot of `total_amount` against `shipping_cost`, with
    detected anomalies highlighted.

Explain that unusual points can arise from legitimate large purchases,
discounts, or costly deliveries. Visual separation is useful for
investigation but does not prove wrongdoing.

## Step 4 --- Train and compare approaches

Use a small set of candidates:

-   **Isolation Forest:** primary model.
-   **Local Outlier Factor (LOF):** optional comparison for
    local-density anomalies.
-   **Simple rule-based flags:** a transparent reference, such as
    extreme values identified using documented quantile or IQR
    thresholds.

Keep rule-based flags separate from model predictions. If comparing LOF,
ensure its prediction settings are appropriate for the dataset and avoid
using it in a way that silently changes the evaluation population.

## Step 5 --- Decide how many anomalies to flag

-   Start with a documented contamination rate, such as 2% or 5%, as an
    experimental setting.
-   Compare a small number of settings and show how the number of
    flagged transactions changes.
-   Do not claim the chosen rate is the true fraud rate.
-   Store a prediction column such as `is_anomaly` and, where available,
    an anomaly score.

## Step 6 --- Review detected anomalies

Create:

-   A bar chart of normal versus flagged transactions.
-   A scatter plot with flagged transactions highlighted.
-   A table of the top unusual transactions, including useful business
    fields.
-   A comparison of return rates for flagged and non-flagged
    transactions, if `returned` is available and has valid values.

Treat the return-rate comparison as **descriptive analysis only**, not
as proof that anomalies are fraudulent. It is acceptable for the flagged
group to have no higher return rate; that is still a valid finding.

## Step 7 --- Compare and save results

Because there is no ground-truth anomaly label, do not report ordinary
classification accuracy, precision, or recall as if fraud labels
existed.

Compare models using: - Number and percentage of records flagged. -
Overlap between methods. - Whether flagged records have understandable,
unusual feature values. - Optional return-rate comparison as a
descriptive check.

Save the selected anomaly predictions and comparison summary to
`outputs/predictions/` and `outputs/tables/`.

### Deliverables

-   Anomaly detection comparison.
-   Visualizations with flagged points highlighted.
-   A review table of unusual transactions.
-   A clear explanation of why the flagged records need review and why
    they cannot automatically be called fraud.

------------------------------------------------------------------------

# Notebook 03 --- Customer Segmentation & Value

**File:** `03_Customer_Segmentation_Value.ipynb`

## Objective

Group customers by purchase behavior using **RFM features and K-Means**.
Describe the resulting groups in business terms, such as high historical
spend, frequent buyers, recent buyers, or inactive customers.

## Step 1 --- Create one row per customer

Aggregate the transaction dataset by `customer_id`. Calculate:

-   **Recency:** days since the customer's most recent purchase,
    measured relative to a clearly defined snapshot date.
-   **Frequency:** number of purchases. If each row is one order, use
    distinct `order_id` counts rather than assuming every row is a
    unique order.
-   **Monetary:** sum of `total_amount` for the customer over the chosen
    historical period.

Explain that RFM turns many transactions into a compact customer-level
table.

## Step 2 --- Inspect RFM distributions

Create histograms or boxplots for Recency, Frequency, and Monetary.

Explain skew: a small number of customers may spend much more than the
majority. Consider a documented log transformation for highly skewed
positive Frequency/Monetary values, and scale features before K-Means.
Ensure transformed values are valid and the same transformation is used
throughout.

## Step 3 --- Choose a reasonable number of clusters

-   Try a small range of K values, for example 2 through 8.
-   Plot the elbow/inertia curve.
-   Plot silhouette score by K where the calculation is feasible.
-   Choose a cluster count by considering the metrics and whether the
    groups are interpretable.

Explain that the elbow curve shows diminishing returns from adding
clusters. Silhouette score estimates how well-separated clusters are,
but neither metric alone guarantees commercially useful segments.

## Step 4 --- Train K-Means

-   Fit K-Means on scaled RFM features.
-   Use a fixed random seed and multiple initializations.
-   Add each customer's cluster label to the customer-level table.
-   Do not use customer IDs as clustering features.

## Step 5 --- Visualize and interpret clusters

Create:

1.  Bar chart showing the number of customers in each cluster.
2.  Cluster profile table showing median/mean Recency, Frequency, and
    Monetary.
3.  Scatter plot of Frequency versus Monetary, colored by cluster.
4.  Optional Recency-versus-Monetary plot.
5.  Bar chart of total historical revenue by cluster.

Write a plain-language interpretation for each cluster using its
measured profile. For example, only call a group "high-value customers"
if its spending statistics support that description.

Cluster numbers have no inherent ranking. Cluster 0 is not automatically
better than Cluster 1.

## Step 6 --- Customer value and CLV limitations

The dataset supports **historical customer value** using observed
purchases. It does not provide a confirmed future lifetime-value target.

For this CIE project: - Report total and average historical monetary
value by segment. - Clearly label it as historical value, not true
CLV. - Treat future CLV regression as an optional extension only if a
valid future-period spending target can be built using a time-based
split. Customer features must be computed before the future target
window, and the future window must not leak into the features.

Do not use a customer's full-history monetary value to predict that same
customer's spending during a period already included in that history.

## Step 7 --- Save outputs

Save: - Customer-level RFM table with cluster labels. - Cluster profile
and evaluation tables. - Selected clustering model and preprocessing
steps if future assignment of customers is required. - Charts in
`outputs/figures/`.

### Deliverables

-   Elbow and silhouette plots.
-   Customer segment visualization.
-   Cluster profile table and business interpretation.
-   A limitations note covering snapshot date, observation window, and
    the distinction between historical value and CLV.

------------------------------------------------------------------------

# Notebook 04 --- Final Model Comparison & Summary

**File:** `04_Final_Model_Comparison_and_Summary.ipynb`

This is the final presentation notebook. It should summarize all three
modules without repeating every training step.

## Step 1 --- Load saved results

Load the metrics, predictions, cluster profiles, and anomaly summaries
saved by the previous notebooks. If a file is missing, clearly identify
the missing output rather than inventing a score.

## Step 2 --- Present the project overview

Include: - Dataset size and date range. - The three business problems. -
The selected model for each module. - A short explanation of why each
model was selected.

## Step 3 --- Compare forecasting models

-   Display the MAE/RMSE comparison table.
-   Plot MAE and RMSE by model.
-   Plot actual versus predicted weekly revenue for the selected model.
-   Explain the final choice and its test-set errors.

Do not compare forecasting scores directly with anomaly detection or
clustering scores; they measure different tasks.

## Step 4 --- Summarize anomaly detection

-   Show the number and percentage of flagged transactions for each
    approach.
-   Visualize overlap or agreement where helpful.
-   Display selected unusual transactions.
-   Show the return-rate comparison only as descriptive context.
-   Explain why no model can be called a fraud detector using this
    dataset alone.

## Step 5 --- Summarize customer segmentation

-   Display the chosen number of clusters.
-   Show cluster sizes and RFM profile table.
-   Include a cluster scatter plot and historical revenue by cluster.
-   Describe each segment using evidence from its profile.

## Step 6 --- Add a prediction/demo section

Include simple, clearly labeled demonstrations:

-   **Forecasting:** show the selected model's predictions for the
    held-out test weeks. If generating a new future forecast, explain
    that lag and rolling features must be generated correctly and
    recursively where necessary.
-   **Anomaly detection:** show example transactions and their anomaly
    flags/scores using the same preprocessing as training.
-   **Customer segmentation:** show customers with their cluster labels
    and profile summaries.

Do not enter arbitrary example values that bypass the model's
preprocessing. For a genuine new prediction, reuse the saved pipeline
and its expected input columns.

## Step 7 --- Final model summary table

Include a table with columns such as:

  ------------------------------------------------------------------------------
  Module         Selected       Evaluation method  Main result    Limitation
                 approach                                         
  -------------- -------------- ------------------ -------------- --------------
  Revenue        Best measured  Time-based test    Fill from      Limited
  forecasting    regressor      MAE/RMSE           notebook       time-series
                                                   results        history

  Anomaly        Best reviewed  Flag rate,         Fill from      No confirmed
  detection      approach       overlap,           notebook       fraud labels
                                interpretability   results        

  Customer       RFM + selected Silhouette,        Fill from      Historical
  segmentation   K-Means        cluster profiles   notebook       value is not
                                                   results        true CLV
  ------------------------------------------------------------------------------

Populate this table with actual results from your executed notebooks.
Never hard-code example or fabricated metrics.

## Step 8 --- Final conclusion

Answer these questions: 1. Which forecasting model performed best on the
held-out time period, and by how much? 2. What kinds of transactions
were flagged as unusual? 3. What customer segments were identified? 4.
How could the results help an e-commerce business? 5. What are the
limitations and what data would improve the models?

End with a short conclusion that separates measured findings from
assumptions.

------------------------------------------------------------------------

## 6. Common rules for all notebooks

### Prevent data leakage

-   Forecasting: split by date; never shuffle the time series randomly.
-   Anomaly detection: do not use `returned` as a fraud label. It may be
    used only for clearly labeled descriptive analysis.
-   Segmentation: compute customer features from the defined historical
    window. Do not include future information.
-   Fit scaling, encoding, imputation, and model parameters on training
    data where applicable, then apply them to test data.

### Keep the project simple

-   Use a few meaningful models per module, not every algorithm
    available.
-   Start with a baseline.
-   Explain each metric in plain language.
-   Use readable functions only where they reduce repeated code.
-   Do not build a web app unless it is specifically required by the
    CIE.
-   Do not fabricate results, logs, labels, or model performance.
-   If a model fails, document the issue and fix it rather than hiding
    the failure.

### Recommended visualizations

Every chart should have a title, labeled axes, and a short
interpretation below it. Prioritize: - Revenue over time and
actual-versus-predicted plots. - Model comparison charts. -
Residual/error plots. - Anomaly scatter plots with flagged points
highlighted. - RFM distributions, elbow/silhouette plots, and customer
cluster profiles.

### Reproducibility checklist

-   [ ] Original CSV remains unchanged.
-   [ ] All notebooks run top-to-bottom in order.
-   [ ] Random seeds are fixed where applicable.
-   [ ] Data splits and target definitions are documented.
-   [ ] No test/future information leaks into training features.
-   [ ] All reported metrics come from executed code.
-   [ ] Charts have explanations and readable labels.
-   [ ] Predictions and summary tables are saved to the documented
    paths.
-   [ ] Final notebook loads actual outputs from the module notebooks.
-   [ ] Limitations are stated honestly.

## 7. Final expected submission

The completed project should contain:

1.  Four analysis/model notebooks plus one final summary notebook.
2.  The original dataset in `data/`.
3.  Model comparison tables and prediction CSVs.
4.  Saved charts used in the report or presentation.
5.  Saved selected model pipelines where useful.
6.  A `README.md` explaining setup, notebook execution order, and key
    findings.
7.  This build guide as the project's implementation plan.

**Execution order:** `00_Data_Exploration_and_Preparation.ipynb` →
`01_Revenue_Demand_Forecasting.ipynb` →
`02_Transaction_Anomaly_Detection.ipynb` →
`03_Customer_Segmentation_Value.ipynb` →
`04_Final_Model_Comparison_and_Summary.ipynb`.
