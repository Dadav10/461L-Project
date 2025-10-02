from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import certifi

class MongoDB:

    _instances = {}  # Dictionary to store instances by class
    _db_instance = None
    _client_instance = None

    # Replace the uri string with your MongoDB deployment's connection string.
    uri = "mongodb+srv://teamthree:friday@ece461l.38dktsx.mongodb.net/?retryWrites=true&w=majority&appName=ECE461L"

    def __new__(cls, *args, **kwargs):
        # Implementing Singleton pattern per class - each subclass gets its own instance
        # but they all share the same database connection
        if cls not in MongoDB._instances:
            MongoDB._instances[cls] = super().__new__(cls)
        return MongoDB._instances[cls]

    def __init__(self):
        # This __init__ method will only run once due to the Singleton pattern
        if MongoDB._client_instance is None:
            # Create a new client and connect to the server
            MongoDB._client_instance = MongoClient(
                self.uri,
                server_api=ServerApi('1'),
            )

            try:
                # Send a ping to confirm a successful connection
                MongoDB._client_instance.admin.command('ping')
                print("Pinged your deployment. You successfully connected to MongoDB!")
            except Exception as e:
                print(e)

            # Access the database
            MongoDB._db_instance = MongoDB._client_instance.Team_Project

        # Set instance variables to the shared instances
        self.client = MongoDB._client_instance
        self.db = MongoDB._db_instance

    def get_client(self):
        """Return the MongoDB client for child classes to use"""
        return self.client
    
    def get_database(self):
        """Return the database for child classes to use"""
        return self.db

    # # Close the MongoDB connection
    # def close(self):
    #     self.client.close()

    # Base functionality can be accessed by child classes
    # Specific database operations are now handled by specialized child classes


if __name__ == "__main__":
    # Example usage of the base class and inheritance
    # Import the child classes if running this file directly
    try:
        from starter.server.usersDatabase import UsersDatabase
        from starter.server.hardwareDatabase import HardwareDatabase
        from starter.server.projectsDatabase import ProjectsDatabase
        
        # Create instances of the specialized database classes
        users_db = UsersDatabase()
        hardware_db = HardwareDatabase()
        projects_db = ProjectsDatabase()
        
        # Example usage:
        print("Testing Users Database:")
        users_db.addUser("testuser", "user123", "testpassword")
        users_db.login("testuser", "user123", "testpassword")
        
        print("\nTesting Hardware Database:")
        hardware_db.createHardwareSet("Arduino Uno", 100)
        hardware_db.requestSpace("Arduino Uno", 10)
        
        print("\nTesting Projects Database:")
        projects_db.createProject("Test Project", "proj123", "A test project")
        projects_db.addUser("proj123", "user123")
        
    except ImportError as e:
        print(f"Import error: {e}")
        print("Running with base MongoDB class only")
        mongo_db = MongoDB()
        print("MongoDB connection established")