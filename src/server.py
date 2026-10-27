import json

from flask import Flask, jsonify
from src.main import bgl, generate_analysis, calc_limit

# static_url_path="" faz a pasta "static" ser servida a partir da raiz do site
app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "http://127.0.0.1:5500"
    return response

def alert_insights():
    """Agrupamentos extras sobre os registros de alerta (colunas Date e Component)."""
    alerts = bgl[bgl["Label"] != "-"]

    by_date = (
        alerts
        .groupby("Date")
        .size()
        .sort_index()
    )

    by_component = (
        alerts
        .groupby("Component")
        .size()
        .sort_values(ascending=False)
    )

    return {
        "by_date": [
            {
                "label": str(date),
                "value": int(value)
            }
            for date, value in by_date.items()
        ],

        "by_component": [
            {
                "label": str(component),
                "value": int(value)
            }
            for component, value in by_component.items()
        ]
    }

@app.route("/api/analysis")
def analysis():
    ranking = generate_analysis()

    q50, q75 = calc_limit(ranking)

    return jsonify({
        "q50": float(q50),
        "q75": float(q75),

        "total_alerts": int(
            ranking["Occurrences"].sum()
        ),
        
        "insights": alert_insights(),

        "rows": json.loads(
            ranking.to_json(
                orient="records"
            )
        ),
    })


if __name__ == "__main__":
    print(app.url_map)
    app.run(debug=True)