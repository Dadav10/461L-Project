# Import necessary libraries and modules
from mongoDB import MongoDB

'''
Structure of Hardware Set entry:
HardwareSet = {
    'hwName': hwSetName,
    'capacity': initCapacity,
    'availability': initCapacity
}
'''

class HardwareDatabase(MongoDB):
    def __init__(self):
        super().__init__()

    def createHardwareSet(self, hwSetName, initCapacity):
        """Create a new hardware set in the database"""
        hardware_collection = self.db.hardware_sets
        hardware_data = {
            "hwName": hwSetName,
            "capacity": initCapacity,
            "availability": initCapacity
        }

        # Check if the hardware set already exists
        if hardware_collection.find_one({"hwName": hwSetName}):
            print("Hardware set already exists.")
            return False
        else:
            hardware_collection.insert_one(hardware_data)
            print("Hardware set created successfully.")
            return True

    def queryHardwareSet(self, hwSetName):
        """Query and return a hardware set from the database"""
        hardware_collection = self.db.hardware_sets
        hardware_set = hardware_collection.find_one({"hwName": hwSetName})
        return hardware_set

    def updateAvailability(self, hwSetName, newAvailability):
        """Update the availability of an existing hardware set"""
        hardware_collection = self.db.hardware_sets
        hardware_set = hardware_collection.find_one({"hwName": hwSetName})
        
        if not hardware_set:
            print("Hardware set not found.")
            return False
            
        if newAvailability < 0 or newAvailability > hardware_set["capacity"]:
            print("Invalid availability value.")
            return False
            
        hardware_collection.update_one(
            {"hwName": hwSetName},
            {"$set": {"availability": newAvailability}}
        )
        print("Availability updated successfully.")
        return True

    def requestSpace(self, hwSetName, amount):
        """Request a certain amount of hardware and update availability"""
        hardware_collection = self.db.hardware_sets
        hardware_set = hardware_collection.find_one({"hwName": hwSetName})
        
        if not hardware_set:
            print("Hardware set not found.")
            return False
            
        if hardware_set["availability"] < amount:
            print("Not enough hardware available.")
            return False
            
        hardware_collection.update_one(
            {"hwName": hwSetName},
            {"$inc": {"availability": -amount}}
        )
        print("Hardware requested successfully.")
        return True

    def getAllHwNames(self):
        """Get and return a list of all hardware set names"""
        hardware_collection = self.db.hardware_sets
        hardware_sets = hardware_collection.find({}, {"hwName": 1, "_id": 0})
        return [hw["hwName"] for hw in hardware_sets]

