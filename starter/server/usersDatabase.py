# Import necessary libraries and modules
from mongoDB import MongoDB
import uuid

'''
Structure of User entry:
User = {
    'username': username,
    'userId': userId,
    'password': password,
    'projects': [project1_ID, project2_ID, ...]
}
'''

class UsersDatabase(MongoDB):
    def __init__(self):
        super().__init__()

    def addUser(self, username, password, userId=None):
        """Add a new user to the database.

        If userId is not provided, use username as userId.
        Returns the created user dict on success, or None if user exists.
        """
        users_collection = self.db.user_info
        if userId is None:
            userId = username

        # Check if the username or userId already exists
        if users_collection.find_one({"$or": [{"username": username}, {"userId": userId}]}):
            print("Username or User ID already exists.")
            return None

        user_data = {
            "username": username,
            "userId": userId,
            "password": password,
            "projects": []
        }

        users_collection.insert_one(user_data)
        print("User added successfully.")
        # Do not return password to callers
        user_copy = {k: v for k, v in user_data.items() if k != "password"}
        return user_copy

    def __queryUser(self, username=None, userId=None):
        """Helper: query by username or userId"""
        users_collection = self.db.user_info
        query = {}
        if username:
            query["username"] = username
        if userId:
            query["userId"] = userId
        if not query:
            return None
        user = users_collection.find_one(query)
        return user

    def login(self, username, password):
        """Authenticate a user using username and password.

        Returns the user (without password) on success, or None on failure.
        """
        users_collection = self.db.user_info
        user = users_collection.find_one({"username": username, "password": password})
        if user:
            print("Login successful.")
            return {k: v for k, v in user.items() if k != "password"}
        else:
            print("Invalid credentials.")
            return None

    def joinProject(self, userId, projectId):
        """Add a projectId to the user's projects list."""
        users_collection = self.db.user_info
        user = users_collection.find_one({"userId": userId})

        if not user:
            print("User not found.")
            return False

        if projectId in user.get("projects", []):
            print("User already in project.")
            return False

        users_collection.update_one(
            {"userId": userId},
            {"$push": {"projects": projectId}}
        )
        print("User added to project successfully.")
        return True

    def getUserProjectsList(self, userId):
        """Return the list of project IDs a user is part of."""
        users_collection = self.db.user_info
        user = users_collection.find_one({"userId": userId})
        if user:
            return user.get("projects", [])
        else:
            print("User not found.")
            return []

