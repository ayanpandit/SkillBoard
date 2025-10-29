import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime

class CodeChefScraper:
    def __init__(self):
        self.base_url = "https://www.codechef.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
    
    def get_user_data(self, username):
        """Fetch only 4 specific fields"""
        try:
            url = f"{self.base_url}/users/{username}"
            print(f"🌐 Fetching: {url}\n")
            
            response = self.session.get(url, timeout=20)
            
            if response.status_code == 404:
                return {"error": "❌ User not found"}
            elif response.status_code != 200:
                return {"error": f"❌ HTTP Error: {response.status_code}"}
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract only the 4 required fields
            data = {
                "username": username,
                "full_name": self._get_full_name(soup, username),
                "stars": self._get_stars(soup),
                "country_rank": self._get_country_rank(soup),
                "total_problems_solved": self._get_total_problems(soup),
                "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            return data
            
        except requests.exceptions.RequestException as e:
            return {"error": f"Network error: {str(e)}"}
        except Exception as e:
            return {"error": f"Error: {str(e)}"}
    
    def _get_full_name(self, soup, username):
        """Extract full name"""
        try:
            # Method 1: From header h1
            header = soup.find('header', class_='user-details-container')
            if header:
                name_h1 = header.find('h1')
                if name_h1:
                    full_name = name_h1.get_text(strip=True)
                    # Remove username if present in parentheses
                    full_name = re.sub(r'\([^)]*\)', '', full_name).strip()
                    if full_name and full_name != username:
                        return full_name
            
            # Method 2: Look for h2-style class
            name_elem = soup.find('h1', class_='h2-style')
            if name_elem:
                full_name = name_elem.get_text(strip=True)
                full_name = re.sub(r'\([^)]*\)', '', full_name).strip()
                if full_name and full_name != username:
                    return full_name
            
            # Method 3: Check user-details section
            user_section = soup.find('section', class_='user-details')
            if user_section:
                h1 = user_section.find('h1')
                if h1:
                    full_name = h1.get_text(strip=True)
                    full_name = re.sub(r'\([^)]*\)', '', full_name).strip()
                    if full_name and full_name != username:
                        return full_name
        
        except Exception:
            pass
        
        return "N/A"
    
    def _get_stars(self, soup):
        """Extract star rating"""
        try:
            # Method 1: Count star elements
            star_container = soup.find('div', class_='rating-star')
            if star_container:
                stars = star_container.find_all('span', class_='star')
                if stars:
                    return f"{len(stars)}★"
            
            # Method 2: Look for filled stars
            stars = soup.find_all('span', class_='star')
            if stars:
                return f"{len(stars)}★"
            
            # Method 3: Find any star icon
            star_icons = soup.find_all('i', class_=re.compile(r'star'))
            if star_icons:
                return f"{len(star_icons)}★"
        
        except Exception:
            pass
        
        return "0★"
    
    def _get_country_rank(self, soup):
        """Extract country rank"""
        try:
            # Method 1: From rating-ranks section
            rank_section = soup.find('div', class_='rating-ranks')
            if rank_section:
                links = rank_section.find_all('a')
                for link in links:
                    text = link.get_text(strip=True)
                    if 'country' in text.lower():
                        # Extract number
                        rank_match = re.search(r'(\d+)', text)
                        if rank_match:
                            return rank_match.group(1)
            
            # Method 2: Look for "Country Rank" text
            country_rank_text = soup.find(string=re.compile(r'Country Rank', re.IGNORECASE))
            if country_rank_text:
                parent = country_rank_text.find_parent()
                if parent:
                    # Look for numbers in parent or siblings
                    for elem in parent.find_all(['strong', 'span', 'div', 'a']):
                        text = elem.get_text(strip=True)
                        if text.isdigit():
                            return text
            
            # Method 3: Check rating widgets
            widgets = soup.find_all('div', class_='rating-widget')
            for widget in widgets:
                title = widget.find('div', class_='rating-title')
                if title and 'country' in title.get_text().lower():
                    rank_num = widget.find('div', class_='rating-number')
                    if rank_num:
                        return rank_num.get_text(strip=True)
            
            # Method 4: Look in strong tags with parent context
            strongs = soup.find_all('strong')
            for strong in strongs:
                parent_text = ''
                if strong.parent:
                    parent_text = strong.parent.get_text().lower()
                
                if 'country' in parent_text:
                    rank = strong.get_text(strip=True)
                    if rank.isdigit():
                        return rank
        
        except Exception:
            pass
        
        return "N/A"
    
    def _get_total_problems(self, soup):
        """Extract total problems solved"""
        try:
            fully_solved = 0
            partially_solved = 0
            
            # Method 1: From problems-solved section
            problem_section = soup.find('section', class_='rating-data-section problems-solved')
            if problem_section:
                articles = problem_section.find_all('article')
                for article in articles:
                    h3 = article.find('h3')
                    h5 = article.find('h5')
                    
                    if h3 and h5:
                        label = h3.get_text(strip=True).lower()
                        value = h5.get_text(strip=True)
                        
                        if value.isdigit():
                            if 'fully' in label:
                                fully_solved = int(value)
                            elif 'partially' in label:
                                partially_solved = int(value)
            
            # Method 2: Direct text search for "Fully Solved"
            if fully_solved == 0:
                fully_text = soup.find(string=re.compile(r'Fully Solved', re.IGNORECASE))
                if fully_text:
                    parent = fully_text.find_parent()
                    if parent:
                        for elem in parent.find_all(['h5', 'span', 'strong', 'div']):
                            text = elem.get_text(strip=True)
                            if text.isdigit():
                                fully_solved = int(text)
                                break
            
            # Method 3: Direct text search for "Partially Solved"
            if partially_solved == 0:
                partial_text = soup.find(string=re.compile(r'Partially Solved', re.IGNORECASE))
                if partial_text:
                    parent = partial_text.find_parent()
                    if parent:
                        for elem in parent.find_all(['h5', 'span', 'strong', 'div']):
                            text = elem.get_text(strip=True)
                            if text.isdigit():
                                partially_solved = int(text)
                                break
            
            # Calculate total
            total = fully_solved + partially_solved
            
            # Method 4: Look for "Total Problems" directly
            if total == 0:
                total_text = soup.find(string=re.compile(r'Total.*Problems', re.IGNORECASE))
                if total_text:
                    parent = total_text.find_parent()
                    if parent:
                        for elem in parent.find_all(['h5', 'span', 'strong', 'div']):
                            text = elem.get_text(strip=True)
                            if text.isdigit():
                                return text
            
            return str(total) if total > 0 else "0"
        
        except Exception:
            pass
        
        return "0"
    
    def display_data(self, data):
        """Display the 4 fields in clean format"""
        if "error" in data:
            print(f"\n{data['error']}\n")
            return
        
        width = 60
        
        print("\n" + "=" * width)
        print(f"{'CODECHEF USER DATA':^{width}}")
        print("=" * width + "\n")
        
        print(f"{'Username':<25} : {data.get('username', 'N/A')}")
        print(f"{'Full Name':<25} : {data.get('full_name', 'N/A')}")
        print(f"{'Stars':<25} : {data.get('stars', '0★')}")
        print(f"{'Country Rank':<25} : {data.get('country_rank', 'N/A')}")
        print(f"{'Total Problems Solved':<25} : {data.get('total_problems_solved', '0')}")
        
        print("\n" + "=" * width)
        print(f"Scraped at: {data.get('scraped_at', 'N/A')}")
        print("=" * width + "\n")


def main():
    print("\n" + "=" * 60)
    print(f"{'CODECHEF PROFILE SCRAPER':^60}")
    print(f"{'4 Key Metrics':^60}")
    print("=" * 60 + "\n")
    
    username = input("📝 Enter CodeChef Username: ").strip()
    
    if not username:
        print("❌ Error: Username cannot be empty!\n")
        return
    
    print(f"\n🔍 Fetching data for '{username}'...\n")
    
    scraper = CodeChefScraper()
    user_data = scraper.get_user_data(username)
    
    scraper.display_data(user_data)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user.\n")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")