#!/usr/bin/env python3
import requests

def migrate_profiles():
    url = "https://cloudproject-production-55e3.up.railway.app/api/auth/migrate-profiles"

    try:
        print("Calling migration endpoint...")
        response = requests.post(url, headers={"Content-Type": "application/json"})

        if response.status_code == 200:
            result = response.json()
            print(f"Migration successful: {result['message']}")
            print(f"Total users: {result.get('total_users', 'N/A')}")
            print(f"Users updated: {result.get('users_needing_update', 'N/A')}")

            if 'debug_users' in result:
                print("\nUser data:")
                for user in result['debug_users']:
                    print(f"  Email: {user['email']}")
                    print(f"    First: {user['first_name']} | Last: {user['last_name']}")
                    print(f"    Full: {user['full_name']}")
                    print()
        else:
            print(f"Migration failed: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrate_profiles()