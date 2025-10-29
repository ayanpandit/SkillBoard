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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def get_user_profile(self, username):
        """Fetch and parse user profile data"""
        try:
            url = f"{self.base_url}/users/{username}"
            response = self.session.get(url, timeout=15)
            
            if response.status_code == 404:
                return {"error": "User not found"}
            elif response.status_code != 200:
                return {"error": f"Failed to fetch profile. Status code: {response.status_code}"}
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract user data
            user_data = {
                "username": username,
                "profile_url": url,
                "basic_info": self._extract_basic_info(soup),
                "ratings": self._extract_ratings(soup),
                "statistics": self._extract_statistics(soup),
                "contest_ratings": self._extract_contest_ratings(soup),
                "recent_activity": self._extract_recent_activity(soup, username),
                "badges": self._extract_badges(soup),
                "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            return user_data
            
        except requests.exceptions.RequestException as e:
            return {"error": f"Network error: {str(e)}"}
        except Exception as e:
            return {"error": f"Parsing error: {str(e)}"}
    
    def _extract_basic_info(self, soup):
        """Extract basic profile information"""
        info = {}
        
        try:
            # Profile header section
            header = soup.find('header', class_='user-details-container')
            if header:
                # Full name
                name_tag = header.find('h1', class_='h2-style')
                info['full_name'] = name_tag.text.strip() if name_tag else "N/A"
                
                # Username
                username_tag = header.find('span', class_='rating')
                if username_tag:
                    info['display_username'] = username_tag.text.strip()
            
            # Profile details section
            details = soup.find('section', class_='user-details')
            if details:
                # Country
                country_tag = details.find('span', class_='user-country-name')
                info['country'] = country_tag.text.strip() if country_tag else "N/A"
                
                # Student/Professional
                org_tag = details.find('span', class_='user-organization')
                info['organization'] = org_tag.text.strip() if org_tag else "N/A"
                
                # Global Rank
                rank_divs = details.find_all('div', class_='rating-number')
                if len(rank_divs) >= 1:
                    info['global_rank'] = rank_divs[0].text.strip()
                if len(rank_divs) >= 2:
                    info['country_rank'] = rank_divs[1].text.strip()
            
            # Stars
            stars_div = soup.find('div', class_='rating-star')
            if stars_div:
                stars = len(stars_div.find_all('span', class_='star'))
                info['stars'] = f"{stars}★"
            
        except Exception as e:
            info['error'] = f"Basic info extraction error: {str(e)}"
        
        return info
    
    def _extract_ratings(self, soup):
        """Extract rating information for different categories"""
        ratings = {}
        
        try:
            # Find rating containers
            rating_containers = soup.find_all('div', class_='rating-header')
            
            for container in rating_containers:
                # Get rating type (Long, Cook-Off, Lunch Time, etc.)
                rating_type_tag = container.find('h3')
                if rating_type_tag:
                    rating_type = rating_type_tag.text.strip()
                    
                    # Get current rating
                    rating_number = container.find('div', class_='rating-number')
                    current_rating = rating_number.text.strip() if rating_number else "N/A"
                    
                    # Get highest rating
                    highest_rating_tag = container.find('small')
                    highest_rating = "N/A"
                    if highest_rating_tag:
                        highest_text = highest_rating_tag.text.strip()
                        highest_match = re.search(r'\d+', highest_text)
                        if highest_match:
                            highest_rating = highest_match.group()
                    
                    ratings[rating_type] = {
                        "current": current_rating,
                        "highest": highest_rating
                    }
        
        except Exception as e:
            ratings['error'] = f"Rating extraction error: {str(e)}"
        
        return ratings
    
    def _extract_statistics(self, soup):
        """Extract problem-solving statistics"""
        stats = {}
        
        try:
            # Problems solved section
            problems_section = soup.find('section', class_='rating-data-section')
            
            if problems_section:
                # Find all stats
                stat_items = problems_section.find_all('article')
                
                for item in stat_items:
                    heading = item.find('h3')
                    value = item.find('h5')
                    
                    if heading and value:
                        key = heading.text.strip()
                        val = value.text.strip()
                        stats[key] = val
            
            # Additional stats from other sections
            contest_section = soup.find('div', class_='contest-participated-count')
            if contest_section:
                stats['contests_participated'] = contest_section.text.strip()
        
        except Exception as e:
            stats['error'] = f"Statistics extraction error: {str(e)}"
        
        return stats
    
    def _extract_contest_ratings(self, soup):
        """Extract contest rating history"""
        contest_data = {}
        
        try:
            # Look for rating graph data (usually in script tags)
            scripts = soup.find_all('script')
            
            for script in scripts:
                if script.string and 'rating_data' in script.string:
                    # Try to extract JSON data
                    match = re.search(r'rating_data\s*=\s*(\[.*?\]);', script.string, re.DOTALL)
                    if match:
                        try:
                            rating_history = json.loads(match.group(1))
                            contest_data['rating_history'] = rating_history[:10]  # Last 10 contests
                            contest_data['total_contests'] = len(rating_history)
                        except:
                            pass
        
        except Exception as e:
            contest_data['error'] = f"Contest ratings extraction error: {str(e)}"
        
        return contest_data
    
    def _extract_recent_activity(self, soup, username):
        """Extract recent submissions and activity"""
        activity = {}
        
        try:
            # Recent submissions can be fetched from API
            api_url = f"{self.base_url}/recent/user"
            params = {'page': 0, 'user': username}
            
            response = self.session.get(api_url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                if 'content' in data:
                    recent_subs = data['content'][:10]  # Last 10 submissions
                    activity['recent_submissions'] = [
                        {
                            'problem_code': sub.get('problemCode', 'N/A'),
                            'result': sub.get('result', 'N/A'),
                            'language': sub.get('language', 'N/A'),
                            'date': sub.get('date', 'N/A')
                        }
                        for sub in recent_subs
                    ]
        
        except Exception as e:
            activity['error'] = f"Activity extraction error: {str(e)}"
        
        return activity
    
    def _extract_badges(self, soup):
        """Extract user badges and achievements"""
        badges = []
        
        try:
            badge_section = soup.find('div', class_='badges')
            if badge_section:
                badge_items = badge_section.find_all('img')
                badges = [
                    {
                        'name': badge.get('alt', 'Unknown'),
                        'image': badge.get('src', '')
                    }
                    for badge in badge_items
                ]
        
        except Exception as e:
            badges = [{"error": f"Badge extraction error: {str(e)}"}]
        
        return badges
    
    def display_profile(self, data):
        """Display profile data in a structured format"""
        if "error" in data:
            print(f"\n❌ ERROR: {data['error']}\n")
            return
        
        print("\n" + "="*80)
        print(f"{'CODECHEF PROFILE':^80}")
        print("="*80 + "\n")
        
        # Basic Information
        print("📋 BASIC INFORMATION")
        print("-" * 80)
        basic = data.get('basic_info', {})
        print(f"Username        : {data['username']}")
        print(f"Full Name       : {basic.get('full_name', 'N/A')}")
        print(f"Country         : {basic.get('country', 'N/A')}")
        print(f"Organization    : {basic.get('organization', 'N/A')}")
        print(f"Stars           : {basic.get('stars', 'N/A')}")
        print(f"Global Rank     : {basic.get('global_rank', 'N/A')}")
        print(f"Country Rank    : {basic.get('country_rank', 'N/A')}")
        print(f"Profile URL     : {data['profile_url']}")
        
        # Ratings
        print("\n⭐ RATINGS")
        print("-" * 80)
        ratings = data.get('ratings', {})
        if ratings:
            for rating_type, values in ratings.items():
                if rating_type != 'error':
                    print(f"{rating_type:20} | Current: {values.get('current', 'N/A'):6} | Highest: {values.get('highest', 'N/A'):6}")
        else:
            print("No rating data available")
        
        # Statistics
        print("\n📊 STATISTICS")
        print("-" * 80)
        stats = data.get('statistics', {})
        if stats:
            for key, value in stats.items():
                if key != 'error':
                    print(f"{key:30} : {value}")
        else:
            print("No statistics available")
        
        # Contest Ratings History
        print("\n🏆 CONTEST HISTORY")
        print("-" * 80)
        contest_data = data.get('contest_ratings', {})
        if 'total_contests' in contest_data:
            print(f"Total Contests Participated: {contest_data['total_contests']}")
            
            if 'rating_history' in contest_data:
                print("\nRecent Contests (Last 10):")
                print(f"{'Contest':<40} {'Rating':<10} {'Rank':<10}")
                print("-" * 60)
                for contest in contest_data['rating_history']:
                    name = contest.get('name', 'N/A')[:38]
                    rating = contest.get('rating', 'N/A')
                    rank = contest.get('rank', 'N/A')
                    print(f"{name:<40} {rating:<10} {rank:<10}")
        else:
            print("No contest history available")
        
        # Recent Activity
        print("\n🔥 RECENT ACTIVITY")
        print("-" * 80)
        activity = data.get('recent_activity', {})
        if 'recent_submissions' in activity:
            print(f"{'Problem Code':<15} {'Result':<15} {'Language':<15} {'Date':<20}")
            print("-" * 65)
            for sub in activity['recent_submissions']:
                print(f"{sub['problem_code']:<15} {sub['result']:<15} {sub['language']:<15} {sub['date']:<20}")
        else:
            print("No recent activity available")
        
        # Badges
        print("\n🏅 BADGES & ACHIEVEMENTS")
        print("-" * 80)
        badges = data.get('badges', [])
        if badges and len(badges) > 0:
            for badge in badges:
                if 'error' not in badge:
                    print(f"• {badge.get('name', 'Unknown Badge')}")
        else:
            print("No badges earned yet")
        
        print("\n" + "="*80)
        print(f"Scraped at: {data['scraped_at']}")
        print("="*80 + "\n")


def main():
    print("\n" + "="*80)
    print(f"{'CODECHEF PROFILE SCRAPER':^80}")
    print("="*80 + "\n")
    
    username = input("Enter CodeChef Username: ").strip()
    
    if not username:
        print("❌ Username cannot be empty!")
        return
    
    print(f"\n🔍 Fetching profile for '{username}'...\n")
    
    scraper = CodeChefScraper()
    profile_data = scraper.get_user_profile(username)
    scraper.display_profile(profile_data)
    
    # Option to save data
    save = input("\nDo you want to save this data to a JSON file? (y/n): ").strip().lower()
    if save == 'y':
        filename = f"{username}_codechef_profile.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(profile_data, f, indent=4, ensure_ascii=False)
        print(f"✅ Data saved to {filename}")


if __name__ == "__main__":
    main()