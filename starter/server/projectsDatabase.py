# Import necessary libraries and modules
from mongoDB import MongoDB
from hardwareDatabase import HardwareDatabase

'''
Structure of Project entry:
Project = {
    'projectName': projectName,
    'projectId': projectId,
    'description': description,
    'hwSets': {HW1: 0, HW2: 10, ...},
    'users': [user1, user2, ...]
}
'''

class ProjectsDatabase(MongoDB):
    def __init__(self):
        super().__init__()
        self.hardware_db = HardwareDatabase()

    def queryProject(self, projectId):
        """Query and return a project from the database"""
        projects_collection = self.db.projects
        project = projects_collection.find_one({"projectId": projectId})
        return project

    def createProject(self, projectName, projectId, description):
        """Create a new project in the database"""
        projects_collection = self.db.projects
        project_data = {
            "projectName": projectName,
            "projectId": projectId,
            "description": description,
            "hwSets": {},
            "users": []
        }

        # Check if the project_id already exists
        if projects_collection.find_one({"projectId": projectId}):
            print("Project ID already exists.")
            return False
        
        projects_collection.insert_one(project_data)
        print("Project created successfully.")
        return True

    def addUser(self, projectId, userId):
        """Add a user to the specified project"""
        projects_collection = self.db.projects
        project = projects_collection.find_one({"projectId": projectId})
        
        if not project:
            print("Project not found.")
            return False
            
        if userId in project.get("users", []):
            print("User already in project.")
            return False
            
        projects_collection.update_one(
            {"projectId": projectId},
            {"$push": {"users": userId}}
        )
        print("User added to project successfully.")
        return True

    def updateUsage(self, projectId, hwSetName, amount):
        """Update the usage of a hardware set in the specified project"""
        projects_collection = self.db.projects
        project = projects_collection.find_one({"projectId": projectId})
        
        if not project:
            print("Project not found.")
            return False
            
        current_usage = project.get("hwSets", {}).get(hwSetName, 0)
        new_usage = current_usage + amount
        
        if new_usage < 0:
            print("Cannot have negative usage.")
            return False
            
        projects_collection.update_one(
            {"projectId": projectId},
            {"$set": {f"hwSets.{hwSetName}": new_usage}}
        )
        print("Hardware usage updated successfully.")
        return True

    def checkOutHW(self, projectId, hwSetName, qty, userId):
        """Check out hardware for the specified project and update availability"""
        # First check if the project exists and user is part of it
        project = self.queryProject(projectId)
        if not project:
            print("Project not found.")
            return False
            
        if userId not in project.get("users", []):
            print("User not authorized for this project.")
            return False
            
        # Check if hardware is available
        if not self.hardware_db.requestSpace(hwSetName, qty):
            return False
            
        # Update project's hardware usage
        if not self.updateUsage(projectId, hwSetName, qty):
            # Rollback hardware request if project update fails
            hardware_set = self.hardware_db.queryHardwareSet(hwSetName)
            if hardware_set:
                self.hardware_db.updateAvailability(hwSetName, hardware_set["availability"] + qty)
            return False
            
        print("Hardware checked out successfully.")
        return True

    def checkInHW(self, projectId, hwSetName, qty, userId):
        """Check in hardware for the specified project and update availability"""
        # First check if the project exists and user is part of it
        project = self.queryProject(projectId)
        if not project:
            print("Project not found.")
            return False
            
        if userId not in project.get("users", []):
            print("User not authorized for this project.")
            return False
            
        # Check if project has enough hardware to check in
        current_usage = project.get("hwSets", {}).get(hwSetName, 0)
        if current_usage < qty:
            print("Cannot check in more hardware than currently used.")
            return False
            
        # Update project's hardware usage (decrease)
        if not self.updateUsage(projectId, hwSetName, -qty):
            return False
            
        # Return hardware to availability
        hardware_set = self.hardware_db.queryHardwareSet(hwSetName)
        if hardware_set:
            new_availability = hardware_set["availability"] + qty
            if not self.hardware_db.updateAvailability(hwSetName, new_availability):
                # Rollback project update if hardware update fails
                self.updateUsage(projectId, hwSetName, qty)
                return False
                
        print("Hardware checked in successfully.")
        return True

