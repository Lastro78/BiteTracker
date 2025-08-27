#!/usr/bin/env python3
"""
Migration script to add user_id to existing catch records.
Run this after deploying the authentication system to production.
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
MONGO_URL = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "bite_tracker_db")

async def migrate_existing_data():
    """Add user_id to existing catch records"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    catches_collection = db.catches
    users_collection = db.users
    
    try:
        print("🔍 Starting data migration...")
        
        # Check if we have any users
        user_count = await users_collection.count_documents({})
        if user_count == 0:
            print("❌ No users found. Please create at least one user first.")
            return
        
        # Get the first user (or you can specify a particular user)
        first_user = await users_collection.find_one({})
        if not first_user:
            print("❌ No users found in database")
            return
        
        user_id = str(first_user["_id"])
        print(f"✅ Using user ID: {user_id}")
        
        # Find all catches without user_id
        catches_without_user = catches_collection.find({"user_id": {"$exists": False}})
        
        update_count = 0
        async for catch in catches_without_user:
            # Add user_id to the catch
            await catches_collection.update_one(
                {"_id": catch["_id"]},
                {"$set": {"user_id": user_id}}
            )
            update_count += 1
            
            if update_count % 10 == 0:
                print(f"📝 Updated {update_count} records...")
        
        print(f"✅ Migration complete! Updated {update_count} catch records.")
        
        # Verify migration
        total_catches = await catches_collection.count_documents({})
        catches_with_user = await catches_collection.count_documents({"user_id": {"$exists": True}})
        
        print(f"📊 Total catches: {total_catches}")
        print(f"📊 Catches with user_id: {catches_with_user}")
        
        if total_catches == catches_with_user:
            print("✅ All catches now have user_id!")
        else:
            print(f"⚠️  {total_catches - catches_with_user} catches still missing user_id")
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    print("🚀 BiteTracker Data Migration Script")
    print("=" * 40)
    
    # Run the migration
    asyncio.run(migrate_existing_data())
    
    print("\n📋 Migration script completed!")
    print("\nNext steps:")
    print("1. Test the application with the migrated data")
    print("2. Verify that all catches are associated with the correct user")
    print("3. Create additional users as needed")
    print("4. Consider deleting this script after successful migration")
