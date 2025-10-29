from flask import Flask, request, jsonify
from bs4 import BeautifulSoup
import requests
import re
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable cross-origin requests from your frontend

class CodeChefScraper:
    def __init__(self):
        self.base_url = "https://www.codechef.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })

    def get_user_data(self, username):
        try:
            url = f"{self.base_url}/users/{username}"
            response = self.session.get(url, timeout=15)
            if response.status_code == 404:
                return {"error": "User not found"}
            if response.status_code != 200:
                return {"error": f"HTTP Error {response.status_code}"}

            soup = BeautifulSoup(response.text, 'html.parser')
            text = response.text

            data = {
                "username": username,
                "stars": self._get_stars(soup),
                "problems_solved": self._get_problems_solved(text, soup),
                "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            return data

        except Exception as e:
            return {"error": str(e)}

    def _get_stars(self, soup):
        try:
            star_container = soup.find('div', class_='rating-star')
            if star_container:
                stars = star_container.find_all('span', class_='star')
                if stars:
                    return f"{len(stars)}★"
            text = soup.get_text()
            match = re.search(r'(\d+)\s*★', text)
            if match:
                return f"{match.group(1)}★"
            return "0★"
        except:
            return "0★"

    def _get_problems_solved(self, text, soup):
        try:
            patterns = [
                r'"problemsSolved":\s*(\d+)',
                r'"fully_solved":\s*(\d+)',
                r'"problems_solved":\s*(\d+)',
                r'Fully Solved.*?(\d+)',
                r'Problems Solved.*?(\d+)',
            ]
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    return int(match.group(1))

            solved_section = soup.find('section', class_='rating-data-section problems-solved')
            if solved_section:
                numbers = re.findall(r'\d+', solved_section.get_text())
                if numbers:
                    return int(numbers[0])
            return 0
        except:
            return 0

@app.route('/api/codechef', methods=['GET'])
def get_codechef_data():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Username is required"}), 400

    scraper = CodeChefScraper()
    data = scraper.get_user_data(username)
    return jsonify(data)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
