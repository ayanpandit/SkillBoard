import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime


class CodeChefScraper:
    def __init__(self):
        self.base_url = "https://www.codechef.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.codechef.com/'
        })

    def get_user_data(self, username):
        """Fetch stars and total problems solved"""
        try:
            url = f"{self.base_url}/users/{username}"
            print(f"🌐 Fetching: {url}\n")

            response = self.session.get(url, timeout=20)

            if response.status_code == 404:
                return {"error": "❌ User not found"}
            elif response.status_code != 200:
                return {"error": f"❌ HTTP Error: {response.status_code}"}

            soup = BeautifulSoup(response.text, 'html.parser')
            text = response.text

            data = {
                "username": username,
                "stars": self._get_stars(soup),
                "problems_solved": self._get_problems_solved(text, soup),
                "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }

            return data

        except requests.exceptions.RequestException as e:
            return {"error": f"Network error: {str(e)}"}
        except Exception as e:
            return {"error": f"Error: {str(e)}"}

    def _get_stars(self, soup):
        """Extract star rating"""
        try:
            # Method 1: rating-star container
            star_container = soup.find('div', class_='rating-star')
            if star_container:
                stars = star_container.find_all('span', class_='star')
                if stars:
                    return f"{len(stars)}★"

            # Method 2: Look for star symbols in text
            text = soup.get_text()
            match = re.search(r'(\d+)\s*★', text)
            if match:
                return f"{match.group(1)}★"

            return "0★"
        except Exception:
            return "0★"

    def _get_problems_solved(self, text, soup):
        """Extract total problems solved"""
        try:
            # Try regex patterns first
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

            # Fallback: Try to parse from HTML
            solved_section = soup.find('section', class_='rating-data-section problems-solved')
            if solved_section:
                numbers = re.findall(r'\d+', solved_section.get_text())
                if numbers:
                    return int(numbers[0])

            return 0
        except Exception:
            return 0

    def display_data(self, data):
        """Display combined info"""
        if "error" in data:
            print(f"\n{data['error']}\n")
            return

        width = 50
        print("=" * width)
        print(f"{'CODECHEF USER PROFILE':^{width}}")
        print("=" * width)
        print(f"👤 Username          : {data.get('username', 'N/A')}")
        print(f"⭐ Stars             : {data.get('stars', '0★')}")
        print(f"✅ Problems Solved   : {data.get('problems_solved', 0)}")
        print(f"🕓 Scraped At        : {data.get('scraped_at', 'N/A')}")
        print("=" * width + "\n")


def main():
    print("\n" + "=" * 50)
    print(f"{'CODECHEF SCRAPER':^50}")
    print(f"{'Stars + Problems Solved':^50}")
    print("=" * 50 + "\n")

    username = input("Enter Username: ").strip()

    if not username:
        print("❌ Username required!\n")
        return

    print(f"\n🔍 Fetching data...\n")

    scraper = CodeChefScraper()
    user_data = scraper.get_user_data(username)

    print()
    scraper.display_data(user_data)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted\n")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")
