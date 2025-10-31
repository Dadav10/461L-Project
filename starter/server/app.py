# Import necessary libraries and modules
from bson.objectid import ObjectId
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_pymongo import PyMongo
import threading
import time
import os

# Define the MongoDB connection string
MONGODB_SERVER = "mongodb+srv://teamthree:friday@ece461l.38dktsx.mongodb.net/Team_Project?retryWrites=true&w=majority&appName=ECE461L"

# Initialize a new Flask web application
app = Flask(__name__, static_folder='../client/build/static', static_url_path='/static')
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

        # Attempt to create the project
        new_project = {
            "name": project_name,
            "_id": new_id,
            "description": project_description,
            "authorized_users": [],
            # embed hardware sets per-project so hardware is tied to the project
            "hardware": [
                {"hwName": "Hardware Set 1", "capacity": 100, "availability": 100},
                {"hwName": "Hardware Set 2", "capacity": 100, "availability": 100}
            ]
        }
        new_project["authorized_users"].append(user)

        mongo.db.projects.insert_one(new_project)

        # hardware seeded per-project above; no global seeding needed

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
    if username not in project.get('authorized_users', []):
        # update using the same _id type as found
        mongo.db.projects.update_one(
            {"_id": project.get('_id')},
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
    project = None
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        project = mongo.db.projects.find_one({"_id": project_id})
    if not project:
        return jsonify({"success": False, "message": "Project not found"}), 404
    if username in project.get('authorized_users', []):
        mongo.db.projects.update_one(
            {"_id": project.get('_id')},
            {"$pull": {"authorized_users": username}}
        )
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
    # ensure usage and user_usage fields exist
    if 'usage' not in project:
        project['usage'] = project.get('usage', {})
    if 'user_usage' not in project:
        project['user_usage'] = project.get('user_usage', {})

    # fetch hardware sets from within the project (hardware is per-project)
    hardware = project.get('hardware', [])

    # if username provided, also surface only that user's usage for convenience
    user_usage = {}
    if username:
        user_usage = project.get('user_usage', {}).get(username, {})

    return jsonify({"success": True, "data": {"project": project, "hardware": hardware, "user_usage": user_usage}}), 200

# Route for getting all hardware names
@app.route('/get_all_hw_names', methods=['POST'])
def get_all_hw_names():
    try:
        # aggregate distinct hwNames from projects' embedded hardware arrays
        names_set = set()
        for proj in mongo.db.projects.find({}, { 'hardware': 1, '_id': 0 }):
            for h in proj.get('hardware', []):
                names_set.add(h.get('hwName'))
        names = list(names_set)
        return jsonify({"success": True, "data": names}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# Route for getting hardware information
@app.route('/get_hw_info', methods=['POST'])
def get_hw_info():
    data = request.json or {}
    hwName = data.get('hwName')
    project_id = data.get('project_id')
    if not hwName:
        return jsonify({"success": False, "message": "hwName required"}), 400
    # find hw info inside a project (prefer project_id if provided)
    hw_item = None
    if project_id:
        try:
            proj = mongo.db.projects.find_one({"_id": ObjectId(project_id)}, {"hardware": 1})
        except Exception:
            proj = mongo.db.projects.find_one({"_id": project_id}, {"hardware": 1})
        if proj:
            for h in proj.get('hardware', []):
                if h.get('hwName') == hwName:
                    hw_item = h
                    break
    else:
        # search across projects for the hwName
        proj = mongo.db.projects.find_one({"hardware.hwName": hwName}, {"hardware.$": 1})
        if proj and proj.get('hardware'):
            hw_item = proj['hardware'][0]

    if not hw_item:
        return jsonify({"success": False, "message": "Hardware not found"}), 404
    return jsonify({"success": True, "data": {"hwName": hw_item.get('hwName'), "capacity": hw_item.get('capacity'), "availability": hw_item.get('availability')}}), 200

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

    # find hardware
    # find project and ensure the requested hardware exists with enough availability
    try:
        proj_query = {"_id": ObjectId(project_id), "hardware": {"$elemMatch": {"hwName": hwName, "availability": {"$gte": amount}}}}
    except Exception:
        proj_query = {"_id": project_id, "hardware": {"$elemMatch": {"hwName": hwName, "availability": {"$gte": amount}}}}

    update = {"$inc": {f"hardware.$.availability": -amount, f"usage.{hwName}": amount, f"user_usage.{username}.{hwName}": amount}}
    res = mongo.db.projects.update_one(proj_query, update)
    if res.modified_count == 0:
        # either project/hardware not found or insufficient availability
        # check whether project exists
        try:
            exists = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        except Exception:
            exists = mongo.db.projects.find_one({"_id": project_id})
        if not exists:
            return jsonify({"success": False, "message": "Project not found"}), 404
        return jsonify({"success": False, "message": "Insufficient hardware available or hardware not found in project"}), 400

    return jsonify({"success": True, "message": "Checked out hardware"}), 200

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

    # find project current usage and validate
    try:
        proj = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        proj = mongo.db.projects.find_one({"_id": project_id})
    if not proj:
        return jsonify({"success": False, "message": "Project not found"}), 404
    # check per-user current usage first
    user_current = proj.get('user_usage', {}).get(username, {}).get(hwName, 0)
    if user_current < amount:
        return jsonify({"success": False, "message": "Cannot return more than the user has checked out"}), 400

    # ensure hardware exists in project and that availability won't exceed capacity
    hw_item = None
    for h in proj.get('hardware', []):
        if h.get('hwName') == hwName:
            hw_item = h
            break
    if not hw_item:
        return jsonify({"success": False, "message": "Hardware not found in project"}), 404
    if hw_item.get('availability', 0) + amount > hw_item.get('capacity', 0):
        return jsonify({"success": False, "message": "Return would exceed hardware capacity"}), 400

    # decrement project user usage and increment embedded hardware availability
    try:
        res = mongo.db.projects.update_one({"_id": ObjectId(project_id), "hardware.hwName": hwName}, {"$inc": {f"hardware.$.availability": amount, f"usage.{hwName}": -amount, f"user_usage.{username}.{hwName}": -amount}})
    except Exception:
        res = mongo.db.projects.update_one({"_id": project_id, "hardware.hwName": hwName}, {"$inc": {f"hardware.$.availability": amount, f"usage.{hwName}": -amount, f"user_usage.{username}.{hwName}": -amount}})

    if res.modified_count == 0:
        return jsonify({"success": False, "message": "Failed to check in hardware"}), 500

    return jsonify({"success": True, "message": "Checked in hardware"}), 200

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

# Serve React static files from build folder
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('../client/build/static', path)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    build_dir = os.path.join(os.path.dirname(__file__), '../client/build')
    if path != "" and os.path.exists(os.path.join(build_dir, path)):
        return send_from_directory(build_dir, path)
    else:
        return send_from_directory(build_dir, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use Heroku's port or default to 5000
    app.run(host='0.0.0.0', port=port)

