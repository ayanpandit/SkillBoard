from flask import Flask, request, jsonify
from bs4 import BeautifulSoup
import requests
import re
import json
import time
import random
from datetime import datetime
from flask_cors import CORS
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

app = Flask(__name__)
CORS(app)

class CodeChefScraper:
    """Robust CodeChef profile scraper with rate limiting and retry logic."""

    def __init__(self):
        self.base_url = "https://www.codechef.com"
        self.session = self._create_robust_session()
        self.last_request_time = 0
        self.min_delay = 2.0  # Minimum 2 seconds between requests
        self.max_delay = 4.0  # Maximum 4 seconds between requests
        
    def _create_robust_session(self):
        """Create a session with retry logic and connection pooling."""
        session = requests.Session()
        
        # Retry strategy for temporary failures
        retry_strategy = Retry(
            total=3,  # Total retries
            backoff_factor=1,  # Wait 1, 2, 4 seconds between retries
            status_forcelist=[429, 500, 502, 503, 504],  # Retry on these status codes
            allowed_methods=["GET"]
        )
        
        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=10,
            pool_maxsize=10,
            pool_block=False
        )
        
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Rotate user agents to appear more natural
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        ]
        
        session.headers.update({
            'User-Agent': random.choice(user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
        })
        
        return session

    def _rate_limit(self):
        """Implement rate limiting with random jitter to avoid detection."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        # Add random delay between min_delay and max_delay
        delay = random.uniform(self.min_delay, self.max_delay)
        
        if time_since_last < delay:
            sleep_time = delay - time_since_last
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()

    def get_user_data(self, username):
        """Main entry point with retry logic."""
        return self.scrape_user_data(username)

    def scrape_user_data(self, username, retry_count=0, max_retries=3):
        """Fetch CodeChef data with exponential backoff on failures."""
        try:
            # Apply rate limiting
            self._rate_limit()
            
            url = f"{self.base_url}/users/{username}"
            
            # Make request with timeout
            response = self.session.get(url, timeout=30)
            
            # Handle different status codes
            if response.status_code == 404:
                return {"error": "User not found", "username": username}
            
            if response.status_code == 429:  # Rate limited
                if retry_count < max_retries:
                    wait_time = (2 ** retry_count) * random.uniform(3, 6)  # Exponential backoff
                    print(f"Rate limited for {username}. Waiting {wait_time:.1f}s before retry {retry_count + 1}/{max_retries}")
                    time.sleep(wait_time)
                    return self.scrape_user_data(username, retry_count + 1, max_retries)
                return {"error": "Rate limited - try again later", "username": username}
            
            if response.status_code == 403:  # Forbidden
                return {"error": "Access forbidden - possible IP block", "username": username}
            
            if response.status_code != 200:
                if retry_count < max_retries:
                    wait_time = (2 ** retry_count) * random.uniform(1, 3)
                    print(f"HTTP {response.status_code} for {username}. Retrying in {wait_time:.1f}s...")
                    time.sleep(wait_time)
                    return self.scrape_user_data(username, retry_count + 1, max_retries)
                return {"error": f"HTTP Error {response.status_code}", "username": username}

            html = response.text
            soup = BeautifulSoup(html, 'html.parser')

            # Extract data
            rating, global_rank, country_rank = self._extract_main_stats(soup, html)
            full_name = self._get_full_name(soup, username)
            stars = self._get_stars(soup)
            problems_solved = self._get_problems_solved(html, soup)
            contests = self._extract_contest_details(soup)

            return {
                "username": username,
                "full_name": full_name,
                "rating": rating,
                "global_rank": global_rank,
                "country_rank": country_rank,
                "stars": stars,
                "problems_solved": problems_solved,
                "contest_history": contests,
                "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "success": True
            }
            
        except requests.exceptions.Timeout:
            if retry_count < max_retries:
                wait_time = (2 ** retry_count) * random.uniform(1, 2)
                print(f"Timeout for {username}. Retrying in {wait_time:.1f}s...")
                time.sleep(wait_time)
                return self.scrape_user_data(username, retry_count + 1, max_retries)
            return {"error": "Request timeout", "username": username}
            
        except requests.exceptions.ConnectionError:
            if retry_count < max_retries:
                wait_time = (2 ** retry_count) * random.uniform(2, 4)
                print(f"Connection error for {username}. Retrying in {wait_time:.1f}s...")
                time.sleep(wait_time)
                return self.scrape_user_data(username, retry_count + 1, max_retries)
            return {"error": "Connection error", "username": username}
            
        except requests.exceptions.RequestException as e:
            return {"error": f"Network error: {str(e)}", "username": username}
            
        except Exception as e:
            return {"error": f"Unexpected error: {str(e)}", "username": username}

    # ---------------------------
    #  Main Stats Extraction
    # ---------------------------

    def _extract_main_stats(self, soup, html):
        rating = self._find_rating_near_label(soup, html)
        global_rank = self._find_rank_by_label(soup, "Global Rank")
        country_rank = self._get_country_rank(soup)

        rating = rating if rating else "N/A"
        global_rank = global_rank if global_rank else "N/A"
        country_rank = country_rank if country_rank else "N/A"
        return rating, global_rank, country_rank

    def _norm_num(self, s):
        if not s:
            return None
        s = s.strip().replace(",", "").lstrip("#")
        m = re.search(r"(-?\d+)", s)
        return m.group(1) if m else None

    def _find_rating_near_label(self, soup, html):
        label_nodes = soup.find_all(string=re.compile(r'CodeChef\s*Rating', re.I))
        for node in label_nodes:
            parent = node.parent
            for prev in parent.find_previous_siblings(limit=6):
                text = prev.get_text(" ", strip=True)
                m = re.search(r'(^|\D)(\d{3,5})(\D|$)', text)
                if m:
                    return self._norm_num(m.group(2))
                a = prev.find('a', string=re.compile(r'\d{3,5}'))
                if a:
                    return self._norm_num(a.get_text(strip=True))
            for prev in parent.find_all_previous(limit=20):
                text = prev.get_text(" ", strip=True)
                m = re.search(r'(^|\D)(\d{3,5})(\D|$)', text)
                if m:
                    return self._norm_num(m.group(2))
        el = soup.select_one(".rating-number, .rating-number h2, .rating")
        if el:
            r = self._norm_num(el.get_text(" ", strip=True))
            if r:
                return r
        m = re.search(r'"rating"\s*:\s*("?)(-?\d+)\1', html)
        return m.group(2) if m else None

    def _find_rank_by_label(self, soup, label_text):
        nodes = soup.find_all(string=re.compile(label_text, re.I))
        for node in nodes:
            parent = node.parent
            for prev in parent.find_previous_siblings(limit=6):
                a = prev.find('a', string=re.compile(r'[#]?\s*\d{1,7}'))
                if a:
                    return self._norm_num(a.get_text(strip=True))
                text = prev.get_text(" ", strip=True)
                m = re.search(r'(\d{1,7})', text)
                if m:
                    return self._norm_num(m.group(1))
            gp = parent.parent
            if gp:
                a = gp.find('a', string=re.compile(r'[#]?\s*\d{1,7}'))
                if a:
                    return self._norm_num(a.get_text(strip=True))
        text = soup.get_text(" ", strip=True)
        m = re.search(rf'{label_text}[:\s#-]{{0,6}}([0-9,]{{1,7}})', text, re.I)
        return self._norm_num(m.group(1)) if m else None

    def _get_full_name(self, soup, username):
        try:
            header = soup.find('header', class_='user-details-container')
            if header:
                name_h1 = header.find('h1')
                if name_h1:
                    full_name = name_h1.get_text(strip=True)
                    full_name = re.sub(r'\([^)]*\)', '', full_name).strip()
                    if full_name and full_name.lower() != username.lower():
                        return full_name
            name_elem = soup.find('h1', class_='h2-style')
            if name_elem:
                full_name = name_elem.get_text(strip=True)
                full_name = re.sub(r'\([^)]*\)', '', full_name).strip()
                if full_name and full_name.lower() != username.lower():
                    return full_name
            user_section = soup.find('section', class_='user-details')
            if user_section:
                h1 = user_section.find('h1')
                if h1:
                    full_name = h1.get_text(strip=True)
                    full_name = re.sub(r'\([^)]*\)', '', full_name).strip()
                    if full_name and full_name.lower() != username.lower():
                        return full_name
        except Exception:
            pass
        return "N/A"

    def _get_country_rank(self, soup):
        try:
            rank_section = soup.find('div', class_='rating-ranks')
            if rank_section:
                links = rank_section.find_all('a')
                for link in links:
                    text = link.get_text(strip=True)
                    if 'country' in text.lower():
                        rank_match = re.search(r'(\d+)', text)
                        if rank_match:
                            return rank_match.group(1)
            label_node = soup.find(string=re.compile(r'Country Rank', re.IGNORECASE))
            if label_node:
                parent = label_node.find_parent()
                if parent:
                    for elem in parent.find_all(['strong', 'span', 'div', 'a']):
                        txt = elem.get_text(strip=True)
                        if txt.isdigit():
                            return txt
            widgets = soup.find_all('div', class_='rating-widget')
            for widget in widgets:
                title = widget.find('div', class_='rating-title')
                if title and 'country' in title.get_text().lower():
                    rn = widget.find('div', class_='rating-number')
                    if rn:
                        return rn.get_text(strip=True)
            for strong in soup.find_all('strong'):
                parent_text = strong.parent.get_text().lower() if strong.parent else ''
                if 'country' in parent_text:
                    rk = strong.get_text(strip=True)
                    if rk.isdigit():
                        return rk
        except Exception:
            pass
        return "N/A"

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
        except Exception:
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
        except Exception:
            return 0

    def _extract_contest_details(self, soup):
        contests = []
        try:
            scripts = soup.find_all('script')
            for script in scripts:
                if not script.string:
                    continue
                patterns = [
                    r'var\s+all_rating\s*=\s*(\[.*?\]);',
                    r'rating_data\s*=\s*(\[.*?\]);',
                    r'ratingData\s*:\s*(\[.*?\])',
                ]
                for pattern in patterns:
                    match = re.search(pattern, script.string, re.DOTALL)
                    if match:
                        try:
                            contest_list = json.loads(match.group(1))
                            for contest in contest_list:
                                contests.append({
                                    "name": contest.get('name', 'N/A'),
                                    "rating": contest.get('rating', contest.get('end_rating', 'N/A')),
                                    "rank": contest.get('rank', 'N/A'),
                                    "date": self._format_date(contest.get('end_date', contest.get('date', 'N/A')))
                                })
                            if contests:
                                break
                        except Exception:
                            continue
                if contests:
                    break
            contests = sorted(contests, key=lambda x: x.get('date', ''), reverse=True)
        except Exception:
            pass
        return contests

    def _format_date(self, date_str):
        try:
            if isinstance(date_str, str):
                return date_str.split()[0] if ' ' in date_str else date_str
            return str(date_str)
        except Exception:
            return "N/A"


# Single username endpoint
@app.route('/api/codechef', methods=['GET'])
def get_codechef_data():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Username is required"}), 400

    scraper = CodeChefScraper()
    data = scraper.get_user_data(username)
    return jsonify(data)


# Bulk processing endpoint
@app.route('/api/codechef/bulk', methods=['POST'])
def get_bulk_codechef_data():
    """Process multiple usernames with progress tracking."""
    data = request.get_json()
    
    if not data or 'usernames' not in data:
        return jsonify({"error": "usernames array is required"}), 400
    
    usernames = data['usernames']
    if not isinstance(usernames, list):
        return jsonify({"error": "usernames must be an array"}), 400
    
    if len(usernames) > 1000:
        return jsonify({"error": "Maximum 1000 usernames per request"}), 400
    
    scraper = CodeChefScraper()
    results = []
    
    for i, username in enumerate(usernames):
        print(f"Processing {i+1}/{len(usernames)}: {username}")
        result = scraper.get_user_data(username)
        results.append(result)
    
    # Summary statistics
    successful = sum(1 for r in results if r.get('success', False))
    failed = len(results) - successful
    
    return jsonify({
        "results": results,
        "summary": {
            "total": len(results),
            "successful": successful,
            "failed": failed,
            "success_rate": f"{(successful/len(results)*100):.1f}%" if results else "0%"
        }
    })


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, threaded=True)