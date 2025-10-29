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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })
    
    def get_user_profile(self, username):
        """Fetch user profile with focused data extraction"""
        try:
            url = f"{self.base_url}/users/{username}"
            print(f"🌐 Fetching: {url}\n")
            
            response = self.session.get(url, timeout=20)
            
            if response.status_code == 404:
                return {"error": "❌ User not found"}
            elif response.status_code != 200:
                return {"error": f"❌ HTTP Error: {response.status_code}"}
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract the three main sections
            user_data = {
                "username": username,
                "profile_url": url,
                "basic_info": self._extract_basic_info(soup, username),
                "problems_solved": self._extract_total_problems(soup),
                "contest_history": self._extract_contest_details(soup, username),
                "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            return user_data
            
        except requests.exceptions.RequestException as e:
            return {"error": f"Network error: {str(e)}"}
        except Exception as e:
            return {"error": f"Error: {str(e)}"}
    
    def _extract_basic_info(self, soup, username):
        """Extract basic user information"""
        info = {
            "username": username,
            "full_name": "N/A",
            "country": "N/A",
            "student_or_professional": "N/A",
            "institution": "N/A",
            "stars": "0★",
            "global_rank": "N/A",
            "country_rank": "N/A"
        }
        
        try:
            # Full Name from header
            header = soup.find('header', class_='user-details-container')
            if header:
                name_h1 = header.find('h1')
                if name_h1:
                    full_name = name_h1.get_text(strip=True)
                    # Remove username from the name if present
                    full_name = re.sub(r'\([^)]*\)', '', full_name).strip()
                    if full_name and full_name != username:
                        info['full_name'] = full_name
            
            # Country
            country_span = soup.find('span', class_='user-country-name')
            if country_span:
                info['country'] = country_span.get_text(strip=True)
            
            # Check if student or professional
            student_check = soup.find('span', string=re.compile(r'Student|Professional'))
            if student_check:
                info['student_or_professional'] = student_check.get_text(strip=True)
            
            # Institution
            institution_span = soup.find('span', class_='user-institution-name')
            if institution_span:
                info['institution'] = institution_span.get_text(strip=True)
            
            # Stars - count star icons
            star_container = soup.find('div', class_='rating-star')
            if star_container:
                stars = star_container.find_all('span', class_='star')
                info['stars'] = f"{len(stars)}★"
            
            # Global and Country Rank
            rank_widgets = soup.find_all('div', class_='rating-ranks')
            if rank_widgets:
                for widget in rank_widgets:
                    rank_items = widget.find_all('a')
                    
                    for item in rank_items:
                        text = item.get_text(strip=True)
                        
                        if 'Global Rank' in text or 'global' in text.lower():
                            # Extract number
                            rank_match = re.search(r'(\d+)', text)
                            if rank_match:
                                info['global_rank'] = rank_match.group(1)
                        
                        elif 'Country Rank' in text or 'country' in text.lower():
                            rank_match = re.search(r'(\d+)', text)
                            if rank_match:
                                info['country_rank'] = rank_match.group(1)
            
            # Alternative rank extraction
            if info['global_rank'] == 'N/A' or info['country_rank'] == 'N/A':
                rank_sections = soup.find_all('strong')
                for strong in rank_sections:
                    parent_text = strong.parent.get_text() if strong.parent else ''
                    
                    if 'global' in parent_text.lower() and info['global_rank'] == 'N/A':
                        rank_num = strong.get_text(strip=True)
                        if rank_num.isdigit():
                            info['global_rank'] = rank_num
                    
                    if 'country' in parent_text.lower() and info['country_rank'] == 'N/A':
                        rank_num = strong.get_text(strip=True)
                        if rank_num.isdigit():
                            info['country_rank'] = rank_num
        
        except Exception as e:
            info['error'] = str(e)
        
        return info
    
    def _extract_total_problems(self, soup):
        """Extract total problems solved with breakdown"""
        problems = {
            "total_problems_solved": "0",
            "fully_solved": "0",
            "partially_solved": "0"
        }
        
        try:
            # Method 1: Look for problems solved section
            problem_section = soup.find('section', class_='rating-data-section problems-solved')
            
            if problem_section:
                # Fully solved
                articles = problem_section.find_all('article')
                for article in articles:
                    h3 = article.find('h3')
                    h5 = article.find('h5')
                    
                    if h3 and h5:
                        label = h3.get_text(strip=True).lower()
                        value = h5.get_text(strip=True)
                        
                        if 'fully' in label:
                            problems['fully_solved'] = value
                        elif 'partially' in label:
                            problems['partially_solved'] = value
            
            # Method 2: Direct text search
            if problems['fully_solved'] == "0":
                fully_text = soup.find(string=re.compile(r'Fully Solved', re.IGNORECASE))
                if fully_text:
                    parent = fully_text.find_parent()
                    if parent:
                        # Look for number nearby
                        numbers = parent.find_all(['h5', 'span', 'div', 'strong'])
                        for num in numbers:
                            text = num.get_text(strip=True)
                            if text.isdigit():
                                problems['fully_solved'] = text
                                break
            
            if problems['partially_solved'] == "0":
                partial_text = soup.find(string=re.compile(r'Partially Solved', re.IGNORECASE))
                if partial_text:
                    parent = partial_text.find_parent()
                    if parent:
                        numbers = parent.find_all(['h5', 'span', 'div', 'strong'])
                        for num in numbers:
                            text = num.get_text(strip=True)
                            if text.isdigit():
                                problems['partially_solved'] = text
                                break
            
            # Calculate total
            try:
                fully = int(problems['fully_solved'])
                partially = int(problems['partially_solved'])
                problems['total_problems_solved'] = str(fully + partially)
            except:
                pass
            
            # Method 3: Look for total problems directly
            if problems['total_problems_solved'] == "0":
                total_text = soup.find(string=re.compile(r'Total Problems', re.IGNORECASE))
                if total_text:
                    parent = total_text.find_parent()
                    if parent:
                        numbers = parent.find_all(['h5', 'span', 'div', 'strong'])
                        for num in numbers:
                            text = num.get_text(strip=True)
                            if text.isdigit():
                                problems['total_problems_solved'] = text
                                break
        
        except Exception as e:
            problems['error'] = str(e)
        
        return problems
    
    def _extract_contest_details(self, soup, username):
        """Extract complete contest history"""
        contests = {
            "total_contests": 0,
            "contest_list": []
        }
        
        try:
            # Extract total contests participated
            contest_count_text = soup.find(string=re.compile(r'No\. of Contests Participated', re.IGNORECASE))
            if contest_count_text:
                match = re.search(r'(\d+)', contest_count_text)
                if match:
                    contests['total_contests'] = int(match.group(1))
            
            # Method 1: Extract from embedded JavaScript
            scripts = soup.find_all('script')
            contest_data_found = False
            
            for script in scripts:
                if script.string:
                    # Look for rating history data
                    patterns = [
                        r'var\s+all_rating\s*=\s*(\[.*?\]);',
                        r'rating_data\s*=\s*(\[.*?\]);',
                        r'ratingData\s*:\s*(\[.*?\])',
                        r'"rating_data":\s*(\[.*?\])',
                    ]
                    
                    for pattern in patterns:
                        match = re.search(pattern, script.string, re.DOTALL)
                        if match:
                            try:
                                contest_list = json.loads(match.group(1))
                                
                                # Process contest data
                                for contest in contest_list:
                                    contest_info = {
                                        "name": contest.get('name', contest.get('code', 'N/A')),
                                        "code": contest.get('code', 'N/A'),
                                        "rating": contest.get('rating', contest.get('end_rating', 'N/A')),
                                        "rank": contest.get('rank', 'N/A'),
                                        "date": contest.get('end_date', contest.get('date', 'N/A'))
                                    }
                                    contests['contest_list'].append(contest_info)
                                
                                contest_data_found = True
                                if not contests['total_contests']:
                                    contests['total_contests'] = len(contest_list)
                                break
                            except json.JSONDecodeError:
                                continue
                        
                        if contest_data_found:
                            break
                    
                    if contest_data_found:
                        break
            
            # Method 2: Try API endpoint for contest ratings
            if not contest_data_found:
                try:
                    api_url = f"{self.base_url}/api/ratings/{username}"
                    response = self.session.get(api_url, timeout=10)
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        if isinstance(data, list):
                            for contest in data:
                                contest_info = {
                                    "name": contest.get('name', contest.get('code', 'N/A')),
                                    "code": contest.get('code', 'N/A'),
                                    "rating": contest.get('rating', 'N/A'),
                                    "rank": contest.get('rank', 'N/A'),
                                    "date": contest.get('end_date', 'N/A')
                                }
                                contests['contest_list'].append(contest_info)
                            
                            if not contests['total_contests']:
                                contests['total_contests'] = len(data)
                except:
                    pass
            
            # Sort contests by date (most recent first)
            if contests['contest_list']:
                contests['contest_list'] = sorted(
                    contests['contest_list'],
                    key=lambda x: x.get('date', ''),
                    reverse=True
                )
        
        except Exception as e:
            contests['error'] = str(e)
        
        return contests
    
    def display_profile(self, data):
        """Display profile in clean, structured format"""
        if "error" in data:
            print(f"\n{data['error']}\n")
            return
        
        width = 85
        
        print("\n" + "=" * width)
        print(f"{'CODECHEF USER PROFILE':^{width}}")
        print("=" * width + "\n")
        
        # BASIC INFORMATION
        print("👤 BASIC INFORMATION")
        print("-" * width)
        
        basic = data.get('basic_info', {})
        print(f"{'Username':<25} : {basic.get('username', 'N/A')}")
        print(f"{'Full Name':<25} : {basic.get('full_name', 'N/A')}")
        print(f"{'Country':<25} : {basic.get('country', 'N/A')}")
        print(f"{'Student/Professional':<25} : {basic.get('student_or_professional', 'N/A')}")
        print(f"{'Institution':<25} : {basic.get('institution', 'N/A')}")
        print(f"{'Stars':<25} : {basic.get('stars', '0★')}")
        print(f"{'Global Rank':<25} : {basic.get('global_rank', 'N/A')}")
        print(f"{'Country Rank':<25} : {basic.get('country_rank', 'N/A')}")
        print(f"{'Profile URL':<25} : {data.get('profile_url', 'N/A')}")
        
        # PROBLEMS SOLVED
        print(f"\n🧩 PROBLEMS SOLVED")
        print("-" * width)
        
        problems = data.get('problems_solved', {})
        total = problems.get('total_problems_solved', '0')
        fully = problems.get('fully_solved', '0')
        partially = problems.get('partially_solved', '0')
        
        print(f"{'Total Problems Solved':<25} : {total}")
        print(f"{'Fully Solved':<25} : {fully}")
        print(f"{'Partially Solved':<25} : {partially}")
        
        # CONTEST HISTORY
        print(f"\n🏆 CONTEST HISTORY")
        print("-" * width)
        
        contest_data = data.get('contest_history', {})
        total_contests = contest_data.get('total_contests', 0)
        contest_list = contest_data.get('contest_list', [])
        
        print(f"{'Total Contests Participated':<25} : {total_contests}\n")
        
        if contest_list:
            print(f"{'Contest Name':<40} {'Rating':<10} {'Rank':<10} {'Date':<15}")
            print("-" * width)
            
            for contest in contest_list:
                name = str(contest.get('name', 'N/A'))[:38]
                rating = str(contest.get('rating', 'N/A'))
                rank = str(contest.get('rank', 'N/A'))
                date = str(contest.get('date', 'N/A'))[:13]
                
                print(f"{name:<40} {rating:<10} {rank:<10} {date:<15}")
        else:
            print("No contest history available or data not accessible")
        
        # FOOTER
        print("\n" + "=" * width)
        print(f"Scraped at: {data.get('scraped_at', 'N/A')}")
        print("=" * width + "\n")


def main():
    print("\n" + "=" * 85)
    print(f"{'CODECHEF PROFILE SCRAPER':^85}")
    print(f"{'Basic Info | Problems Solved | Contest History':^85}")
    print("=" * 85 + "\n")
    
    username = input("📝 Enter CodeChef Username: ").strip()
    
    if not username:
        print("❌ Error: Username cannot be empty!\n")
        return
    
    print(f"\n🔍 Fetching data for '{username}'...")
    print("⏳ Please wait...\n")
    
    scraper = CodeChefScraper()
    profile_data = scraper.get_user_profile(username)
    
    scraper.display_profile(profile_data)
    
    # Save option
    if "error" not in profile_data:
        save = input("💾 Save data to JSON file? (y/n): ").strip().lower()
        if save == 'y':
            filename = f"codechef_{username}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(profile_data, f, indent=2, ensure_ascii=False)
            print(f"✅ Saved to: {filename}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user.\n")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")