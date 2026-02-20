import os
from dotenv import load_dotenv
from pymongo import MongoClient

env_file = ".env.local" if os.path.exists(".env.local") else ".env"
load_dotenv(env_file)

mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
db_name = os.getenv("MONGODB_DB", "bite_tracker_db")

client = MongoClient(mongo_uri)
db = client[db_name]

print("Usernames in database (first 50):")
for doc in db.users.find({}, {"username": 1}).limit(50):
    print("-", doc.get("username"))


