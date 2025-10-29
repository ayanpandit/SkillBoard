import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
import time

class CodeChefScraper:
    def __init__(self):
        self.base_url = "https://www.codechef.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        })
    
    def get_user_profile(self, username):
        """Fetch and parse comprehensive user profile data"""
        try:
            url = f"{self.base_url}/users/{username}"
            print(f"🌐 Fetching: {url}")
            
            response = self.session.get(url, timeout=20)
            
            if response.status_code == 404:
                return {"error": "User not found"}
            elif response.status_code != 200:
                return {"error": f"Failed to fetch profile. Status: {response.status_code}"}
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract all sections
            user_data = {
                "username": username,
                "profile_url": url,
                "basic_info": self._extract_basic_info(soup, username),
                "ratings": self._extract_ratings(soup),
                "statistics": self._extract_statistics(soup),
                "problems_solved": self._extract_problem_stats(soup),
                "contest_history": self._extract_contest_history(soup),
                "recent_submissions": self._extract_submissions(username),
                "badges": self._extract_badges(soup),
                "practice_stats": self._extract_practice_stats(soup),
                "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            return user_data
            
        except requests.exceptions.RequestException as e:
            return {"error": f"Network error: {str(e)}"}
        except Exception as e:
            return {"error": f"Unexpected error: {str(e)}"}
    
    def _extract_basic_info(self, soup, username):
        """Extract comprehensive basic profile information"""
        info = {"username": username}
        
        try:
            # User details from header
            header = soup.find('header', class_='user-details-container')
            if header:
                # Name
                name_elem = header.find('h1')
                if name_elem:
                    info['full_name'] = name_elem.get_text(strip=True)
                
                # Rating color indicator
                rating_span = header.find('span', class_='rating')
                if rating_span:
                    info['username_with_rating'] = rating_span.get_text(strip=True)
            
            # User details section
            details_section = soup.find('section', class_='user-details')
            if details_section:
                # Country
                country = details_section.find('span', class_='user-country-name')
                if country:
                    info['country'] = country.get_text(strip=True)
                
                # Student/Professional and Institution
                student_prof = details_section.find('span', string=re.compile('Student|Professional'))
                if student_prof:
                    info['student_or_professional'] = student_prof.get_text(strip=True)
                
                institution = details_section.find('span', class_='user-institution-name')
                if institution:
                    info['institution'] = institution.get_text(strip=True)
                
                # Teams
                teams_link = details_section.find('a', href=re.compile(r'/teams'))
                if teams_link:
                    info['teams_url'] = self.base_url + teams_link['href']
            
            # Rankings from rating widgets
            rating_widgets = soup.find_all('div', class_='rating-widget')
            for widget in rating_widgets:
                title = widget.find('div', class_='rating-title')
                rank_num = widget.find('div', class_='rating-number')
                
                if title and rank_num:
                    title_text = title.get_text(strip=True).lower()
                    rank_value = rank_num.get_text(strip=True)
                    
                    if 'global' in title_text:
                        info['global_rank'] = rank_value
                    elif 'country' in title_text:
                        info['country_rank'] = rank_value
            
            # Star rating
            stars = soup.find_all('span', class_='star')
            info['stars'] = f"{len(stars)}★" if stars else "0★"
            
        except Exception as e:
            info['extraction_error'] = str(e)
        
        return info
    
    def _extract_ratings(self, soup):
        """Extract detailed rating information"""
        ratings = {}
        
        try:
            # Current rating and highest
            rating_header = soup.find('div', class_='rating-header')
            if rating_header:
                current = rating_header.find('div', class_='rating-number')
                if current:
                    ratings['current_rating'] = current.get_text(strip=True)
                
                highest = rating_header.find('small')
                if highest:
                    highest_text = highest.get_text(strip=True)
                    match = re.search(r'(\d+)', highest_text)
                    if match:
                        ratings['highest_rating'] = match.group(1)
            
            # Division
            division_elem = soup.find(string=re.compile(r'Div \d'))
            if division_elem:
                ratings['division'] = division_elem.strip()
            
            # Rating change (if shown)
            rating_change = soup.find('span', class_='rating-change')
            if rating_change:
                ratings['recent_change'] = rating_change.get_text(strip=True)
            
            # Extract rating from different contest types
            sections = soup.find_all('section', class_='rating-data-section')
            for section in sections:
                title = section.find('h3')
                if title:
                    contest_type = title.get_text(strip=True)
                    rating_data = section.find('div', class_='rating-number')
                    if rating_data:
                        ratings[contest_type] = rating_data.get_text(strip=True)
        
        except Exception as e:
            ratings['error'] = str(e)
        
        return ratings
    
    def _extract_statistics(self, soup):
        """Extract problem solving and contest statistics"""
        stats = {}
        
        try:
            # Contest participation
            contests_text = soup.find(string=re.compile(r'No\. of Contests Participated'))
            if contests_text:
                match = re.search(r'(\d+)', contests_text)
                if match:
                    stats['contests_participated'] = match.group(1)
            
            # From rating data sections
            sections = soup.find_all('section', class_='rating-data-section')
            for section in sections:
                articles = section.find_all('article')
                for article in articles:
                    h3 = article.find('h3')
                    h5 = article.find('h5')
                    if h3 and h5:
                        key = h3.get_text(strip=True)
                        value = h5.get_text(strip=True)
                        stats[key] = value
            
            # Problems solved widgets
            problem_widgets = soup.find_all('div', class_='problems-widget')
            for widget in problem_widgets:
                count = widget.find('h5')
                label = widget.find('h3')
                if count and label:
                    key = label.get_text(strip=True)
                    value = count.get_text(strip=True)
                    stats[key] = value
        
        except Exception as e:
            stats['error'] = str(e)
        
        return stats
    
    def _extract_problem_stats(self, soup):
        """Extract detailed problem solving statistics"""
        problem_stats = {}
        
        try:
            # Fully solved
            fully_solved = soup.find(string=re.compile(r'Fully Solved'))
            if fully_solved:
                parent = fully_solved.find_parent()
                if parent:
                    number = parent.find('h5')
                    if number:
                        problem_stats['fully_solved'] = number.get_text(strip=True)
            
            # Partially solved
            partially_solved = soup.find(string=re.compile(r'Partially Solved'))
            if partially_solved:
                parent = partially_solved.find_parent()
                if parent:
                    number = parent.find('h5')
                    if number:
                        problem_stats['partially_solved'] = number.get_text(strip=True)
            
            # Categories
            categories = {}
            category_sections = soup.find_all('div', class_='rating-data-section')
            for section in category_sections:
                category_name = section.find('h3')
                if category_name:
                    cat_text = category_name.get_text(strip=True)
                    if 'School' in cat_text or 'Easy' in cat_text or 'Medium' in cat_text or 'Hard' in cat_text:
                        count = section.find('h5')
                        if count:
                            categories[cat_text] = count.get_text(strip=True)
            
            if categories:
                problem_stats['by_difficulty'] = categories
        
        except Exception as e:
            problem_stats['error'] = str(e)
        
        return problem_stats
    
    def _extract_contest_history(self, soup):
        """Extract contest participation history"""
        contests = []
        
        try:
            # Look for contest data in scripts
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string:
                    # Rating graph data
                    if 'rating_data' in script.string or 'ratingData' in script.string:
                        # Try multiple patterns
                        patterns = [
                            r'rating_data\s*=\s*(\[.*?\]);',
                            r'ratingData\s*=\s*(\[.*?\]);',
                            r'"rating_data":\s*(\[.*?\])',
                        ]
                        
                        for pattern in patterns:
                            match = re.search(pattern, script.string, re.DOTALL)
                            if match:
                                try:
                                    contest_data = json.loads(match.group(1))
                                    contests = contest_data[:15]  # Last 15 contests
                                    break
                                except:
                                    continue
                    
                    # Contest list data
                    if 'contestData' in script.string:
                        match = re.search(r'contestData\s*=\s*(\{.*?\});', script.string, re.DOTALL)
                        if match:
                            try:
                                data = json.loads(match.group(1))
                                if 'contests' in data:
                                    contests = data['contests'][:15]
                            except:
                                pass
        
        except Exception as e:
            return {"error": str(e)}
        
        return contests if contests else {"message": "No contest history available"}
    
    def _extract_submissions(self, username):
        """Fetch recent submission activity"""
        submissions = []
        
        try:
            # Try the recent submissions API
            api_url = f"{self.base_url}/recent/user"
            params = {'page': 0, 'user': username}
            
            response = self.session.get(api_url, params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'content' in data:
                    recent = data['content'][:20]  # Last 20 submissions
                    
                    for sub in recent:
                        submission = {
                            'problem_code': sub.get('problemCode', 'N/A'),
                            'problem_name': sub.get('problemName', 'N/A'),
                            'result': sub.get('result', 'N/A'),
                            'language': sub.get('language', 'N/A'),
                            'time': sub.get('time', 'N/A'),
                            'date': sub.get('date', 'N/A')
                        }
                        submissions.append(submission)
        
        except Exception as e:
            return {"error": str(e)}
        
        return submissions if submissions else {"message": "No recent submissions"}
    
    def _extract_badges(self, soup):
        """Extract user badges and achievements"""
        badges = []
        
        try:
            # Badges container
            badge_container = soup.find('div', class_='badge-container')
            if badge_container:
                badge_items = badge_container.find_all('div', class_='badge-item')
                
                for item in badge_items:
                    badge_name = item.find('div', class_='badge-name')
                    badge_img = item.find('img')
                    
                    badge = {}
                    if badge_name:
                        badge['name'] = badge_name.get_text(strip=True)
                    if badge_img:
                        badge['image'] = badge_img.get('src', '')
                        badge['alt'] = badge_img.get('alt', '')
                    
                    if badge:
                        badges.append(badge)
            
            # Alternative badge section
            if not badges:
                badge_imgs = soup.find_all('img', alt=re.compile(r'badge|Badge'))
                for img in badge_imgs:
                    badges.append({
                        'name': img.get('alt', 'Unknown Badge'),
                        'image': img.get('src', '')
                    })
        
        except Exception as e:
            return [{"error": str(e)}]
        
        return badges if badges else [{"message": "No badges earned"}]
    
    def _extract_practice_stats(self, soup):
        """Extract practice and submission statistics"""
        practice = {}
        
        try:
            # Submission stats from graph sections
            stat_sections = soup.find_all('div', class_='graph-section')
            for section in stat_sections:
                title = section.find('h4')
                if title:
                    section_name = title.get_text(strip=True)
                    
                    # Get statistics from this section
                    stat_items = section.find_all('div', class_='stat-item')
                    section_stats = {}
                    
                    for item in stat_items:
                        label = item.find('span', class_='label')
                        value = item.find('span', class_='value')
                        
                        if label and value:
                            section_stats[label.get_text(strip=True)] = value.get_text(strip=True)
                    
                    if section_stats:
                        practice[section_name] = section_stats
        
        except Exception as e:
            practice['error'] = str(e)
        
        return practice
    
    def display_profile(self, data):
        """Display comprehensive profile data in structured terminal format"""
        if "error" in data:
            print(f"\n❌ ERROR: {data['error']}\n")
            return
        
        width = 90
        print("\n" + "=" * width)
        print(f"{'CODECHEF USER PROFILE - COMPLETE DATA':^{width}}")
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
        print(f"{'Stars':<25} : {basic.get('stars', 'N/A')}")
        print(f"{'Global Rank':<25} : {basic.get('global_rank', 'N/A')}")
        print(f"{'Country Rank':<25} : {basic.get('country_rank', 'N/A')}")
        if 'teams_url' in basic:
            print(f"{'Teams URL':<25} : {basic.get('teams_url')}")
        print(f"{'Profile URL':<25} : {data['profile_url']}")
        
        # RATINGS
        print(f"\n⭐ RATINGS & DIVISION")
        print("-" * width)
        ratings = data.get('ratings', {})
        if ratings and len(ratings) > 0:
            for key, value in ratings.items():
                if key != 'error':
                    print(f"{key:<25} : {value}")
        else:
            print("No rating information available")
        
        # STATISTICS
        print(f"\n📊 STATISTICS")
        print("-" * width)
        stats = data.get('statistics', {})
        if stats and len(stats) > 0:
            for key, value in stats.items():
                if key != 'error':
                    print(f"{key:<35} : {value}")
        else:
            print("No statistics available")
        
        # PROBLEMS SOLVED
        print(f"\n🧩 PROBLEMS SOLVED")
        print("-" * width)
        problems = data.get('problems_solved', {})
        if problems and len(problems) > 0:
            for key, value in problems.items():
                if key == 'by_difficulty' and isinstance(value, dict):
                    print(f"\n  By Difficulty:")
                    for diff, count in value.items():
                        print(f"    {diff:<30} : {count}")
                elif key != 'error':
                    print(f"{key:<35} : {value}")
        else:
            print("No problem statistics available")
        
        # CONTEST HISTORY
        print(f"\n🏆 CONTEST HISTORY")
        print("-" * width)
        contests = data.get('contest_history', [])
        if isinstance(contests, list) and len(contests) > 0:
            print(f"Total Contests: {len(contests)}\n")
            print(f"{'Contest Name':<45} {'Rating':<10} {'Rank':<10}")
            print("-" * width)
            for contest in contests[:15]:  # Show last 15
                if isinstance(contest, dict):
                    name = contest.get('name', contest.get('code', 'N/A'))[:43]
                    rating = str(contest.get('rating', contest.get('end_rating', 'N/A')))
                    rank = str(contest.get('rank', 'N/A'))
                    print(f"{name:<45} {rating:<10} {rank:<10}")
        else:
            if isinstance(contests, dict) and 'message' in contests:
                print(contests['message'])
            else:
                print("No contest history available")
        
        # RECENT SUBMISSIONS
        print(f"\n🔥 RECENT SUBMISSIONS (Last 20)")
        print("-" * width)
        submissions = data.get('recent_submissions', [])
        if isinstance(submissions, list) and len(submissions) > 0:
            print(f"{'Problem':<20} {'Result':<18} {'Language':<15} {'Date':<20}")
            print("-" * width)
            for sub in submissions:
                if isinstance(sub, dict):
                    problem = sub.get('problem_code', 'N/A')[:18]
                    result = sub.get('result', 'N/A')[:16]
                    language = sub.get('language', 'N/A')[:13]
                    date = str(sub.get('date', 'N/A'))[:18]
                    print(f"{problem:<20} {result:<18} {language:<15} {date:<20}")
        else:
            if isinstance(submissions, dict) and 'message' in submissions:
                print(submissions['message'])
            else:
                print("No recent submissions available")
        
        # BADGES
        print(f"\n🏅 BADGES & ACHIEVEMENTS")
        print("-" * width)
        badges = data.get('badges', [])
        if badges and len(badges) > 0:
            for badge in badges:
                if isinstance(badge, dict):
                    if 'message' in badge:
                        print(badge['message'])
                    elif 'error' not in badge:
                        name = badge.get('name', badge.get('alt', 'Unknown Badge'))
                        print(f"  • {name}")
        else:
            print("No badges earned yet")
        
        # PRACTICE STATS
        practice = data.get('practice_stats', {})
        if practice and len(practice) > 0:
            print(f"\n📈 PRACTICE STATISTICS")
            print("-" * width)
            for section, stats in practice.items():
                if isinstance(stats, dict) and section != 'error':
                    print(f"\n  {section}:")
                    for key, value in stats.items():
                        print(f"    {key:<30} : {value}")
        
        # FOOTER
        print("\n" + "=" * width)
        print(f"Data scraped at: {data['scraped_at']}")
        print("=" * width + "\n")


def main():
    print("\n" + "=" * 90)
    print(f"{'CODECHEF COMPREHENSIVE PROFILE SCRAPER':^90}")
    print(f"{'Extracts ALL available user data':^90}")
    print("=" * 90 + "\n")
    
    username = input("📝 Enter CodeChef Username: ").strip()
    
    if not username:
        print("❌ Error: Username cannot be empty!")
        return
    
    print(f"\n🔍 Scraping complete profile data for '{username}'...")
    print("⏳ This may take 10-20 seconds...\n")
    
    scraper = CodeChefScraper()
    profile_data = scraper.get_user_profile(username)
    
    print()
    scraper.display_profile(profile_data)
    
    # Save option
    if "error" not in profile_data:
        save = input("💾 Save data to JSON file? (y/n): ").strip().lower()
        if save == 'y':
            filename = f"codechef_{username}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(profile_data, f, indent=2, ensure_ascii=False)
            print(f"✅ Data successfully saved to: {filename}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Scraping interrupted by user.\n")
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}\n")