# How to Start and Run the Project

A simple step-by-step guide. Follow the steps in order.

---

## What you need first

1. **Python 3.11 or newer** (this project was tested with Python 3.13).
   Check it by opening a terminal and typing:
   ```bash
   python --version
   ```
2. **VS Code** (recommended) with the **Python** and **Jupyter** extensions installed.
3. An **internet connection** (only needed to install the libraries and to load the website charts and fonts).

---

## Step 1: Open the project folder

Open a terminal (PowerShell or Command Prompt on Windows) and go to the project folder:

```bash
cd C:\Users\ombho\Desktop\mlcie2\ecommerce-ml-cie-v2
```

Or in VS Code: **File > Open Folder** and choose `ecommerce-ml-cie-v2`.

---

## Step 2: Create a virtual environment (optional but recommended)

A virtual environment keeps this project's libraries separate from other projects.

```bash
python -m venv .venv
```

Turn it on:

- **Windows:** `.venv\Scripts\activate`
- **macOS / Linux:** `source .venv/bin/activate`

You will see `(.venv)` at the start of the terminal line when it is on.

> If you skip this step, the libraries are installed into your main Python. That also works.

---

## Step 3: Install the libraries

```bash
pip install -r requirements.txt
```

This installs pandas, numpy, scikit-learn, xgboost, matplotlib, seaborn, statsmodels, scipy, joblib, openpyxl and jupyter.
It can take a few minutes.

---

## Step 4: Check the data files are there

These two files must exist inside `data/raw/`:

| File | Used by |
|---|---|
| `online_retail_II.xlsx` | Forecasting (Module A) and Segmentation (Module C) |
| `Fraud_Data.csv` | Anomaly detection (Module B) |

Never edit these files. The notebooks only read them.

---

## Step 5: Run the notebooks (in this exact order)

The notebooks are in the `notebooks/` folder. **Always run them in this order**, because each one uses files made by the one before it.

| Order | Notebook | What it does | Time |
|---|---|---|---|
| 1 | `00_Data_Exploration_and_Preparation.ipynb` | Explores both datasets, cleans Online Retail II, saves `data/processed/online_retail_clean.csv.gz` | about 1-2 min (reading Excel is slow) |
| 2 | `01_Revenue_Demand_Forecasting.ipynb` | Module A: forecasts weekly revenue | about 1 min |
| 3 | `02_Transaction_Anomaly_Detection.ipynb` | Module B: finds unusual / risky purchases | about 1-2 min |
| 4 | `03_Customer_Segmentation_Value.ipynb` | Module C: groups customers and predicts future spend | about 1 min |
| 5 | `04_Final_Model_Comparison_and_Summary.ipynb` | Loads the saved results and shows the final summary (no retraining) | a few seconds |

### Option A: Run in VS Code (easiest)

1. Open a notebook, for example `notebooks/00_Data_Exploration_and_Preparation.ipynb`.
2. At the top right, click **Select Kernel** and choose your Python (or `.venv`).
3. Click **Run All** at the top.
4. Wait until every cell has a green tick. The output appears under each cell.
5. Repeat for notebooks 01, 02, 03 and 04.

> The notebooks have already been run once, so when you open them you can already see all the outputs under each cell.
> You only need to run them again if you change something.

### Option B: Run everything from the terminal (one command)

```bash
cd notebooks
jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=1800 00_Data_Exploration_and_Preparation.ipynb 01_Revenue_Demand_Forecasting.ipynb 02_Transaction_Anomaly_Detection.ipynb 03_Customer_Segmentation_Value.ipynb 04_Final_Model_Comparison_and_Summary.ipynb
cd ..
```

This runs all five notebooks and saves the outputs inside them.

### Option C: Classic Jupyter in the browser

```bash
jupyter notebook
```

A browser tab opens. Go into `notebooks/`, open each notebook in order and use **Kernel > Restart & Run All**.

---

## Step 6: Check the outputs

After running, these folders are filled:

| Folder | What is inside |
|---|---|
| `outputs/figures/` | All charts as PNG images |
| `outputs/tables/` | Metric tables as CSV files |
| `outputs/predictions/` | Model predictions as CSV files |
| `models/` | The saved trained models (`.joblib` files) |

---

## Step 7: Open the website (dashboard)

The website shows all three models with charts, comparisons, metrics and live predictions.

1. **Update the website data** (only needed after re-running the notebooks):
   ```bash
   python website/build_data.py
   ```
   You should see a line like `data.js 360 kB | models.js 724 kB | figures 27`.
2. **Open the website:** double-click `website/index.html`, or right-click it in VS Code and choose **Reveal in File Explorer**, then open it in Chrome or Edge.

> Optional: to serve it like a real website, run `python -m http.server 8000 --directory website` and open http://localhost:8000 in your browser.

---

## Common problems and fixes

| Problem | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'xgboost'` (or another library) | Run `pip install -r requirements.txt` again with the same Python that the notebook kernel uses |
| `FileNotFoundError: online_retail_clean.csv.gz` | You skipped notebook 00. Run it first |
| Notebook 04 says a file is missing | Run notebooks 00 to 03 first |
| `numpy` fails to install on a very new Python | Use `pip install numpy pandas scikit-learn xgboost matplotlib seaborn statsmodels scipy joblib openpyxl jupyter` (without the fixed versions) |
| VS Code asks for a kernel | Click **Select Kernel** and pick the Python where you installed the libraries |
| Website charts are empty | Check your internet connection (the chart library loads online) and that `website/data.js` exists |
| Excel loading is slow | Normal. Reading `online_retail_II.xlsx` takes about a minute |

---

## Quick summary

```text
1. cd ecommerce-ml-cie-v2
2. pip install -r requirements.txt
3. Run notebooks 00 -> 01 -> 02 -> 03 -> 04
4. python website/build_data.py
5. Open website/index.html
```
