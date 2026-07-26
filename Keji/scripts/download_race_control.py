"""
Download race control messages for all races using FastF1.

Saves race_control_messages.json in each race's data folder:
  public/data/FastF1 Data/fastf1_YEAR_CIRCUIT/race/race_control_messages.json

Format:
  [{ "t": 125.3, "category": "Flag", "flag": "YELLOW", "scope": "Sector",
     "sector": 3, "status": null, "msg": "YELLOW IN TRACK SECTOR 3" }, ...]

  "t" is race-relative seconds from lights out (lap 1 start).
  Negative t = pre-race (formation lap etc.).

Skips: blue flags for drivers, track limits, steward investigation text.
Only keeps: Flag and SafetyCar categories.
"""

import fastf1
import json
import os
import math
import time
import pandas as pd

CACHE_DIR = "/tmp/fastf1_cache"
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

DATA_ROOT = os.path.join(
    os.path.dirname(__file__),
    "../../alan app/public/data/FastF1 Data"
)

# (folder, year, fastf1_gp_name)
RACES = [
    ("fastf1_2019_german_grand_prix",    2019, "German Grand Prix"),
    ("fastf1_2020_bahrain_grand_prix",   2020, "Bahrain Grand Prix"),
    ("fastf1_2021_abu_dhabi_grand_prix", 2021, "Abu Dhabi Grand Prix"),
    ("fastf1_2021_brazilian_grand_prix", 2021, "Brazilian Grand Prix"),
    ("fastf1_2021_british_grand_prix",   2021, "British Grand Prix"),
    ("fastf1_2021_italian_grand_prix",   2021, "Italian Grand Prix"),
    ("fastf1_2022_belgian_grand_prix",   2022, "Belgian Grand Prix"),
    ("fastf1_2022_japanese_grand_prix",  2022, "Japanese Grand Prix"),
    ("fastf1_2023_las_vegas_grand_prix", 2023, "Las Vegas Grand Prix"),
    ("fastf1_2024_monaco_grand_prix",    2024, "Monaco Grand Prix"),
    ("fastf1_2025_austrian_grand_prix",  2025, "Austrian Grand Prix"),
    ("fastf1_2026_australia_grand_prix", 2026, "Australian Grand Prix"),
    ("fastf1_2026_china_grand_prix",     2026, "Chinese Grand Prix"),
    ("fastf1_2026_japan_grand_prix",     2026, "Japanese Grand Prix"),
    ("fastf1_2026_miami_grand_prix",     2026, "Miami Grand Prix"),
    ("fastf1_2026_canadian_grand_prix",  2026, "Canadian Grand Prix"),
    ("fastf1_2026_monaco_grand_prix",    2026, "Monaco Grand Prix"),
    ("fastf1_2026_barcelona_grand_prix", 2026, "Barcelona Grand Prix"),
    ("fastf1_2026_austrian_grand_prix",  2026, "Austrian Grand Prix"),
    ("fastf1_2026_british_grand_prix",   2026, "British Grand Prix"),
    ("fastf1_2026_belgian_grand_prix",   2026, "Belgian Grand Prix"),
]


def process_race(folder: str, year: int, gp_name: str):
    out_dir  = os.path.join(DATA_ROOT, folder, "race")
    out_path = os.path.join(out_dir, "race_control_messages.json")

    if not os.path.isdir(out_dir):
        print(f"  SKIP (no dir): {folder}/race")
        return

    if os.path.exists(out_path):
        existing = json.loads(open(out_path).read())
        print(f"  SKIP (already done, {len(existing)} msgs): {folder}")
        return

    print(f"  Fetching: {year} {gp_name} ...")
    try:
        session = fastf1.get_session(year, gp_name, 'R')
        session.load(telemetry=False, laps=True, weather=False, messages=True)
    except Exception as e:
        print(f"    ERROR loading session: {e}")
        return

    # Determine lights-out time from lap 1 start
    try:
        lap1 = session.laps[session.laps['LapNumber'] == 1]
        if lap1.empty:
            print("    WARN: no lap 1 data — using session.date as lights-out")
            lights_out = session.date
        else:
            lights_out = lap1['LapStartDate'].min()
            if pd.isna(lights_out):
                lights_out = session.date
    except Exception as e:
        print(f"    WARN: could not get lap 1 time ({e}), using session.date")
        lights_out = session.date

    rcm = session.race_control_messages
    if rcm is None or len(rcm) == 0:
        print(f"    No messages — saving empty []")
        with open(out_path, "w") as f:
            json.dump([], f)
        return

    entries = []
    for _, row in rcm.iterrows():
        category = str(row['Category']) if pd.notna(row['Category']) else None
        if category not in ('Flag', 'SafetyCar'):
            continue

        flag   = str(row['Flag'])   if pd.notna(row['Flag'])   else None
        scope  = str(row['Scope'])  if pd.notna(row['Scope'])  else None
        sector = int(row['Sector']) if pd.notna(row['Sector']) else None
        status = str(row['Status']) if pd.notna(row['Status']) else None
        msg    = str(row['Message'])

        # Skip per-driver blue flags (too noisy, not interesting for track vis)
        if flag == 'BLUE' and scope == 'Driver':
            continue

        # Compute race-relative time in seconds
        try:
            t_secs = (row['Time'] - lights_out).total_seconds()
        except Exception:
            t_secs = (row['Time'].to_pydatetime() - lights_out.to_pydatetime()).total_seconds()

        # Skip anything more than 10 minutes before lights out (pit open etc.)
        if t_secs < -600:
            continue

        entries.append({
            "t":        round(t_secs, 1),
            "category": category,
            "flag":     flag,
            "scope":    scope,
            "sector":   sector,
            "status":   status,
            "msg":      msg,
        })

    entries.sort(key=lambda e: e["t"])

    with open(out_path, "w") as f:
        json.dump(entries, f, separators=(",", ":"))

    print(f"    Saved {len(entries)} messages → {out_path}")


def main():
    print(f"Data root: {os.path.abspath(DATA_ROOT)}")
    print(f"Processing {len(RACES)} races...\n")

    for folder, year, gp_name in RACES:
        try:
            process_race(folder, year, gp_name)
        except Exception as e:
            print(f"  ERROR {folder}: {e}")
        time.sleep(1)

    print("\nDone.")


if __name__ == "__main__":
    main()
