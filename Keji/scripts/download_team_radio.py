"""
Download team radio metadata for all races that have full-race telemetry.

Saves team_radio.json in each race's data folder:
  public/data/FastF1 Data/fastf1_YEAR_CIRCUIT_grand_prix/race/team_radio.json

Format: [{ "driver": "NOR", "time": 312.5, "url": "https://..." }, ...]
where "time" is race-relative seconds from lights out.

Audio files are NOT downloaded — they stream from the F1 CDN on demand.
"""

import json
import os
import ssl
import time
import urllib.request
from datetime import datetime, timezone

# macOS ships with outdated root certs; disable verification for this local script.
_NO_SSL = ssl.create_default_context()
_NO_SSL.check_hostname = False
_NO_SSL.verify_mode = ssl.CERT_NONE

BASE_URL     = "https://api.openf1.org/v1"
DATA_ROOT    = os.path.join(
    os.path.dirname(__file__),
    "../../alan app/public/data/FastF1 Data"
)

# (folder_name, session_subfolder, year, race_date, openf1_session_name)
# Only regular races (not sprints) — radio for sprints not worth the API calls.
RACES = [
    ("fastf1_2019_german_grand_prix",      "race", 2019, "2019-07-28", "Race"),
    ("fastf1_2020_bahrain_grand_prix",     "race", 2020, "2020-11-29", "Race"),
    ("fastf1_2021_abu_dhabi_grand_prix",   "race", 2021, "2021-12-12", "Race"),
    ("fastf1_2021_brazilian_grand_prix",   "race", 2021, "2021-11-14", "Race"),
    ("fastf1_2021_british_grand_prix",     "race", 2021, "2021-07-18", "Race"),
    ("fastf1_2021_italian_grand_prix",     "race", 2021, "2021-09-12", "Race"),
    ("fastf1_2022_belgian_grand_prix",     "race", 2022, "2022-08-28", "Race"),
    ("fastf1_2022_japanese_grand_prix",    "race", 2022, "2022-10-09", "Race"),
    ("fastf1_2023_las_vegas_grand_prix",   "race", 2023, "2023-11-18", "Race"),
    ("fastf1_2024_monaco_grand_prix",      "race", 2024, "2024-05-26", "Race"),
    ("fastf1_2025_austrian_grand_prix",    "race", 2025, "2025-06-29", "Race"),
    # 2026 season
    ("fastf1_2026_australia_grand_prix",   "race", 2026, "2026-03-08", "Race"),
    ("fastf1_2026_china_grand_prix",       "race", 2026, "2026-03-15", "Race"),
    ("fastf1_2026_japan_grand_prix",       "race", 2026, "2026-03-29", "Race"),
    ("fastf1_2026_miami_grand_prix",       "race", 2026, "2026-05-03", "Race"),
    ("fastf1_2026_canadian_grand_prix",    "race", 2026, "2026-05-24", "Race"),
    ("fastf1_2026_monaco_grand_prix",      "race", 2026, "2026-06-07", "Race"),
    ("fastf1_2026_barcelona_grand_prix",   "race", 2026, "2026-06-14", "Race"),
    ("fastf1_2026_austrian_grand_prix",    "race", 2026, "2026-06-28", "Race"),
    ("fastf1_2026_british_grand_prix",     "race", 2026, "2026-07-05", "Race"),
    ("fastf1_2026_belgian_grand_prix",     "race", 2026, "2026-07-19", "Race"),
    ("fastf1_2026_hungarian_grand_prix",   "race", 2026, "2026-07-26", "Race"),
]


def fetch_json(url: str, retries: int = 3) -> list | dict | None:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "f1vis-radio-downloader/1.0"})
            with urllib.request.urlopen(req, timeout=30, context=_NO_SSL) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 10 * (attempt + 1)
                print(f"    Rate limited, waiting {wait}s...")
                time.sleep(wait)
            elif e.code == 404:
                return None  # No data for this year/endpoint
            else:
                print(f"    WARN fetch failed: {url[:80]}  ({e})")
                return None
        except Exception as e:
            print(f"    WARN fetch failed: {url[:80]}  ({e})")
            return None
    print(f"    WARN gave up after {retries} retries: {url[:80]}")
    return None


# Cache sessions per year to avoid repeated API calls for same year
_sessions_cache: dict[str, list] = {}

def get_sessions_for_year(year: int) -> list:
    key = str(year)
    if key not in _sessions_cache:
        print(f"    Fetching session list for {year}...")
        data = fetch_json(f"{BASE_URL}/sessions?year={year}&session_name=Race")
        time.sleep(2)
        _sessions_cache[key] = data or []
    return _sessions_cache[key]


def fetch_radio_for_session(session_key: int) -> tuple[list, dict, list]:
    """Returns (laps_lap1, num_to_abbr, raw_radio)"""
    print(f"    Fetching laps/drivers/radio for session_key={session_key}...")

    laps = fetch_json(f"{BASE_URL}/laps?session_key={session_key}&lap_number=1") or []
    time.sleep(1.5)
    drivers = fetch_json(f"{BASE_URL}/drivers?session_key={session_key}") or []
    time.sleep(1.5)
    radio = fetch_json(f"{BASE_URL}/team_radio?session_key={session_key}") or []
    time.sleep(1.5)

    num_to_abbr = {}
    for d in drivers:
        if d.get("driver_number") and d.get("name_acronym"):
            num_to_abbr[d["driver_number"]] = d["name_acronym"]

    return laps, num_to_abbr, radio


def build_radio_calls(laps, num_to_abbr, raw_radio) -> list:
    # Lights-out = earliest lap 1 date_start
    lights_out_ms = None
    for lap in laps:
        ds = lap.get("date_start")
        if not ds:
            continue
        try:
            ts = datetime.fromisoformat(ds.replace("Z", "+00:00")).timestamp() * 1000
            if lights_out_ms is None or ts < lights_out_ms:
                lights_out_ms = ts
        except Exception:
            pass

    if lights_out_ms is None:
        print("    WARN: could not determine lights-out time")
        return []

    calls = []
    for r in raw_radio:
        url = r.get("recording_url")
        date = r.get("date")
        if not url or not date:
            continue
        abbr = num_to_abbr.get(r.get("driver_number"))
        if not abbr:
            continue
        try:
            ts_ms = datetime.fromisoformat(date.replace("Z", "+00:00")).timestamp() * 1000
        except Exception:
            continue
        rel_time = (ts_ms - lights_out_ms) / 1000.0
        if rel_time > 14400:
            continue
        calls.append({"driver": abbr, "time": round(rel_time, 2), "url": url})

    calls.sort(key=lambda c: c["time"])
    return calls


def find_session_key(year: int, race_date: str, session_name: str) -> int | None:
    sessions = get_sessions_for_year(year)
    if not sessions:
        return None

    target_ms = datetime.fromisoformat(race_date).replace(tzinfo=timezone.utc).timestamp() * 1000
    best = None
    best_diff = float("inf")
    for s in sessions:
        ds = s.get("date_start")
        if not ds:
            continue
        try:
            ts_ms = datetime.fromisoformat(ds.replace("Z", "+00:00")).timestamp() * 1000
        except Exception:
            continue
        diff = abs(ts_ms - target_ms)
        if diff < 3 * 86_400_000 and diff < best_diff:
            best_diff = diff
            best = s

    return best["session_key"] if best else None


def process_race(folder: str, session_sub: str, year: int, race_date: str, session_name: str):
    out_dir  = os.path.join(DATA_ROOT, folder, session_sub)
    out_path = os.path.join(out_dir, "team_radio.json")

    if not os.path.isdir(out_dir):
        print(f"  SKIP (no dir): {folder}/{session_sub}")
        return

    if os.path.exists(out_path):
        existing = json.loads(open(out_path).read())
        if len(existing) > 0:
            print(f"  SKIP (already done, {len(existing)} calls): {folder}")
            return
        # Empty file = previous run saved no data; re-check if OpenF1 now has it

    print(f"  Processing: {folder} [{year} {session_name}]")

    session_key = find_session_key(year, race_date, session_name)
    if not session_key:
        print(f"    WARN: no matching session found — saving empty []")
        with open(out_path, "w") as f:
            json.dump([], f)
        return

    laps, num_to_abbr, raw_radio = fetch_radio_for_session(session_key)
    calls = build_radio_calls(laps, num_to_abbr, raw_radio)

    with open(out_path, "w") as f:
        json.dump(calls, f, separators=(",", ":"))

    print(f"    Saved {len(calls)} radio calls → {out_path}")


def main():
    print(f"Data root: {os.path.abspath(DATA_ROOT)}")
    print(f"Processing {len(RACES)} races...\n")

    for folder, session_sub, year, race_date, session_name in RACES:
        try:
            process_race(folder, session_sub, year, race_date, session_name)
        except Exception as e:
            print(f"  ERROR {folder}: {e}")
        time.sleep(2)

    print("\nDone.")


if __name__ == "__main__":
    main()
