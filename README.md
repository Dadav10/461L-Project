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
│   │   ├── public/
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

## Architecture

### Backend (Python/Flask)
The backend uses an **inheritance-based architecture** with MongoDB:

- **`MongoDB`** (Base Class): Handles connection management and implements Singleton pattern
- **`UsersDatabase`**: Inherits from MongoDB, manages user registration, authentication, and project assignments
- **`HardwareDatabase`**: Inherits from MongoDB, manages hardware sets, availability, and requests
- **`ProjectsDatabase`**: Inherits from MongoDB, manages projects, user assignments, and hardware checkout/checkin

### Frontend (React)
- User authentication pages (login, registration, password recovery)
- User portal for project and hardware management
- Project and checkout components

### Database Collections
- **`user_info`**: User credentials and project associations
- **`projects`**: Project details, hardware usage, and user lists
- **`hardware_sets`**: Hardware inventory with capacity and availability

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

### Database Classes Usage Example
```python
from usersDatabase import UsersDatabase
from hardwareDatabase import HardwareDatabase
from projectsDatabase import ProjectsDatabase

# Create instances (all share the same MongoDB connection)
users_db = UsersDatabase()
hardware_db = HardwareDatabase()
projects_db = ProjectsDatabase()

# User management
users_db.addUser("john_doe", "user001", "password123")
users_db.login("john_doe", "user001", "password123")

# Hardware management
hardware_db.createHardwareSet("Arduino Uno", 50)
hardware_db.requestSpace("Arduino Uno", 10)

# Project management
projects_db.createProject("IoT Project", "proj001", "Smart home system")
projects_db.addUser("proj001", "user001")
projects_db.checkOutHW("proj001", "Arduino Uno", 5, "user001")
```

## Features

### User Management
- User registration and authentication
- Project membership management
- User project lists

### Hardware Management
- Hardware set creation and management
- Availability tracking
- Hardware space requests

### Project Management
- Project creation and management
- User-project associations
- Hardware checkout/checkin system
- Usage tracking per project


## Troubleshooting

- If you encounter permission issues with `startup.sh`, run: `chmod +x startup.sh`
- Make sure you have Python 3.7+ installed: `python --version`
- If MongoDB connection fails, check your internet connection and MongoDB Atlas credentials
- For React frontend issues, ensure Node.js and npm are properly installed
- If inheritance tests fail, verify all database files are in the `starter/server/` directory

- Activation note: to have the virtual environment activated in your interactive shell, source the script rather than executing it:

```bash
source ./startup.sh
# or
. ./startup.sh
```

On Windows using PowerShell, activate the virtual environment with:

```powershell
# from the repository root (PowerShell)
.\.env\Scripts\Activate.ps1
```

If you're using Git Bash or WSL on Windows, the `source` commands above will work there.
