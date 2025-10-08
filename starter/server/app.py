# Import necessary libraries and modules
# Simple Flask backend API for the React frontend
from flask import Flask, request, jsonify

# Import database modules
from mongoDB import MongoDB
from usersDatabase import UsersDatabase
from hardwareDatabase import HardwareDatabase
from projectsDatabase import ProjectsDatabase

app = Flask(__name__)

# Instantiate DB wrappers (they are singletons sharing the same client)
users_db = UsersDatabase()
projects_db = ProjectsDatabase()
hardware_db = HardwareDatabase()

# Route for user login
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"message": "Missing username or password"}), 400

    user = users_db.login(username, password)
    if user:
        return jsonify({"message": "Login successful", "user": user}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401



# Route for the main page (Work in progress)
@app.route('/api/ping')
def ping():
    return jsonify({"status": "ok"})

# Route for joining a project
@app.route('/api/join-project', methods=['POST'])
def api_join_project():
    data = request.json or {}
    userId = data.get('userId') or data.get('userId')
    projectId = data.get('projectId')
    if not userId or not projectId:
        return jsonify({"message": "Missing userId or projectId"}), 400

    success = users_db.joinProject(userId, projectId)
    if success:
        # also add user to project document
        projects_db.addUser(projectId, userId)
        return jsonify({"message": "Joined project"}), 200
    else:
        return jsonify({"message": "Could not join project"}), 400

# Route for adding a new user
@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"message": "Missing username or password"}), 400

    user = users_db.addUser(username, password)
    if user:
        return jsonify({"message": "User created", "user": user}), 201
    else:
        return jsonify({"message": "User already exists"}), 409

# Route for getting the list of user projects
@app.route('/api/get_user_projects_list', methods=['POST'])
def api_get_user_projects_list():
    data = request.json or {}
    userId = data.get('userId')
    if not userId:
        return jsonify({"message": "Missing userId"}), 400
    projects = users_db.getUserProjectsList(userId)
    return jsonify({"projects": projects}), 200

# Route for creating a new project
@app.route('/api/create_project', methods=['POST'])
def api_create_project():
    data = request.json or {}
    projectName = data.get('name') or data.get('projectName')
    description = data.get('description', '')
    # generate a simple id
    projectId = data.get('id')
    if not projectName:
        return jsonify({"message": "Missing project name"}), 400
    if not projectId:
        import uuid
        projectId = uuid.uuid4().hex[:8]

    success = projects_db.createProject(projectName, projectId, description)
    if success:
        return jsonify({"message": "Project created", "project": {"name": projectName, "id": projectId, "description": description}}), 201
    else:
        return jsonify({"message": "Project already exists"}), 409

# Route for getting project information
@app.route('/api/get_project_info', methods=['POST'])
def api_get_project_info():
    data = request.json or {}
    projectId = data.get('projectId')
    if not projectId:
        return jsonify({"message": "Missing projectId"}), 400
    project = projects_db.queryProject(projectId)
    if not project:
        return jsonify({"message": "Project not found"}), 404
    return jsonify({"project": project}), 200

# Route for getting all hardware names
@app.route('/api/get_all_hw_names', methods=['GET'])
def api_get_all_hw_names():
    names = hardware_db.getAllHwNames()
    return jsonify({"names": names}), 200

# Route for getting hardware information
@app.route('/api/get_hw_info', methods=['POST'])
def api_get_hw_info():
    data = request.json or {}
    hwName = data.get('hwName')
    if not hwName:
        return jsonify({"message": "Missing hwName"}), 400
    hw = hardware_db.queryHardwareSet(hwName)
    if not hw:
        return jsonify({"message": "Hardware not found"}), 404
    return jsonify({"hardware": hw}), 200

# Route for checking out hardware
@app.route('/api/check_out', methods=['POST'])
def api_check_out():
    data = request.json or {}
    projectId = data.get('projectId')
    hwName = data.get('hwName')
    qty = data.get('qty', 0)
    userId = data.get('userId')
    if not all([projectId, hwName, userId]):
        return jsonify({"message": "Missing parameters"}), 400
    try:
        qty = int(qty)
    except Exception:
        return jsonify({"message": "Invalid qty"}), 400
    success = projects_db.checkOutHW(projectId, hwName, qty, userId)
    if success:
        return jsonify({"message": "Checked out"}), 200
    else:
        return jsonify({"message": "Could not check out"}), 400

# Route for checking in hardware
@app.route('/api/check_in', methods=['POST'])
def api_check_in():
    data = request.json or {}
    projectId = data.get('projectId')
    hwName = data.get('hwName')
    qty = data.get('qty', 0)
    userId = data.get('userId')
    if not all([projectId, hwName, userId]):
        return jsonify({"message": "Missing parameters"}), 400
    try:
        qty = int(qty)
    except Exception:
        return jsonify({"message": "Invalid qty"}), 400
    success = projects_db.checkInHW(projectId, hwName, qty, userId)
    if success:
        return jsonify({"message": "Checked in"}), 200
    else:
        return jsonify({"message": "Could not check in"}), 400

# Route for creating a new hardware set
@app.route('/api/create_hardware_set', methods=['POST'])
def api_create_hardware_set():
    data = request.json or {}
    name = data.get('name')
    capacity = data.get('capacity')
    if not name or capacity is None:
        return jsonify({"message": "Missing name or capacity"}), 400
    try:
        capacity = int(capacity)
    except Exception:
        return jsonify({"message": "Invalid capacity"}), 400
    success = hardware_db.createHardwareSet(name, capacity)
    if success:
        return jsonify({"message": "Hardware created"}), 201
    else:
        return jsonify({"message": "Hardware exists"}), 409

# Route for checking the inventory of projects
@app.route('/api/inventory', methods=['GET'])
def check_inventory():
    # Return all projects stored in the projects collection
    projects = []
    for p in projects_db.db.projects.find({}, {"_id": 0}):
        projects.append(p)
    return jsonify({"projects": projects}), 200

# Main entry point for the application
if __name__ == '__main__':
    # Run on 0.0.0.0 so the React dev server can proxy calls if needed
    app.run(host='0.0.0.0', port=5000, debug=True)

