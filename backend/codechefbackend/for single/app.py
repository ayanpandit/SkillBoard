from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re
import json
import time

app = Flask(__name__)
CORS(app)

# In-memory cache to store scraped data
profile_cache = {}
CACHE_DURATION = 3600  # 1 hour in seconds

def scrape_codechef_profile(username):
    url = f"https://www.codechef.com/users/{username}"
    
    # More realistic headers that mimic a real browser
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Ch-Ua": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "DNT": "1",
        "Connection": "keep-alive"
    }
    
    try:
        # Add a longer timeout and retry mechanism
        import time
        
        # Try multiple times with slight delays
        for attempt in range(3):
            try:
                response = requests.get(url, headers=headers, timeout=15)
                
                if response.status_code == 200:
                    break
                    
                # If we get blocked, wait a bit and try again
                if response.status_code in [429, 403, 503]:
                    time.sleep(2 * (attempt + 1))  # Progressive delay
                    continue
                    
            except requests.exceptions.Timeout:
                if attempt < 2:  # Don't wait on the last attempt
                    time.sleep(1)
                    continue
                else:
                    return {"error": f"Request timeout for username '{username}'. CodeChef might be slow."}
            except requests.exceptions.RequestException as e:
                if attempt < 2:
                    time.sleep(1)
                    continue
                else:
                    return {"error": f"Network error: {str(e)}"}
        
        if response.status_code != 200:
            return {"error": f"Unable to fetch profile for '{username}'. HTTP Status: {response.status_code}"}
        
        # Log the response for debugging (remove this in production)
        print(f"DEBUG: Response status: {response.status_code}")
        print(f"DEBUG: Response length: {len(response.text)}")
        print(f"DEBUG: First 500 chars: {response.text[:500]}")
        
        soup = BeautifulSoup(response.text, "html.parser")
        page_text = response.text

        # 1. Name (working - keep as is)
        name_tag = soup.find("h1", class_="h2-style")
        name = name_tag.text.strip() if name_tag else "N/A"

        # 2. Username (working - keep as is)
        username_tag = soup.find("h3", class_="h4-style")
        username_text = username_tag.text.strip() if username_tag else username

        # 4. Current Rating (working - keep as is)
        rating_tag = soup.find("div", class_="rating-number")
        rating = rating_tag.text.strip() if rating_tag else "N/A"

        # 3. Star rating - enhanced search
        star = "N/A"
        try:
            # Method 1: Extract star from username text if it exists as prefix
            star_match = re.match(r"(\d+★)", username_text)
            if star_match:
                star = star_match.group(1)
            else:
                # Method 2: Look for rating-star class and related elements
                star_selectors = [
                    ("span", {"class": "rating-star"}),
                    ("div", {"class": "rating-star"}),
                    ("span", {"class": "star-rating"}),
                    ("div", {"class": "user-star"})
                ]
                
                for tag, attrs in star_selectors:
                    try:
                        star_elem = soup.find(tag, attrs)
                        if star_elem and star_elem.text.strip():
                            star_text = star_elem.text.strip()
                            if "★" in star_text or "star" in star_text.lower():
                                star = star_text
                                break
                    except:
                        continue
                
                # Method 3: Calculate star from rating (CodeChef star system)
                if star == "N/A" and rating != "N/A":
                    try:
                        rating_num = int(rating)
                        if rating_num >= 2000:
                            star = "6★"
                        elif rating_num >= 1800:
                            star = "5★" 
                        elif rating_num >= 1600:
                            star = "4★"
                        elif rating_num >= 1400:
                            star = "3★"
                        elif rating_num >= 1200:
                            star = "2★"
                        elif rating_num >= 1000:
                            star = "1★"
                        else:
                            star = "0★"
                    except ValueError:
                        pass
                
                # Method 4: Search in page text for star patterns
                if star == "N/A":
                    star_patterns = [
                        r'(\d+)★',
                        r'(\d+)\s*star',
                        r'star[s]?\s*[:\-]?\s*(\d+)',
                        r'rating.*?(\d+)★',
                        r'(\d+)\s*\*'  # Sometimes * is used instead of ★
                    ]
                    for pattern in star_patterns:
                        try:
                            match = re.search(pattern, page_text, re.IGNORECASE)
                            if match:
                                star_num = match.group(1)
                                star = f"{star_num}★"
                                break
                        except:
                            continue
        except Exception:
            star = "N/A"

        # 5. Country - ENHANCED FIX for the "beginner to" issue
        country = "N/A"
        try:
            # Method 1: Look for JSON data that might contain country info
            json_patterns = [
                r'"country"\s*:\s*"([^"]+)"',
                r'"countryName"\s*:\s*"([^"]+)"',
                r'"location"\s*:\s*"([^"]+)"'
            ]
            
            for pattern in json_patterns:
                try:
                    match = re.search(pattern, page_text, re.IGNORECASE)
                    if match:
                        potential_country = match.group(1).strip()
                        if (len(potential_country) >= 2 and len(potential_country) <= 25 and 
                            potential_country not in ["N/A", "null", "undefined", "beginner", "to", "beginner to"]):
                            country = potential_country
                            break
                except:
                    continue
            
            # Method 2: Enhanced user-details search with better filtering
            if country == "N/A":
                user_details = soup.find_all("li", class_="user-details__item")
                for detail in user_details:
                    try:
                        detail_text = detail.get_text()
                        # Look for text that contains "Country" but filter out unwanted parts
                        if "Country" in detail_text:
                            # Split by common separators and clean
                            parts = re.split(r'Country[:\-\s]*', detail_text, flags=re.IGNORECASE)
                            if len(parts) > 1:
                                country_part = parts[1].strip()
                                # Remove rank information and numbers
                                country_part = re.sub(r'\s*Rank.*$', '', country_part, flags=re.IGNORECASE)
                                country_part = re.sub(r'\s*\d+.*$', '', country_part)
                                country_part = re.sub(r'^[:\-\s]+', '', country_part)
                                # Filter out common unwanted terms
                                unwanted_terms = ['beginner', 'to', 'rank', 'global', 'rating', 'n/a']
                                if (country_part and len(country_part) >= 2 and len(country_part) <= 25 and
                                    country_part.lower() not in unwanted_terms and
                                    not country_part.lower().startswith('beginner')):
                                    # Check if it's mostly alphabetic (allowing spaces)
                                    if re.match(r'^[a-zA-Z\s]+$', country_part):
                                        country = country_part.strip()
                                        break
                    except:
                        continue
            
            # Method 3: Look in profile sections with class patterns
            if country == "N/A":
                profile_sections = soup.find_all(['div', 'span', 'p'], class_=re.compile(r'.*country.*|.*location.*|.*profile.*', re.I))
                for section in profile_sections:
                    try:
                        section_text = section.get_text().strip()
                        if section_text and len(section_text) >= 2 and len(section_text) <= 25:
                            # Filter out numbers and unwanted terms
                            if (re.match(r'^[a-zA-Z\s]+$', section_text) and 
                                section_text.lower() not in ['beginner to', 'country', 'location', 'profile']):
                                country = section_text
                                break
                    except:
                        continue
            
            # Method 4: Enhanced pattern matching with better validation
            if country == "N/A":
                country_patterns = [
                    r'Country[:\s]*([A-Za-z\s]{3,25})(?:\s*</|$|\n)',
                    r'Location[:\s]*([A-Za-z\s]{3,25})(?:\s*</|$|\n)',
                    r'from\s+([A-Za-z\s]{3,25})(?:\s*</|$|\n)',
                ]
                for pattern in country_patterns:
                    try:
                        match = re.search(pattern, page_text, re.IGNORECASE | re.MULTILINE)
                        if match:
                            potential_country = match.group(1).strip()
                            # Clean and validate
                            potential_country = re.sub(r'\s+', ' ', potential_country)  # normalize spaces
                            unwanted = ['beginner', 'to', 'beginner to', 'rank', 'global', 'rating', 'country', 'location']
                            if (len(potential_country) >= 3 and len(potential_country) <= 25 and 
                                potential_country.replace(' ', '').isalpha() and 
                                potential_country.lower() not in unwanted and
                                not any(unwanted_term in potential_country.lower() for unwanted_term in unwanted)):
                                country = potential_country
                                break
                    except:
                        continue
        except Exception:
            country = "N/A"

        # 6. Highest Rating - 
        highest_rating = "N/A"
        try:
            # Method 1: Existing approach
            hr_label = soup.find(string=lambda text: text and "Highest Rating" in text)
            if hr_label:
                try:
                    hr_container = hr_label.find_parent()
                    if hr_container:
                        hr_value = hr_container.find("div", class_="rating-number")
                        if hr_value and hr_value.text.strip():
                            highest_rating = hr_value.text.strip()
                except:
                    pass
            
            if highest_rating == "N/A":
                # Method 2: Look for highest rating in different structures
                highest_rating_tag = soup.find("div", class_="rating-label", string=re.compile("Highest Rating"))
                if highest_rating_tag:
                    try:
                        sibling = highest_rating_tag.find_next_sibling("div", class_="rating-number")
                        if sibling:
                            highest_rating = sibling.text.strip()
                    except:
                        pass
                
                # Method 3: Pattern matching in page text
                if highest_rating == "N/A":
                    hr_patterns = [
                        r'Highest\s+Rating[:\s]+(\d{3,4})',
                        r'highest["\s]*:["\s]*(\d{3,4})',
                        r'max.*?rating[:\s]+(\d{3,4})',
                        r'peak.*?rating[:\s]+(\d{3,4})'
                    ]
                    for pattern in hr_patterns:
                        try:
                            match = re.search(pattern, page_text, re.IGNORECASE)
                            if match:
                                highest_rating = match.group(1)
                                break
                        except:
                            continue
        except Exception:
            highest_rating = "N/A"

        # 7. Global Rank 
        global_rank = "N/A"
        try:
            gr_label = soup.find(string=lambda text: text and "Global Rank" in text)
            if gr_label:
                try:
                    global_rank = gr_label.find_next("strong").text.strip()
                except:
                    pass
        except Exception:
            global_rank = "N/A"

        # 8. Country Rank  
        country_rank = "N/A"
        try:
            # Method 1: Existing approach
            cr_label = soup.find(string=lambda text: text and "Country Rank" in text)
            if cr_label:
                try:
                    country_rank = cr_label.find_next("strong").text.strip()
                except:
                    pass
            
            if country_rank == "N/A":
                # Method 2: Search in various structures
                cr_patterns = [
                    r'Country\s+Rank[:\s]+(\d+)',
                    r'country.*?rank[:\s]+(\d+)',
                    r'rank.*?country[:\s]+(\d+)',
                    r'"countryRank"\s*:\s*(\d+)'
                ]
                for pattern in cr_patterns:
                    try:
                        match = re.search(pattern, page_text, re.IGNORECASE)
                        if match:
                            country_rank = match.group(1)
                            break
                    except:
                        continue
                
                # Method 3: Look for rank elements
                if country_rank == "N/A":
                    try:
                        rank_elements = soup.find_all(string=re.compile("rank", re.I))
                        for elem in rank_elements:
                            if "country" in str(elem).lower():
                                # Try to find number after this text
                                parent = elem.parent if hasattr(elem, 'parent') else None
                                if parent:
                                    numbers = re.findall(r'\d+', parent.get_text())
                                    if numbers:
                                        country_rank = numbers[0]
                                        break
                    except:
                        pass
        except Exception:
            country_rank = "N/A"

        # 9. Number of Contests Participated - SIMPLIFIED AND FIXED
        contests_participated = "N/A"
        try:
            # Method 1: Most reliable - look for specific text patterns that CodeChef uses
            contest_patterns = [
                r'Contests?\s+Participated[:\s]*(\d+)',
                r'No\.?\s*of\s+Contests?\s+Participated[:\s]*(\d+)',
                r'Total\s+Contests?\s*[:\s]*(\d+)',
                r'"totalContests"\s*:\s*(\d+)',
                r'"contestsParticipated"\s*:\s*(\d+)',
                r'participated\s+in\s*[:\s]*(\d+)\s*contest',
                r'Contest\s*History.*?(\d+)\s*contest',
            ]
            
            for pattern in contest_patterns:
                try:
                    match = re.search(pattern, page_text, re.IGNORECASE | re.DOTALL)
                    if match:
                        potential_contests = int(match.group(1))
                        # Reasonable range check for contests (1-500)
                        if 1 <= potential_contests <= 500:
                            contests_participated = str(potential_contests)
                            break
                except:
                    continue
            
            # Method 2: Look for contest table rows (more reliable than complex parsing)
            if contests_participated == "N/A":
                try:
                    # Find tables that might contain contest history
                    tables = soup.find_all('table')
                    for table in tables:
                        table_text = table.get_text().lower()
                        # Check if this looks like a contest history table
                        if any(keyword in table_text for keyword in ['contest', 'rating', 'rank', 'date', 'performance']):
                            rows = table.find_all('tr')
                            if len(rows) > 1:  # Has header + data rows
                                contest_count = len(rows) - 1  # Subtract header row
                                if 1 <= contest_count <= 200:  # Reasonable range
                                    contests_participated = str(contest_count)
                                    break
                except:
                    pass
            
            # Method 3: Fallback - look for any reasonable contest count in contest-related sections
            if contests_participated == "N/A":
                try:
                    contest_sections = soup.find_all(['div', 'section'], 
                                                   class_=re.compile(r'.*contest.*|.*history.*|.*rating.*', re.I))
                    
                    for section in contest_sections:
                        section_text = section.get_text()
                        # Find numbers that might represent contest count
                        numbers = re.findall(r'\b(\d+)\b', section_text)
                        for num_str in numbers:
                            try:
                                num = int(num_str)
                                # Look for a reasonable contest count
                                if 1 <= num <= 100:  # Conservative range
                                    # Check if this number appears in contest context
                                    if any(keyword in section_text.lower() 
                                          for keyword in ['contest', 'participated', 'history']):
                                        contests_participated = num_str
                                        break
                            except:
                                continue
                        if contests_participated != "N/A":
                            break
                except:
                    pass
            
        except Exception:
            contests_participated = "N/A"

        # 10. Total Problems Solved 
        problems_solved = "N/A"
        try:
            solved_span = soup.find(string=lambda text: text and "Total Problems Solved" in text)
            if solved_span:
                try:
                    problems_solved = solved_span.split(":")[-1].strip()
                except:
                    pass
            else:
                # fallback pattern
                ps_pattern = re.compile(r"Total Problems Solved[: ]+(\d+)")
                ps_match = ps_pattern.search(response.text)
                if ps_match:
                    problems_solved = ps_match.group(1)
        except Exception:
            problems_solved = "N/A"

        # Clean up numerical values
        def clean_number(value):
            try:
                if value == "N/A":
                    return value
                # Remove any non-numeric characters except the star symbol
                cleaned = re.sub(r'[^\d★]', '', str(value))
                if cleaned and cleaned != "★":
                    return cleaned
                return "N/A"
            except:
                return "N/A"

        # Clean numerical fields
        try:
            if rating != "N/A":
                rating = clean_number(rating)
            if highest_rating != "N/A":
                highest_rating = clean_number(highest_rating)
            if global_rank != "N/A":
                global_rank = clean_number(global_rank)
            if country_rank != "N/A":
                country_rank = clean_number(country_rank)
            if contests_participated != "N/A":
                contests_participated = clean_number(contests_participated)
            if problems_solved != "N/A":
                problems_solved = clean_number(problems_solved)
        except Exception:
            pass

        # Return the data as dictionary
        return {
            "success": True,
            "name": name,
            "username": username_text,
            "star": star,
            "country": country,
            "current_rating": rating,
            "highest_rating": highest_rating,
            "global_rank": global_rank,
            "country_rank": country_rank,
            "contests_participated": contests_participated,
            "problems_solved": problems_solved
        }

    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {e}"}
    except Exception as e:
        return {"error": f"An error occurred: {e}"}

@app.route('/api/profile/<username>')
def get_profile(username):
    # Check cache first
    cache_key = username.lower()
    current_time = time.time()
    
    if cache_key in profile_cache:
        cached_data, timestamp = profile_cache[cache_key]
        if current_time - timestamp < CACHE_DURATION:
            return jsonify(cached_data)
    
    # Scrape new data
    profile_data = scrape_codechef_profile(username)
    
    # Cache the result
    if "success" in profile_data:
        profile_cache[cache_key] = (profile_data, current_time)
    
    return jsonify(profile_data)

# Add a health check endpoint for Render
@app.route('/')
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "CodeChef Profile Analyzer API is running",
        "endpoints": {
            "profile": "/api/profile/<username>",
            "example": "/api/profile/gennady",
            "debug": "/debug/<username>"
        }
    })

# Debug endpoint to test raw HTML response
@app.route('/debug/<username>')
def debug_profile(username):
    url = f"https://www.codechef.com/users/{username}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    try:
        import requests
        response = requests.get(url, headers=headers, timeout=15)
        return jsonify({
            "status_code": response.status_code,
            "content_length": len(response.text),
            "headers": dict(response.headers),
            "first_1000_chars": response.text[:1000],
            "url": url,
            "request_headers": headers
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "url": url,
            "request_headers": headers
        })

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=port)