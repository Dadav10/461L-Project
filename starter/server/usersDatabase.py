# Import necessary libraries and modules
from mongoDB import MongoDB

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

    def addUser(self, username, userId, password):
        """Add a new user to the database"""
        users_collection = self.db.user_info
        user_data = {
            "username": username,
            "userId": userId,
            "password": password,
            "projects": []
        }

        # Check if the username or userId already exists
        if users_collection.find_one({"$or": [{"username": username}, {"userId": userId}]}):
            print("Username or User ID already exists.")
            return False
        else:
            users_collection.insert_one(user_data)
            print("User added successfully.")
            return True

    def __queryUser(self, username, userId):
        """Helper function to query a user by username and userId"""
        users_collection = self.db.user_info
        user = users_collection.find_one({"username": username, "userId": userId})
        return user

    def login(self, username, userId, password):
        """Authenticate a user and return login status"""
        users_collection = self.db.user_info
        user = users_collection.find_one({"username": username, "userId": userId, "password": password})

        if user:
            print("Login successful.")
            return True
        else:
            print("Invalid credentials.")
            return False

    def joinProject(self, userId, projectId):
        """Add a user to a specified project"""
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
        """Get and return the list of projects a user is part of"""
        users_collection = self.db.user_info
        user = users_collection.find_one({"userId": userId})
        
        if user:
            return user.get("projects", [])
        else:
            print("User not found.")
            return []

