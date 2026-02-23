import os
import sys
import argparse
from dotenv import load_dotenv
from passlib.context import CryptContext
from pymongo import MongoClient


def main() -> int:
    parser = argparse.ArgumentParser(description="Reset a user's password by username")
    parser.add_argument("--username", required=True, help="Username to reset")
    parser.add_argument("--password", required=True, help="New plaintext password")
    args = parser.parse_args()

    # Load environment
    env_file = ".env.local" if os.path.exists(".env.local") else ".env"
    load_dotenv(env_file)

    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB", "bite_tracker_db")

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password_hash = pwd_context.hash(args.password)

    client = MongoClient(mongo_uri)
    db = client[db_name]

    res = db.users.update_one({"username": args.username}, {"$set": {"hashed_password": password_hash}})
    print(f"Matched: {res.matched_count}, Modified: {res.modified_count}")
    if res.matched_count == 0:
        print("No user found with that username.")
        return 2
    if res.modified_count == 0:
        print("User found, but password may already be set to this value.")
        return 1
    print("Password reset successful.")
    return 0


if __name__ == "__main__":
    sys.exit(main())


