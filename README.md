# 461L-Project
Project checkpoints for ECE461L - Full-stack web application with MongoDB backend

## Getting Started

Follow these simple steps to set up and run the project:

### Prerequisites
- Python 3.7 or higher
- Node.js and npm (for React frontend)
- Git (for cloning the repository)

### Initial Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd 461L-Project
   ```

2. **Run the setup script**:

   To create the virtual environment and install Python dependencies, run the setup script. If you want the virtual environment to be activated in your current shell session, you must source the script (sourcing lets a script modify your shell environment):

   ```bash
   source startup.sh
   ```

   This script will:
   - Create or activate a Python virtual environment
   - Install all required Python dependencies from `requirements.txt`
   - Set up your development environment

3. **Install frontend dependencies**:
   ```bash
   cd starter/client
   npm install
   ```



## Project Structure

```
461L-Project/
├── starter/
│   ├── client/                 # React frontend application
│   │   ├── build/              # Production build output
│   │   ├── public/             # Public assets
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   └── pages/          # Page components
│   │   ├── package.json
│   │   └── package-lock.json
│   └── server/                 # Python backend with MongoDB
│       ├── mongoDB.py          # Base MongoDB connection class (parent)
│       ├── usersDatabase.py    # User management database class
│       ├── hardwareDatabase.py # Hardware management database class
│       ├── projectsDatabase.py # Project management database class
│       ├── app.py              # Flask web server
│       └── test_inheritance.py # Test file for database inheritance
├── requirements.txt            # Python dependencies
├── startup.sh                  # Automated setup script
└── README.md                   # This file
```

## Usage

### Running the Backend
```bash
cd starter/server
python app.py
```

### Running the Frontend
```bash
cd starter/client
npm start
```

Environment

- The MongoDB connection string is currently embedded in `starter/server/app.py` for demo purposes. For production, store the connection URI in an environment variable and don't commit credentials.

## Key backend endpoints (short summary)

All endpoints are implemented in `starter/server/app.py` — check that file for exact request/response JSON shapes.

- POST /register — register a new user. Returns generated `user_id`.
- POST /login — login; returns limited user object (username, user_id, projects).
- POST /forgot/lookup — start forgot-password flow; returns the user's security question.
- POST /forgot/verify — verify security answer (demo may return stored password in response).
- POST /forgot/reset — reset password (client encrypts new password in this demo before sending).
- POST /get_all_projects — return all projects (used for debugging/admin).
- POST /get_user_projects_list — return the list of project ids for a username (what appears in the user's portal).
- POST /get_rejoin_candidates — return projects where the user is authorized but has left (so they can rejoin).
- POST /create_project — create a project; newly created project is added to the creating user's project list.
- POST /join_project — add the username to a project's authorized_users and add the project id to the user's project list.
- POST /leave_project — remove the project id from the user's personal project list (does not remove the username from project's authorized_users so they can rejoin later).
- POST /get_project_info — returns the project document and aggregate `usage` mapping (hwName -> amount).
- POST /get_all_hw_names — list all hardware set names.
- POST /get_hw_info — return capacity and availability for a hardware set.
- POST /create_hardware_set — create a new global hardware set (hwName, capacity).
- POST /check_out — check out hardware: decrement `hardware_sets.availability` and increment `projects.usage[hwName]`.
- POST /check_in — check in hardware: decrement `projects.usage[hwName]` and increment `hardware_sets.availability`. Any authorized project member may check in; per-user ownership is not tracked.

## Data model (current)

- user_info
   - username: string
   - password: string (client-encrypted string in this demo)
   - security_question, security_answer (demo plaintext)
   - projects: array of project ids (strings)
   - user_id: server-generated string id

- projects
   - _id: project id (ObjectId or string)
   - name, description
   - authorized_users: array of usernames
   - usage: object mapping hwName -> integer (aggregate checked-out amount)

- hardware_sets
   - hwName: string (unique)
   - capacity: int
   - availability: int (remaining available units)
