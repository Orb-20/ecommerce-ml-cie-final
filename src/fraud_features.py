"""Transaction features for Module B, shared by notebooks 02 (training) and 04 (demo scoring).

Device and IP features use only purchases that happened EARLIER than the transaction being scored,
so a transaction's features never depend on the future.
"""
import numpy as np
import pandas as pd

ANOMALY_FEATURES = ["log_seconds_to_purchase", "purchase_value", "age", "prior_purchases_same_device",
                    "prior_purchases_same_ip", "purchase_hour", "log_seconds_since_device_last_used"]

NEVER_USED_SECONDS = 1e8  # ~3 years: placeholder for "device not seen before"


def add_fraud_features(purchases):
    """Return a copy sorted by purchase_time with the engineered feature columns added."""
    df = purchases.sort_values("purchase_time").reset_index(drop=True).copy()
    seconds_to_purchase = (df["purchase_time"] - df["signup_time"]).dt.total_seconds()
    df["log_seconds_to_purchase"] = np.log10(seconds_to_purchase + 1)
    df["prior_purchases_same_device"] = df.groupby("device_id").cumcount()
    df["prior_purchases_same_ip"] = df.groupby("ip_address").cumcount()
    df["purchase_hour"] = df["purchase_time"].dt.hour
    gap = df.groupby("device_id")["purchase_time"].diff().dt.total_seconds().fillna(NEVER_USED_SECONDS)
    df["log_seconds_since_device_last_used"] = np.log10(gap + 1)
    return df
