"""
Test Script for CodeChef Bulk Search Fix
Run this to verify the backend changes are working correctly
"""

import requests
import time
import json

# Test configuration
BASE_URL = "https://codechef-d657.onrender.com"  # Change to your backend URL
TEST_USERNAMES = [
    "aayanpandey",
    "hawkadarsh3908", 
    "gennady.korotkevich",
    "tourist",
    "user_not_exists_123"  # This should fail gracefully
]

def test_single_endpoint():
    """Test single user endpoint (should NOT have backend rate limiting)"""
    print("\n" + "="*60)
    print("🧪 TEST 1: Single User Endpoint (No Backend Rate Limiting)")
    print("="*60)
    
    start_time = time.time()
    
    for i, username in enumerate(TEST_USERNAMES, 1):
        print(f"\n[{i}/{len(TEST_USERNAMES)}] Testing: {username}")
        
        request_start = time.time()
        try:
            response = requests.get(
                f"{BASE_URL}/api/codechef",
                params={"username": username},
                timeout=45
            )
            request_time = time.time() - request_start
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') or data.get('rating'):
                    print(f"  ✅ Success in {request_time:.2f}s")
                    print(f"     Rating: {data.get('rating', 'N/A')}")
                    print(f"     Name: {data.get('full_name', 'N/A')}")
                else:
                    print(f"  ⚠️  User not found in {request_time:.2f}s")
                    print(f"     Error: {data.get('error', 'Unknown')}")
            else:
                print(f"  ❌ HTTP {response.status_code} in {request_time:.2f}s")
                
        except requests.exceptions.Timeout:
            request_time = time.time() - request_start
            print(f"  ❌ TIMEOUT after {request_time:.2f}s")
        except Exception as e:
            request_time = time.time() - request_start
            print(f"  ❌ Error in {request_time:.2f}s: {str(e)}")
    
    total_time = time.time() - start_time
    print(f"\n📊 Total time: {total_time:.2f}s")
    print(f"📊 Average per request: {total_time/len(TEST_USERNAMES):.2f}s")
    
    if total_time/len(TEST_USERNAMES) < 2:
        print("✅ PASS: Backend rate limiting is disabled (fast responses)")
    else:
        print("⚠️  WARNING: Responses seem slow, backend might still be rate limiting")

def test_response_time_comparison():
    """Compare response times to verify rate limiting is removed"""
    print("\n" + "="*60)
    print("🧪 TEST 2: Response Time Analysis")
    print("="*60)
    
    test_username = TEST_USERNAMES[0]
    times = []
    
    print(f"\nMaking 3 rapid requests to test rate limiting...")
    
    for i in range(3):
        start = time.time()
        try:
            response = requests.get(
                f"{BASE_URL}/api/codechef",
                params={"username": test_username},
                timeout=45
            )
            elapsed = time.time() - start
            times.append(elapsed)
            print(f"  Request {i+1}: {elapsed:.2f}s")
        except Exception as e:
            print(f"  Request {i+1}: Failed - {str(e)}")
    
    if times:
        avg_time = sum(times) / len(times)
        print(f"\n📊 Average response time: {avg_time:.2f}s")
        
        if avg_time < 1.5:
            print("✅ PASS: No backend rate limiting detected")
        elif avg_time < 3:
            print("⚠️  CAUTION: Moderate delays detected")
        else:
            print("❌ FAIL: Backend rate limiting still active")

def test_bulk_endpoint():
    """Test bulk endpoint (should KEEP rate limiting)"""
    print("\n" + "="*60)
    print("🧪 TEST 3: Bulk Endpoint (Should Keep Rate Limiting)")
    print("="*60)
    
    start_time = time.time()
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/codechef/bulk",
            json={"usernames": TEST_USERNAMES[:3]},  # Test with 3 users
            timeout=60
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Bulk endpoint works")
            print(f"📊 Time: {elapsed:.2f}s for {len(TEST_USERNAMES[:3])} users")
            print(f"📊 Summary: {data.get('summary', {})}")
            
            if elapsed > 5:
                print("✅ Rate limiting appears active (good for bulk)")
            else:
                print("⚠️  Surprisingly fast - rate limiting might be disabled")
        else:
            print(f"❌ HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🔧 CodeChef Backend Fix Verification")
    print("="*60)
    print(f"Target: {BASE_URL}")
    print("="*60)
    
    try:
        # Quick connectivity check
        response = requests.get(f"{BASE_URL}/api/codechef?username=test", timeout=5)
        print("✅ Backend is reachable")
    except Exception as e:
        print(f"❌ Cannot reach backend: {str(e)}")
        print("\nPlease ensure:")
        print("1. Backend is running (python sb.py)")
        print("2. BASE_URL is correct in this script")
        return
    
    # Run tests
    test_single_endpoint()
    time.sleep(2)
    test_response_time_comparison()
    time.sleep(2)
    test_bulk_endpoint()
    
    print("\n" + "="*60)
    print("✅ Testing Complete")
    print("="*60)
    print("\nExpected Results:")
    print("• Single endpoint: Fast (<2s per request)")
    print("• No backend rate limiting on single requests")
    print("• Bulk endpoint: Still has rate limiting (slower)")
    print("\nIf tests pass, deploy to production!")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
