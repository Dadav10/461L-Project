# Import necessary libraries and modules
from bson.objectid import ObjectId
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
import threading
import time

# Define the MongoDB connection string
MONGODB_SERVER = "mongodb+srv://teamthree:friday@ece461l.38dktsx.mongodb.net/Team_Project?retryWrites=true&w=majority&appName=ECE461L"

# Initialize a new Flask web application
app = Flask(__name__)
app.config["MONGO_URI"] = MONGODB_SERVER
mongo = PyMongo()
mongo.init_app(app)
CORS(app)

# Warm up MongoDB connection in background to reduce first-request latency
def warmup_mongo(retries=3, delay=1.0):
    """Attempt to ping MongoDB a few times in background. Non-blocking."""
    for attempt in range(1, retries+1):
        try:
            # mongo.cx is the underlying MongoClient
            mongo.cx.admin.command('ping')
            app.logger.info('MongoDB warm-up successful on attempt %d', attempt)
            return
        except Exception as e:
            app.logger.warning('MongoDB warm-up attempt %d failed: %s', attempt, e)
            time.sleep(delay)
    app.logger.error('MongoDB warm-up failed after %d attempts', retries)

# start the warmup in a daemon thread so it doesn't block startup
threading.Thread(target=warmup_mongo, daemon=True).start()

# Route for user login
@app.route('/login', methods=['POST'])
def login():
    # Extract data from request
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"success": False, "message": "username and password required"}), 400
    
    # Check if the user exists by username
    existing_user = mongo.db.user_info.find_one({"username": username})
    
    if not existing_user:
        return jsonify({"success": False, "message": "Invalid username or password"}), 401
    
    if existing_user.get('password') != password:
        return jsonify({"success": False, "message": "Invalid username or password"}), 401
    
    # Return limited user info expected by client (do NOT return the password)
    user_safe = {
        "username": existing_user.get("username"),
        "projects": existing_user.get("projects", [])
    }
    return jsonify({"success": True, "data": user_safe}), 200


# Route for adding a new user
@app.route('/register', methods=['POST'])
def register():
    # Extract data from request
    data = request.json
    username = data.get('username')
    password = data.get('password')
    security_question = data.get('securityQuestion')
    security_answer = data.get('securityAnswer')

    if not username or not password or not security_question or security_answer is None:
        return jsonify({"success": False, "message": "username, password, securityQuestion and securityAnswer required"}), 400
    
    # Check if the user already exists
    existing_user = mongo.db.user_info.find_one({"username": username})
    if existing_user:
        return jsonify({"success": False, "message": "Username already exists"}), 409
    
    # Create new user document
    new_user = {
        "username": username,
        "password": password,
        "security_question": security_question,
        "security_answer": security_answer,
        "projects": []
    }

    # Insert new user into the database
    mongo.db.user_info.insert_one(new_user)
    return jsonify({"success": True, "message": "User registered successfully"}), 201
        
# Route for password retrieval
@app.route('/forgot/lookup', methods=['POST'])
def lookup_user():
    # Extract data from request
    data = request.json
    username = data.get('username')

    if not username:
        return jsonify({"message": "username required"}), 400

    # Check if the user exists by username
    existing_user = mongo.db.user_info.find_one({"username": username})
    if not existing_user:
        return jsonify({"success": False, "message": "User not found"}), 404

    # In a real application, you would send an email with a password reset link or temporary password.
    # Return limited user info expected by client (do NOT return the password)
    user_safe = {
        "username": existing_user.get("username"),
        "securityQuestion": existing_user.get("security_question"),
        "projects": existing_user.get("projects", [])
    }
    return jsonify({"success": True, "data": user_safe}), 200


# Verify security answer for forgot-password flow
@app.route('/forgot/verify', methods=['POST'])
def verify_user():
    data = request.json
    username = data.get('username')
    answer = data.get('answer')

    if not username or answer is None:
        return jsonify({"success": False, "message": "username and answer required"}), 400

    existing_user = mongo.db.user_info.find_one({"username": username})
    if not existing_user:
        return jsonify({"success": False, "message": "User not found"}), 404

    # For demo: compare plaintext security_answer
    if str(existing_user.get('security_answer','')) == str(answer):
        # return password in data for the client to display (demo only)
        return jsonify({"success": True, "data": {"password": existing_user.get('password')}}), 200
    else:
        return jsonify({"success": False, "message": "Incorrect answer"}), 401


# Reset password endpoint for forgot-password flow
@app.route('/forgot/reset', methods=['POST'])
def reset_user_password():
    data = request.json
    username = data.get('username')
    answer = data.get('answer')
    newPassword = data.get('newPassword')

    if not username or answer is None or not newPassword:
        return jsonify({"success": False, "message": "username, answer and newPassword required"}), 400

    existing_user = mongo.db.user_info.find_one({"username": username})
    if not existing_user:
        return jsonify({"success": False, "message": "User not found"}), 404

    if str(existing_user.get('security_answer','')) != str(answer):
        return jsonify({"success": False, "message": "Incorrect answer"}), 401

    # Update password (demo; no hashing)
    mongo.db.user_info.update_one({"username": username}, {"$set": {"password": newPassword}})
    return jsonify({"success": True, "message": "Password reset successfully"}), 200

# Route for getting all projects
@app.route('/get_all_projects', methods=['POST'])
def get_all_projects():
    # Fetch all projects using the projectsDB module
    projects = mongo.db.projects.find()

    if not projects:
        return jsonify({"success": False, "message": "No projects found"}), 404

    project_list = []
    for project in projects:
        project['_id'] = str(project['_id'])  # Convert ObjectId to string for JSON serialization
        project_list.append(project)

    # Return a JSON response
    return jsonify({"success": True, "data": project_list}), 200


# Route for getting the list of user projects
@app.route('/get_user_projects_list', methods=['GET'])
def get_user_projects_list():
    # Extract data from request
    data = request.json
    username = data.get('username')

    # Fetch the user's projects using the usersDB module
    user = mongo.db.user_info.find_one({"username": username})
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    user_projects = user.get('projects', [])

    # Return a JSON response
    return jsonify({"success": True, "data": user_projects}), 200

# Route for creating a new project
@app.route('/create_project', methods=['POST'])
def create_project():
    # Extract data from request
    data = request.json
    user = data.get('username')
    project_name = data.get('name')
    project_description = data.get('description')

    # Attempt to create the project using the projectsDB module
    new_project = {
        "name": project_name,
        "_id": ObjectId(),
        "description": project_description,
        "authorized_users": [],
        "hardware": [],
        "available_hardware": []
    }
    new_project["authorized_users"].append(user)

    mongo.db.projects.insert_one(new_project)

    # Return a JSON response
    return jsonify({"success": True, "data": new_project}), 200

# Route for joining a project
@app.route('/join_project', methods=['POST'])
def join_project():
    # Extract data from request
    data = request.json
    username = data.get('username')
    project_id = data.get('project_id')

    # Attempt to add the user to the project using the projectsDB module
    project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        return jsonify({"success": False, "message": f"Project {project_id} not found"}), 404
    if username not in project.get('authorized_users', []):
        mongo.db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$push": {"authorized_users": username}}
        )
    # Return a JSON response
    return jsonify({"success": True, "message": "User added to project"}), 200

# Route for leaving a project
@app.route('/leave_project', methods=['POST'])
def leave_project():
    # Extract data from request
    data = request.json
    username = data.get('username')
    project_id = data.get('project_id')

    # Attempt to remove the user from the project using the projectsDB module
    project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        return jsonify({"success": False, "message": "Project not found"}), 404
    if username in project.get('authorized_users', []):
        mongo.db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$pull": {"authorized_users": username}}
        )
    # Return a JSON response
    return jsonify({"success": True, "message": "User removed from project"}), 200

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

import os

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use Heroku's port or default to 5000
    app.run(host='0.0.0.0', port=port)

