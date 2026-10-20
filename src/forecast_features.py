"""Forecasting feature builders shared by notebooks 01 (training) and 04 (demo forecasts).

Every feature for a given week (or for a day inside that week) uses only information that is
known by the end of the PREVIOUS week (Sunday), so a forecast can be made one week ahead
without looking at the future.
"""
import numpy as np
import pandas as pd

WEEKLY_FEATURES = ["lag_1", "lag_2", "lag_4", "rolling_mean_4", "month", "week_of_year", "holiday_week"]
DAILY_FEATURES = ["prev_week", "prev2_week", "rolling_mean_4_weeks", "same_weekday_last_week",
                  "day_of_week", "month", "day_of_year", "holiday_period"]


def is_holiday_period(dates):
    """True between 22 Dec and 4 Jan, when the shop closes or trades very little."""
    dates = pd.DatetimeIndex(dates)
    return ((dates.month == 12) & (dates.day >= 22)) | ((dates.month == 1) & (dates.day <= 4))


def weekly_features(weekly):
    """One row per week (index = week-ending Sunday). `weekly` must have a continuous weekly index."""
    features = pd.DataFrame({"revenue": weekly})
    for lag in (1, 2, 4):
        features[f"lag_{lag}"] = weekly.shift(lag)
    features["rolling_mean_4"] = weekly.shift(1).rolling(4).mean()
    features["month"] = features.index.month
    features["week_of_year"] = features.index.isocalendar().week.astype(int).values
    features["holiday_week"] = is_holiday_period(features.index - pd.Timedelta(days=3)).astype(int)  # Thursday of the week
    features["same_week_last_year"] = weekly.shift(52)  # used only by the seasonal-naive baseline
    return features


def daily_features(daily):
    """One row per calendar day. `daily` must have a continuous daily index."""
    weekly = daily.resample("W-SUN").sum()
    features = pd.DataFrame({"revenue": daily})
    features["week_ending"] = features.index + pd.to_timedelta(6 - features.index.dayofweek, unit="D")
    features["prev_week"] = features["week_ending"].map(weekly.shift(1))
    features["prev2_week"] = features["week_ending"].map(weekly.shift(2))
    features["rolling_mean_4_weeks"] = features["week_ending"].map(weekly.shift(1).rolling(4).mean())
    features["same_weekday_last_week"] = daily.shift(7)  # always falls in the previous week
    features["day_of_week"] = features.index.dayofweek
    features["month"] = features.index.month
    features["day_of_year"] = features.index.dayofyear
    features["holiday_period"] = is_holiday_period(features.index).astype(int)
    return features


def recursive_daily_forecast(model, daily_history, n_weeks):
    """Forecast `n_weeks` complete weeks after the end of `daily_history` (which must end on a Sunday).

    Each forecast week is built from features of the previous week; predicted days are appended to the
    history so the next week's features can be built. No actual future values are used.
    """
    history = daily_history.copy()
    weekly_forecasts = {}
    for _ in range(n_weeks):
        next_days = pd.date_range(history.index[-1] + pd.Timedelta(days=1), periods=7, freq="D")
        extended = pd.concat([history, pd.Series(np.nan, index=next_days)])
        rows = daily_features(extended).loc[next_days, DAILY_FEATURES]
        predictions = np.clip(model.predict(rows), 0, None)
        history = pd.concat([history, pd.Series(predictions, index=next_days)])
        weekly_forecasts[next_days[-1]] = predictions.sum()
    return pd.Series(weekly_forecasts, name="forecast")
