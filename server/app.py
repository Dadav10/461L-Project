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
app = Flask(__name__, static_folder='../client/build', static_url_path='/')
app.config["MONGO_URI"] = MONGODB_SERVER
mongo = PyMongo()
mongo.init_app(app)
CORS(app)

@app.route('/')
def index():
    return app.send_static_file('index.html')


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
        "user_id": existing_user.get("user_id"),
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
    
    # Create new user document; generate a unique user_id
    try:
        generated_id = str(ObjectId())
    except Exception:
        generated_id = username + '_' + str(int(time.time()))

    new_user = {
        "username": username,
        "password": password,
        "security_question": security_question,
        "security_answer": security_answer,
        "projects": [],
        "user_id": generated_id
    }

    # Insert new user into the database
    mongo.db.user_info.insert_one(new_user)
    # return user_id so client can encrypt and store it as needed
    return jsonify({"success": True, "data": {"user_id": generated_id}}), 201
        
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
@app.route('/get_user_projects_list', methods=['POST'])
def get_user_projects_list():
    # Extract data from request
    data = request.json or {}
    username = data.get('username')

    if not username:
        return jsonify({"success": False, "message": "username required"}), 400

    # Fetch the user's projects using the usersDB module
    user = mongo.db.user_info.find_one({"username": username})
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    user_projects = user.get('projects', [])

    # Return a JSON response
    return jsonify({"success": True, "data": user_projects}), 200


@app.route('/get_rejoin_candidates', methods=['POST'])
def get_rejoin_candidates():
    data = request.json or {}
    username = data.get('username')
    if not username:
        return jsonify({"success": False, "message": "username required"}), 400

    # Fetch user to know which projects they currently have in their personal list
    user = mongo.db.user_info.find_one({"username": username})
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    user_projects = set(str(pid) for pid in user.get('projects', []))

    try:
        # Find projects where this username is in authorized_users
        cursor = mongo.db.projects.find({"authorized_users": username}, {"name": 1})
        candidates = []
        for p in cursor:
            pid_str = str(p.get('_id'))
            if pid_str not in user_projects:
                candidates.append({"id": pid_str, "name": p.get('name')})
        return jsonify({"success": True, "data": candidates}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# Route for creating a new project
@app.route('/create_project', methods=['POST'])
def create_project():
    # Extract data from request
    data = request.json
    user = data.get('username')
    project_name = data.get('name')
    project_id = data.get('project_id')
    project_description = data.get('description')
    # If a project_id is provided, ensure uniqueness and use it as _id (string)
    try:
        if project_id:
            # check duplicate
            existing = mongo.db.projects.find_one({"_id": project_id})
            if existing:
                return jsonify({"success": False, "message": "Project ID already exists"}), 409
            new_id = project_id
        else:
            new_id = ObjectId()

        # Attempt to create the project (DO NOT embed hardware here).
        # Projects reference global hardware sets via their names when checking out/in.
        new_project = {
            "name": project_name,
            "_id": new_id,
            "description": project_description,
            "authorized_users": [],
            # track total usage per hardware name across this project
            "usage": {}
        }
        new_project["authorized_users"].append(user)

        mongo.db.projects.insert_one(new_project)

        # add project id to the creating user's project list
        try:
            stored_id = str(new_id)
        except Exception:
            stored_id = new_id
        mongo.db.user_info.update_one({"username": user}, {"$addToSet": {"projects": stored_id}})

        # convert ObjectId to string for response if needed
        resp = new_project.copy()
        try:
            resp['_id'] = str(resp['_id'])
        except Exception:
            pass

        return jsonify({"success": True, "data": resp}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# Route for joining a project
@app.route('/join_project', methods=['POST'])
def join_project():
    # Extract data from request
    data = request.json
    username = data.get('username')
    project_id = data.get('project_id')

    # Attempt to add the user to the project using the projectsDB module
    project = None
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        project = mongo.db.projects.find_one({"_id": project_id})
    if not project:
        return jsonify({"success": False, "message": f"Project {project_id} not found"}), 404
    # If user not in authorized_users, add them; regardless, ensure user's project list contains this project
    if username not in project.get('authorized_users', []):
        # update using the same _id type as found
        mongo.db.projects.update_one(
            {"_id": project.get('_id')},
            {"$push": {"authorized_users": username}}
        )
    # always add project id to user's project list so the user sees it in their portal
    try:
        pid = str(project.get('_id'))
    except Exception:
        pid = project.get('_id')
    mongo.db.user_info.update_one({"username": username}, {"$addToSet": {"projects": pid}})
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
    project = None
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        project = mongo.db.projects.find_one({"_id": project_id})
    if not project:
        return jsonify({"success": False, "message": "Project not found"}), 404
    # Do NOT remove the user from the project's authorized_users so they can rejoin later.
    # Only remove the project id from the user's personal project list so it disappears from their portal.
    try:
        pid = str(project.get('_id'))
    except Exception:
        pid = project.get('_id')
    mongo.db.user_info.update_one({"username": username}, {"$pull": {"projects": pid}})
    # Return a JSON response
    return jsonify({"success": True, "message": "User removed from project"}), 200

# Route for getting project information
@app.route('/get_project_info', methods=['POST'])
def get_project_info():
    data = request.json or {}
    project_id = data.get('project_id') or data.get('id')
    username = data.get('username')
    if not project_id:
        return jsonify({"success": False, "message": "project_id required"}), 400

    

    # Fetch project from DB
    project = None
    try:
        # try ObjectId
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        # fallback: maybe project_id is stored as a string id in _id
        project = mongo.db.projects.find_one({"_id": project_id})

    if not project:
        return jsonify({"success": False, "message": "Project not found"}), 404

    # convert ObjectId to string for JSON
    project['_id'] = str(project['_id'])
    # ensure usage field exists
    if 'usage' not in project:
        project['usage'] = project.get('usage', {})

    # For the project view we do NOT include embedded hardware. Hardware is global.
    # Client may call /get_hw_info or /get_all_hw_names to learn about global hardware sets.
    hardware = []

    # Return project and its aggregate usage only. Do not expose per-user tracking.
    return jsonify({"success": True, "data": {"project": project, "hardware": hardware, "usage": project.get('usage', {})}}), 200

# Route for getting all hardware names
@app.route('/get_all_hw_names', methods=['POST'])
def get_all_hw_names():
    try:
        # Read global hardware set names from hardware_sets collection
        names = [doc['hwName'] for doc in mongo.db.hardware_sets.find({}, { 'hwName': 1, '_id': 0 })]
        return jsonify({"success": True, "data": names}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# Route for getting hardware information
@app.route('/get_hw_info', methods=['POST'])
def get_hw_info():
    data = request.json or {}
    hwName = data.get('hwName')
    if not hwName:
        return jsonify({"success": False, "message": "hwName required"}), 400
    try:
        hw = mongo.db.hardware_sets.find_one({"hwName": hwName})
        if not hw:
            return jsonify({"success": False, "message": "Hardware not found"}), 404
        return jsonify({"success": True, "data": {"hwName": hw.get('hwName'), "capacity": hw.get('capacity'), "availability": hw.get('availability')}}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# Route for checking out hardware
@app.route('/check_out', methods=['POST'])
def check_out():
    data = request.json or {}
    project_id = data.get('project_id') or data.get('id')
    hwName = data.get('hwName')
    amount = data.get('amount')
    username = data.get('username')

    if not project_id or not hwName or not amount or not username:
        return jsonify({"success": False, "message": "project_id, hwName and amount required"}), 400
    try:
        amount = int(amount)
        if amount <= 0:
            raise ValueError()
    except Exception:
        return jsonify({"success": False, "message": "amount must be a positive integer"}), 400

    # Use global hardware_sets collection for availability checks and updates
    try:
        hw = mongo.db.hardware_sets.find_one({"hwName": hwName})
        if not hw:
            return jsonify({"success": False, "message": "Hardware not found"}), 404
        if hw.get('availability', 0) < amount:
            return jsonify({"success": False, "message": "Insufficient global hardware available"}), 400

        # decrement global availability first
        res_hw = mongo.db.hardware_sets.update_one({"hwName": hwName, "availability": {"$gte": amount}}, {"$inc": {"availability": -amount}})
        if res_hw.modified_count == 0:
            return jsonify({"success": False, "message": "Insufficient global hardware available"}), 400

        # then increment project usage and per-user usage
        try:
            proj_query = {"_id": ObjectId(project_id)}
        except Exception:
            proj_query = {"_id": project_id}

        update = {"$inc": {f"usage.{hwName}": amount}}
        proj_res = mongo.db.projects.update_one(proj_query, update)
        if proj_res.modified_count == 0:
            # try to revert global change
            mongo.db.hardware_sets.update_one({"hwName": hwName}, {"$inc": {"availability": amount}})
            # determine whether project exists
            exists = mongo.db.projects.find_one(proj_query)
            if not exists:
                return jsonify({"success": False, "message": "Project not found"}), 404
            return jsonify({"success": False, "message": "Failed to update project usage"}), 500

        return jsonify({"success": True, "message": "Checked out hardware"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# Route for checking in hardware
@app.route('/check_in', methods=['POST'])
def check_in():
    data = request.json or {}
    project_id = data.get('project_id') or data.get('id')
    hwName = data.get('hwName')
    amount = data.get('amount')
    username = data.get('username')

    if not project_id or not hwName or not amount or not username:
        return jsonify({"success": False, "message": "project_id, hwName and amount required"}), 400
    try:
        amount = int(amount)
        if amount <= 0:
            raise ValueError()
    except Exception:
        return jsonify({"success": False, "message": "amount must be a positive integer"}), 400

    # Validate project exists
    try:
        proj_query = {"_id": ObjectId(project_id)}
    except Exception:
        proj_query = {"_id": project_id}

    proj = mongo.db.projects.find_one(proj_query)
    if not proj:
        return jsonify({"success": False, "message": "Project not found"}), 404

    # Check overall project total for this hardware
    project_total = proj.get('usage', {}).get(hwName, 0)
    if project_total < amount:
        return jsonify({"success": False, "message": "Cannot return more than the project has checked out"}), 400

    # Check hardware set exists and that returning won't exceed capacity
    hw = mongo.db.hardware_sets.find_one({"hwName": hwName})
    if not hw:
        return jsonify({"success": False, "message": "Hardware set not found"}), 404
    if hw.get('availability', 0) + amount > hw.get('capacity', 0):
        return jsonify({"success": False, "message": "Return would exceed hardware capacity"}), 400

    # decrement project usage, then increment global availability
    try:
        proj_update = mongo.db.projects.update_one(proj_query, {"$inc": {f"usage.{hwName}": -amount}})
        if proj_update.modified_count == 0:
            return jsonify({"success": False, "message": "Failed to update project usage"}), 500

        # increment global availability
        hw_res = mongo.db.hardware_sets.update_one({"hwName": hwName, "availability": {"$lte": hw.get('capacity', 0) - amount}}, {"$inc": {"availability": amount}})
        if hw_res.modified_count == 0:
            # try to revert project update
            mongo.db.projects.update_one(proj_query, {"$inc": {f"usage.{hwName}": amount}})
            return jsonify({"success": False, "message": "Failed to update hardware availability"}), 500

        return jsonify({"success": True, "message": "Checked in hardware"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

import os

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 80))  # Use Heroku's port or default to 5000
    app.run(host='0.0.0.0', port=port)

