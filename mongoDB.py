from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import certifi

class MongoDB:

    _instance = None

    # Replace the uri string with your MongoDB deployment's connection string.
    uri = "mongodb+srv://teamthree:friday@ece461l.38dktsx.mongodb.net/?retryWrites=true&w=majority&appName=ECE461L"

    def __new__(cls, *args, **kwargs):
        # Implementing Singleton pattern
        if not cls._instance:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # This __init__ method will only run once due to the Singleton pattern
        if not hasattr(self, '_initialized'): # Prevent re-initialization
            self._initialized = True

            # Create a new client and connect to the server with explicit CA bundle
            self.client = MongoClient(
                self.uri,
                server_api=ServerApi('1'),
                tls=True,
                tlsCAFile=certifi.where(),
                tlsAllowInvalidCertificates=True,
            )
            try:
                # Send a ping to confirm a successful connection
                self.client.admin.command('ping')
                print("Pinged your deployment. You successfully connected to MongoDB!")
            except Exception as e:
                print(e)

            # Access the database
            self.db = self.client.Team_Project


    '''
        Creates a new user.
        username: Username of the new user
        password: Password of the new user
    '''
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


    '''
        Signs in a user by verifying username and password.
        username: Username of the user
        password: Password of the user
    '''
    def sign_in(self, username, password):
        users_collection = self.db.user_info
        user = users_collection.find_one({"username": username, "password": password})

        if user:
            print("Sign-in successful.")
            return True
        else:
            print("Invalid username or password.")
            return False


    '''
        Searches for projects by name or ID.
        project_name: Name of the project to search for (optional)
        project_id: ID of the project to search for (optional)
    '''
    def project_search(self, project_name = None, project_id = None):
        projects_collection = self.db.projects
        query = {}
        if project_name:
            query["project_name"] = project_name
        if project_id:
            query["project_id"] = project_id

        results = projects_collection.find(query)
        return list(results)


    '''
        Creates a new project.
        project_name: Name of the project
        description: Description of the project
        project_id: Unique ID for the project
    '''
    def create_project(self, project_name, description, project_id):
        projects_collection = self.db.projects
        project_data = {
            "project_name": project_name,
            "description": description,
            "project_id": project_id
        }

        # Check if the project_id already exists
        if projects_collection.find_one({"project_id": project_id}):
            print("Project ID already exists.")
            return None
        
        result = projects_collection.insert_one(project_data)
        return result.inserted_id


    '''
        Adds a resource to a project.
        project_id: ID of the project
        resource: Name of the resource
        capacity: Total capacity of the resource
        available: Currently available amount of the resource
    '''
    def add_resource(self, project_id, resource, capacity, available):
        resources_collection = self.db.resources
        resource_data = {
            "project_id": project_id,
            "resource": resource,
            "capacity": capacity,
            "available": available
        }

        # Check if the resource already exists for the project
        if resources_collection.find_one({"project_id": project_id, "resource": resource}):
            print("Resource already exists for this project.")
            return None

        result = resources_collection.insert_one(resource_data)
        return result.inserted_id
    

    ''' 
        Manages resources for a project.
        project_id: ID of the project
        resource: Name of the resource
        amount: Positive to check in, negative to check out
    '''
    def resource_management(self, project_id, resource, amount):
        resources_collection = self.db.resources
        resource_entry = resources_collection.find_one({"project_id": project_id, "resource": resource})

        if not resource_entry:
            print("Resource not found for this project.")
            return False

        # if amount is negative, check out resources
        if amount < 0:
            if resource_entry["available"] + amount < 0:
                print("Not enough resources available.")
                return False
            
            resources_collection.update_one(
                {"project_id": project_id, "resource": resource},
                {"$inc": {"available": amount}})   

        else: # if amount is positive, check in resources
            if resource_entry["available"] + amount > resource_entry["capacity"]:
                print("Cannot check in more than capacity.")
                return False
            
            resources_collection.update_one(
                {"project_id": project_id, "resource": resource},
                {"$inc": {"available": amount}})         
        
        print("Resource updated successfully.")
        return True


if __name__ == "__main__":
    mongo_db = MongoDB()
    # Example usage:
    mongo_db.new_user("testuser", "testpassword")
    mongo_db.sign_in("testuser", "testpassword")