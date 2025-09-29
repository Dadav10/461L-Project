# 461L-Project
Project checkpoints for ECE461L

## Getting Started

Follow these simple steps to set up and run the project:

### Prerequisites
- Python 3.7 or higher
- Git (for cloning the repository)

### Initial Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd 461L-Project
   ```

2. **Run the setup script**:
   ```bash
   ./startup.sh
   ```
   
   This script will:
   - Create or activate a Python virtual environment
   - Install all required dependencies from `requirements.txt`
   - Set up your development environment

3. **Verify the setup**:
   ```bash
   python mongoDB.py
   ```

### Project Structure

- `mongoDB.py` - Main MongoDB connection and user management class
- `requirements.txt` - Python dependencies
- `startup.sh` - Automated setup script
- `README.md` - This file

### Usage

The project includes a MongoDB class that provides:
- User registration (`new_user()`)
- User authentication (`sign_in()`)
- Database connection management

### Troubleshooting

- If you encounter permission issues with `startup.sh`, run: `chmod +x startup.sh`
- Make sure you have Python 3.7+ installed: `python --version`
- If MongoDB connection fails, check your internet connection and MongoDB Atlas credentials
