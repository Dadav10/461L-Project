from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

class MongoDB:

    _instance = None

    # Replace the uri string with your MongoDB deployment's connection string.
    uri = "mongodb+srv://Calvin:ece461l@ece461l.38dktsx.mongodb.net/?retryWrites=true&w=majority&appName=ECE461L"

    def __new__(cls, *args, **kwargs):
        # Implementing Singleton pattern
        if not cls._instance:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # This __init__ method will only run once due to the Singleton pattern
        if not hasattr(self, '_initialized'): # Prevent re-initialization
            self._initialized = True

            # Create a new client and connect to the server
            self.client = MongoClient(self.uri, server_api=ServerApi('1'))
            try:
                # Send a ping to confirm a successful connection
                self.client.admin.command('ping')
                print("Pinged your deployment. You successfully connected to MongoDB!")
            except Exception as e:
                print(e)

            # Access the database
            self.db = self.client.Team_Project
    
    def new_user(self, username, password):
        users_collection = self.db.user_info
        user_data = {
            "username": username,
            "password": password
        }

        # Check if the username already exists
        if users_collection.find_one({"username": username}):
            print("Username already exists.")
            return False
        else:
            users_collection.insert_one(user_data)
            print("User added successfully.")
            return True

    def sign_in(self, username, password):
        users_collection = self.db.user_info
        user = users_collection.find_one({"username": username, "password": password})
        
        if user:
            print("Sign-in successful.")
            return True
        else:
            print("Invalid username or password.")
            return False