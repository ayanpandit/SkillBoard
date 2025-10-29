import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

class CodeChefScraper:
    def __init__(self):
        self.base_url = "https://www.codechef.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })

    def get_contest_history(self, username):
        """Fetch contest history (Contest Name, Rating, Rank, Date)"""
        try:
            url = f"{self.base_url}/users/{username}"
            print(f"🌐 Fetching: {url}\n")

            response = self.session.get(url, timeout=20)
            if response.status_code == 404:
                return {"error": "❌ User not found"}
            elif response.status_code != 200:
                return {"error": f"❌ HTTP Error: {response.status_code}"}

            soup = BeautifulSoup(response.text, 'html.parser')

            # Extract all contests (from embedded JavaScript)
            contests = self._extract_contest_details(soup)

            return {
                "username": username,
                "contest_history": contests,
                "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }

        except requests.exceptions.RequestException as e:
            return {"error": f"Network error: {str(e)}"}
        except Exception as e:
            return {"error": f"Error: {str(e)}"}

    def _extract_contest_details(self, soup):
        """Extract contest details (Name, Rating, Rank, Date) from the profile page"""
        contests = []

        try:
            # Look for embedded JavaScript that stores rating data
            scripts = soup.find_all('script')

            for script in scripts:
                if not script.string:
                    continue

                # Pattern for JavaScript array (rating data)
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
                                name = contest.get('name', 'N/A')
                                rating = contest.get('rating', contest.get('end_rating', 'N/A'))
                                rank = contest.get('rank', 'N/A')
                                date = self._format_date(contest.get('end_date', contest.get('date', 'N/A')))

                                contests.append({
                                    "name": name,
                                    "rating": rating,
                                    "rank": rank,
                                    "date": date
                                })

                            # Stop after first successful parse
                            if contests:
                                break
                        except Exception as e:
                            print(f"⚠️ Error parsing contest JSON: {e}")
                            continue

                if contests:
                    break

            # If nothing found, fallback to API (optional)
            if not contests:
                username = soup.find('title').get_text(strip=True).split('|')[0].strip()
                api_url = f"{self.base_url}/api/ratings/{username}"
                try:
                    response = self.session.get(api_url, timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        for contest in data:
                            name = contest.get('name', 'N/A')
                            rating = contest.get('rating', 'N/A')
                            rank = contest.get('rank', 'N/A')
                            date = self._format_date(contest.get('end_date', 'N/A'))
                            contests.append({
                                "name": name,
                                "rating": rating,
                                "rank": rank,
                                "date": date
                            })
                except Exception as e:
                    print(f"⚠️ API fallback failed: {str(e)}")

            # Sort contests by date (most recent first)
            contests = sorted(contests, key=lambda x: x.get('date', ''), reverse=True)

        except Exception as e:
            print(f"❌ Error extracting contests: {e}")

        return contests

    def _format_date(self, date_str):
        """Clean up the date"""
        try:
            if isinstance(date_str, str):
                return date_str.split()[0] if ' ' in date_str else date_str
            return str(date_str)
        except:
            return "N/A"

    def display_contests(self, data):
        """Display contests in clean table format"""
        if "error" in data:
            print(f"\n{data['error']}\n")
            return

        contest_list = data.get('contest_history', [])
        if not contest_list:
            print("No contest data available.\n")
            return

        print("\n" + "=" * 80)
        print(f"{'CODECHEF CONTEST HISTORY':^80}")
        print("=" * 80 + "\n")
        print(f"{'Contest Name':<40} {'Rating':<10} {'Rank':<10} {'Date':<15}")
        print("-" * 80)

        for contest in contest_list:
            name = contest.get('name', 'N/A')[:38]
            rating = str(contest.get('rating', 'N/A'))
            rank = str(contest.get('rank', 'N/A'))
            date = contest.get('date', 'N/A')
            print(f"{name:<40} {rating:<10} {rank:<10} {date:<15}")

        print("\n" + "=" * 80)
        print(f"Scraped at: {data.get('scraped_at', 'N/A')}")
        print("=" * 80 + "\n")


def main():
    print("\n" + "=" * 80)
    print(f"{'CODECHEF CONTEST SCRAPER':^80}")
    print("=" * 80 + "\n")

    username = input("📝 Enter CodeChef Username: ").strip()
    if not username:
        print("❌ Username required!\n")
        return

    scraper = CodeChefScraper()
    data = scraper.get_contest_history(username)
    scraper.display_contests(data)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️ Interrupted\n")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")
