#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import re
import json
from datetime import datetime

class CodeChefScraper:
    def __init__(self):
        self.base_url = "https://www.codechef.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })

    def scrape_user_data(self, username):
        """Fetch all CodeChef data in ONE page request to avoid rate limits.

        Data included: full_name, rating, global_rank, country_rank, stars,
        problems_solved, contest_history. Only a single HTTP GET is performed
        and all fields are parsed from the same HTML response.
        """
        try:
            url = f"{self.base_url}/users/{username}"
            print(f"🌐 Fetching: {url}\n")

            response = self.session.get(url, timeout=20)
            if response.status_code == 404:
                return {"error": "❌ User not found"}
            elif response.status_code != 200:
                return {"error": f"❌ HTTP Error: {response.status_code}"}

            html = response.text
            soup = BeautifulSoup(html, "html.parser")

            # Extract main stats
            rating, global_rank, country_rank = self._extract_main_stats(soup, html)
            # Extract full name (single pass - no extra requests)
            full_name = self._get_full_name(soup, username)
            # Extract stars and problems solved
            stars = self._get_stars(soup)
            problems_solved = self._get_problems_solved(html, soup)
            # Extract contest history
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
                "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }

        except requests.exceptions.RequestException as e:
            return {"error": f"Network error: {str(e)}"}
        except Exception as e:
            return {"error": f"Unexpected error: {str(e)}"}

    # ---------------------------
    #  Main Stats Extraction
    # ---------------------------

    def _extract_main_stats(self, soup, html):
        """Extract rating, global rank, and country rank from profile page"""
        rating = self._find_rating_near_label(soup, html)
        global_rank = self._find_rank_by_label(soup, "Global Rank")
        country_rank = self._get_country_rank(soup)

        # Normalize
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
        """Find the large rating number above 'CodeChef Rating' label"""
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
        """Find global/country rank by label proximity"""
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

    # ---------------------------
    #  Stars & Problems Solved Extraction
    # ---------------------------

    def _get_full_name(self, soup, username):
        """Best-effort full name extraction using multiple DOM fallbacks."""
        try:
            # Method 1: From header h1 inside user details container
            header = soup.find('header', class_='user-details-container')
            if header:
                name_h1 = header.find('h1')
                if name_h1:
                    full_name = name_h1.get_text(strip=True)
                    full_name = re.sub(r'\([^)]*\)', '', full_name).strip()
                    if full_name and full_name.lower() != username.lower():
                        return full_name

            # Method 2: H1 with h2-style class seen on some layouts
            name_elem = soup.find('h1', class_='h2-style')
            if name_elem:
                full_name = name_elem.get_text(strip=True)
                full_name = re.sub(r'\([^)]*\)', '', full_name).strip()
                if full_name and full_name.lower() != username.lower():
                    return full_name

            # Method 3: User details section -> first h1
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
        """Extract country rank using multiple DOM fallbacks (ported from 4.py)."""
        try:
            # Method 1: From rating-ranks section links
            rank_section = soup.find('div', class_='rating-ranks')
            if rank_section:
                links = rank_section.find_all('a')
                for link in links:
                    text = link.get_text(strip=True)
                    if 'country' in text.lower():
                        rank_match = re.search(r'(\d+)', text)
                        if rank_match:
                            return rank_match.group(1)

            # Method 2: Look for explicit label "Country Rank"
            label_node = soup.find(string=re.compile(r'Country Rank', re.IGNORECASE))
            if label_node:
                parent = label_node.find_parent()
                if parent:
                    for elem in parent.find_all(['strong', 'span', 'div', 'a']):
                        txt = elem.get_text(strip=True)
                        if txt.isdigit():
                            return txt

            # Method 3: Rating widgets layout
            widgets = soup.find_all('div', class_='rating-widget')
            for widget in widgets:
                title = widget.find('div', class_='rating-title')
                if title and 'country' in title.get_text().lower():
                    rn = widget.find('div', class_='rating-number')
                    if rn:
                        return rn.get_text(strip=True)

            # Method 4: strong tags with parent context mentioning country
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

    # ---------------------------
    #  Contest History Extraction
    # ---------------------------

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
        except Exception as e:
            print(f"❌ Contest extraction error: {e}")
        return contests

    def _format_date(self, date_str):
        try:
            if isinstance(date_str, str):
                return date_str.split()[0] if ' ' in date_str else date_str
            return str(date_str)
        except:
            return "N/A"

    # ---------------------------
    #  Display
    # ---------------------------

    def display_user_data(self, data):
        if "error" in data:
            print(f"\n{data['error']}\n")
            return

        print("\n" + "=" * 100)
        print(f"{'CODECHEF PROFILE SUMMARY':^100}")
        print("=" * 100)
        print(f"👤 Username     : {data['username']}")
        print(f"🪪 Full Name    : {data.get('full_name', 'N/A')}")
        print(f"📈 Rating       : {data['rating']}")
        print(f"⭐ Stars        : {data.get('stars', '0★')}")
        print(f"✅ Problems Solved: {data.get('problems_solved', 0)}")
        print(f"🌍 Global Rank  : {data['global_rank']}")
        print(f"🇮🇳 Country Rank : {data['country_rank']}")
        print(f"🕒 Scraped At   : {data['scraped_at']}")
        print("=" * 100)

        contest_list = data.get("contest_history", [])
        if contest_list:
            print(f"\n{'Contest Name':<45} {'Rating':<10} {'Rank':<10} {'Date':<15}")
            print("-" * 100)
            for c in contest_list:
                print(f"{c['name'][:43]:<45} {str(c['rating']):<10} {str(c['rank']):<10} {c['date']:<15}")
            print("=" * 100)
        else:
            print("\nNo contest history found.\n")


# ---------------------------
#  Main Runner
# ---------------------------

def main():
    print("\n" + "=" * 100)
    print(f"{'CODECHEF FULL SCRAPER':^100}")
    print("=" * 100 + "\n")

    username = input("📝 Enter CodeChef Username: ").strip()
    if not username:
        print("❌ Username required!\n")
        return

    scraper = CodeChefScraper()
    data = scraper.scrape_user_data(username)
    scraper.display_user_data(data)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️ Interrupted by user\n")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")
