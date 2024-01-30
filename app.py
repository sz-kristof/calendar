from flask import Flask, jsonify, request, render_template
from datetime import datetime, timedelta
import requests

app = Flask(__name__)

@app.route('/api/pandascore/tournaments/upcoming', methods=['GET'])
def pandascore_proxy():
    pandascore_api_key = '4VOCS4jpPdKfU0gDukE2ritKiYnhHtZgJAdJKdUKyii-FfPBOU8'
    headers = {"accept": "application/json"}

    all_matches = []
    for page in range(1, 10):  # Pages 1 through 5
        matches_url = f"https://api.pandascore.co/lol/matches/upcoming/?sort=&page={page}&per_page=100&token={pandascore_api_key}"
        response = requests.get(matches_url, headers=headers)
        matches = response.json()
        all_matches.extend(matches)  # Add matches from this page to the list

    return jsonify(all_matches)


@app.route('/api/ongoing-events', methods=['GET'])
def get_ongoing_events():
    headers = {
        'Authorization': '4VOCS4jpPdKfU0gDukE2ritKiYnhHtZgJAdJKdUKyii-FfPBOU8'
    }

    response = requests.get(
        'https://api.pandascore.co/lol/matches/running',
        headers=headers
    )

    data = response.json()
    #print(data)  # Print the data to the console for debugging
    return jsonify(data)

@app.route('/api/leagues', methods=['GET'])
def get_leagues():
    headers = {
        'Authorization': '4VOCS4jpPdKfU0gDukE2ritKiYnhHtZgJAdJKdUKyii-FfPBOU8'
    }
    all_leagues = []
    page = 1
    per_page = 100  # Vagy egy másik érték, ami megfelelő

    while True:
        response = requests.get(
            f'https://api.pandascore.co/lol/leagues?page={page}&per_page={per_page}',
            headers=headers
        )
        leagues = response.json()
        if not leagues:
            break  # Ha nincs több liga, kilép a ciklusból
        all_leagues.extend(leagues)
        page += 1  # Következő oldal

    return jsonify(all_leagues)



@app.route('/')
def index():
    return render_template('index.html')
@app.route('/forums')
def forums():
    return render_template('forums.html')

if __name__ == '__main__':
    app.run(debug=True)

