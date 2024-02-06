from flask import Flask, jsonify, request, render_template
from datetime import datetime, timedelta
import requests
from flask_caching import Cache
from flask_mail import Mail, Message

app = Flask(__name__)
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

# Configuration for Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = 'True'
app.config['MAIL_USE_SSL'] = 'False'
app.config['MAIL_USERNAME'] = 'chrispacso5@gmail.com'
app.config['MAIL_PASSWORD'] = 'hihi'

@app.route('/api/pandascore/tournaments/upcoming', methods=['GET'])
@cache.cached(timeout=50, query_string=True)  # Cache this view for 50 seconds
def get_upcoming_lol_matches():
    pandascore_api_key = '4VOCS4jpPdKfU0gDukE2ritKiYnhHtZgJAdJKdUKyii-FfPBOU8'
    headers = {"accept": "application/json"}

    all_matches = []
    for page in range(1, 10):  # Pages 1 through 5
        matches_url = f"https://api.pandascore.co/lol/matches/upcoming/?sort=&page={page}&per_page=100&token={pandascore_api_key}"
        response = requests.get(matches_url, headers=headers)
        matches = response.json()
        all_matches.extend(matches)  # Add matches from this page to the list

    return jsonify(all_matches)

@app.route('/api/pandascore/tournaments/past', methods=['GET'])
@cache.cached(timeout=50, query_string=True)  # Cache this view for 50 seconds
def get_past_lol_matches():
    pandascore_api_key = '4VOCS4jpPdKfU0gDukE2ritKiYnhHtZgJAdJKdUKyii-FfPBOU8'
    headers = {"accept": "application/json"}

    all_matches = []
    for page in range(1, 10):  # Pages 1 through 5
        matches_url = f"https://api.pandascore.co/lol/matches/past/?sort=&page={page}&per_page=100&token={pandascore_api_key}"
        response = requests.get(matches_url, headers=headers)
        matches = response.json()
        all_matches.extend(matches)  # Add matches from this page to the list

    return jsonify(all_matches)

@app.route('/api/ongoing-events', methods=['GET'])
def get_ongoing_lol_matches():
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


@app.route('/api/teams/<int:team_id>', methods=['GET'])
def get_team_details(team_id):
    headers = {
        'Authorization': '4VOCS4jpPdKfU0gDukE2ritKiYnhHtZgJAdJKdUKyii-FfPBOU8'
    }
    try:
        response = requests.get(
            f'https://api.pandascore.co/teams/{team_id}',
            headers=headers
        )
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch team details'}), response.status_code

        team_details = response.json()
        return jsonify(team_details)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tournaments/<int:tournament_id>', methods=['GET'])
def get_tournament_details(tournament_id):
    headers = {
        'Authorization': '4VOCS4jpPdKfU0gDukE2ritKiYnhHtZgJAdJKdUKyii-FfPBOU8'
    }
    try:
        response = requests.get(
            f'https://api.pandascore.co/tournaments/{tournament_id}',
            headers=headers
        )
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch team details'}), response.status_code

        team_details = response.json()
        return jsonify(team_details)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lol/matches/<int:match_id>', methods=['GET'])
def get_match_details(match_id):
    headers = {
        'Authorization': '4VOCS4jpPdKfU0gDukE2ritKiYnhHtZgJAdJKdUKyii-FfPBOU8'
    }
    try:
        response = requests.get(
            f'https://api.pandascore.co/lol/matches/{match_id}',
            headers=headers
        )
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch team details'}), response.status_code

        team_details = response.json()
        return jsonify(team_details)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/players/<int:player_id>/matches', methods=['GET'])
def get_matches_for_players(player_id):
    headers = {
        'Authorization': '4VOCS4jpPdKfU0gDukE2ritKiYnhHtZgJAdJKdUKyii-FfPBOU8'
    }
    try:
        response = requests.get(
            f'https://api.pandascore.co/players/{player_id}/matches',
            headers=headers
        )
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch team details'}), response.status_code

        team_details = response.json()
        return jsonify(team_details)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/changelog')
def changelog():
    return render_template('changelog.html')

@app.route('/forums')
def forums():
    return render_template('forums.html')

mail = Mail(app)

@app.route('/feedback')
def feedback():
    return render_template('feedback.html')

@app.route('/send_feedback', methods=['POST'])
def send_feedback():
    name = request.form['name']
    email = request.form['email']
    message = request.form['message']

    msg = Message("Feedback from {}".format(name),
                  recipients=['chrispacso5@gmail.com'])  # Enter the target email here
    msg.body = f"From: {name}\nEmail: {email}\n\n{message}"
    mail.send(msg)

    flash('Feedback sent successfully!')
    return redirect(url_for('index'))  # Redirect to your index page or a thank you page


team_data = {
    "FUR": {"name": "FURIA Esports", "logo": "https://cdn.pandascore.co/images/team/image/126688/220px_furia_uppercutlogo_square.png", "info": "Some info about Team A"},
    "TeamB": {"name": "Team B", "logo": "logo-teamb.png", "info": "Some info about Team B"},
    # Add more teams as needed
}

@app.route("/teams/<team_name>")
def team_page(team_name):
    team_info = team_data.get(team_name)
    if team_info:
        return render_template('team_page.html', team=team_info)
    else:
        # Handle the error (e.g., render a 404 not found template)
        return "Team not found", 404

@app.route('/api/update_teams', methods=['POST'])
def update_teams():
    global team_data
    data = request.json  # This should contain the team info
    for acronym, info in data.items():
        if acronym not in team_data:
            team_data[acronym] = info
    return jsonify({"message": "Teams updated successfully"}), 200

if __name__ == '__main__':
    app.run(debug=True)

