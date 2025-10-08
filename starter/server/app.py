# Import necessary libraries and modules
from bson.objectid import ObjectId
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo

# Define the MongoDB connection string
MONGODB_SERVER = "mongodb+srv://teamthree:friday@ece461l.38dktsx.mongodb.net/Team_Project?retryWrites=true&w=majority&appName=ECE461L"

# Initialize a new Flask web application
app = Flask(__name__)
app.config["MONGO_URI"] = MONGODB_SERVER
mongo = PyMongo()
mongo.init_app(app)
CORS(app)

# Route for user login
@app.route('/login', methods=['POST'])
def login():
    # Extract data from request
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "username and password required"}), 400

    # Connect to MongoDB and attempt to log in using the usersDB module
    login_success = mongo.db.user_info.find_one({"username": username, "password": password})
    if login_success:
        # Return a safe user object without the password
        user_safe = {"_id": str(login_success.get("_id")), "username": login_success.get("username"), "projects": login_success.get("projects", [])}
        return jsonify({"message": "Login successful", "user": user_safe}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401

# Route for adding a new user
@app.route('/add_user', methods=['POST'])
def add_user():
    # Extract data from request
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "username and password required"}), 400

    # Check if the user already exists by username
    existing_user = mongo.db.user_info.find_one({"username": username})
    if existing_user:
        return jsonify({"message": "User already exists"}), 409

    # Create a simple user document (Mongo will generate _id)
    user_doc = {
        "username": username,
        "password": password,
        "projects": []
    }

    result = mongo.db.user_info.insert_one(user_doc)
    inserted_id = str(result.inserted_id)

    # Return the created user info (omit password). No token or server-side userid.
    user_safe = {"_id": inserted_id, "username": username, "projects": []}
    return jsonify({"message": "User added successfully", "user": user_safe}), 201

# Rouet for password retrieval
@app.route('/forgot', methods=['POST'])
def forgot_password():
    # Extract data from request
    data = request.json
    username = data.get('username')

    if not username:
        return jsonify({"message": "username required"}), 400

    # Check if the user exists by username
    existing_user = mongo.db.user_info.find_one({"username": username})
    if not existing_user:
        return jsonify({"message": "User does not exist"}), 404

    # In a real application, you would send an email with a password reset link or temporary password.
    # Here, we will just return a message with the password for demonstration purposes.
    return jsonify({"message": f"Your password is: {existing_user['password']}"}), 200

# Route for the main page (Work in progress)
@app.route('/main')
def mainPage():
    # Extract data from request

    # Connect to MongoDB

    # Fetch user projects using the usersDB module

    # Close the MongoDB connection

    # Return a JSON response
    return jsonify({})

# Route for joining a project
@app.route('/join_project', methods=['POST'])
def join_project():
    # Extract data from request

    # Connect to MongoDB

    # Attempt to join the project using the usersDB module

    # Close the MongoDB connection

    # Return a JSON response
    return jsonify({})

# Route for getting the list of user projects
@app.route('/get_user_projects_list', methods=['POST'])
def get_user_projects_list():
    # Extract data from request

    # Connect to MongoDB

    # Fetch the user's projects using the usersDB module

    # Close the MongoDB connection

    # Return a JSON response
    return jsonify({})

# Route for creating a new project
@app.route('/create_project', methods=['POST'])
def create_project():
    # Extract data from request

    # Connect to MongoDB

    # Attempt to create the project using the projectsDB module

    # Close the MongoDB connection

    # Return a JSON response
    return jsonify({})

# Route for getting project information
@app.route('/get_project_info', methods=['POST'])
def get_project_info():
    # Extract data from request

    # Connect to MongoDB

    # Fetch project information using the projectsDB module

    # Close the MongoDB connection

    # Return a JSON response
    return jsonify({})

# Route for getting all hardware names
@app.route('/get_all_hw_names', methods=['POST'])
def get_all_hw_names():
    # Connect to MongoDB

    # Fetch all hardware names using the hardwareDB module

    # Close the MongoDB connection

    # Return a JSON response
    return jsonify({})

# Route for getting hardware information
@app.route('/get_hw_info', methods=['POST'])
def get_hw_info():
    # Extract data from request

    # Connect to MongoDB

    # Fetch hardware set information using the hardwareDB module

    # Close the MongoDB connection

    # Return a JSON response
    return jsonify({})

# Route for checking out hardware
@app.route('/check_out', methods=['POST'])
def check_out():
    # Extract data from request

    # Connect to MongoDB

    # Attempt to check out the hardware using the projectsDB module

    # Close the MongoDB connection

    # Return a JSON response
    return jsonify({})

# Route for checking in hardware
@app.route('/check_in', methods=['POST'])
def check_in():
    # Extract data from request

    # Connect to MongoDB

    # Attempt to check in the hardware using the projectsDB module

    # Close the MongoDB connection

    # Return a JSON response
    return jsonify({})

# Route for creating a new hardware set
@app.route('/create_hardware_set', methods=['POST'])
def create_hardware_set():
    # Extract data from request

    # Connect to MongoDB

    # Attempt to create the hardware set using the hardwareDB module

    # Close the MongoDB connection

    # Return a JSON response
    return jsonify({})

# Route for checking the inventory of projects
@app.route('/api/inventory', methods=['GET'])
def check_inventory():
    # Connect to MongoDB

    # Fetch all projects from the HardwareCheckout.Projects collection

    # Close the MongoDB connection

    # Return a JSON response
    return jsonify({})

# Main entry point for the application
if __name__ == '__main__':
    app.run()

