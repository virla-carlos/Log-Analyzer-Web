from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = (
    BASE_DIR
    / "data"
    / "sample"
    / "BGL_2k_custom_structured.csv"
)

bgl = pd.read_csv(DATA_PATH)  


def normal_events():

    noAlert = bgl.loc[
        bgl["Label"] == "-",
        ["Label", "EventId", "EventTemplate", "Level"]
    ].copy()

    eventIdNoAlert = noAlert["EventId"].value_counts()
    print(eventIdNoAlert)

def alert_events():
    alert = bgl.loc[
        (bgl["Label"] != "-"),
        [
            "EventId", 
            "Level", 
            "EventTemplate"
        ]
    ]

    alert = (
        alert.groupby([
            "EventId",
            "Level",
            "EventTemplate",
        ])
        .size()
        .reset_index(name="Occurrences")
    )
    
    return alert

def calc_limit(alert_data):

    q50 = alert_data["Occurrences"].quantile(0.50)
    q75 = alert_data["Occurrences"].quantile(0.75)
    
    return q50, q75

def apply_priority(alert_data, q50, q75):
    alert_data["Priority"] = alert_data["Occurrences"].apply(
        lambda occurrence: define_priority(occurrence, q50, q75)
    )

    return alert_data

def define_priority(occurrences, q50, q75):

    if occurrences <= q50:
        return "RISCO BAIXO"
    elif occurrences  <= q75:
        return "RISCO MÉDIO"
    else:
        return "RISCO ALTO"

def generate_analysis():
    alert_data = alert_events()

    q50, q75 = calc_limit(alert_data)

    alert_data = apply_priority(
        alert_data,
        q50,
        q75
    )

    alert_data = alert_data.sort_values(
        by="Occurrences",
        ascending=False
    ).reset_index(drop=True)

    return alert_data

if __name__ == "__main__":
    print(generate_analysis())