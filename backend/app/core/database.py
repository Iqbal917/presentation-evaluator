from pymongo import MongoClient
from decouple import config
import logging

# Configuration
MONGODB_URL = config("MONGODB_URL")
DATABASE_NAME = config("DATABASE_NAME", default="presentation_evaluator")

# Global database connection
client = None
database = None

def connect_to_mongo():
    """Create database connection"""
    global client, database
    try:
        client = MongoClient(MONGODB_URL)
        database = client[DATABASE_NAME]
        
        # Test the connection
        database.command('ping')
        print(f"Connected to MongoDB: {DATABASE_NAME}")
        
        # Create indexes
        database.users.create_index("email", unique=True)
        
        return database
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise

def get_database():
    """Get database instance"""
    global database
    if database is None:
        database = connect_to_mongo()
    return database

def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()
