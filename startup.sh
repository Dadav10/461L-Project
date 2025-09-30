#!/bin/bash

# startup.sh - Sets up Python virtual environment and installs dependencies

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Virtual environment directory name
VENV_DIR=".env"

echo -e "${GREEN}Starting Python environment setup...${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo -e "${RED}Error: Python is not installed or not in PATH${NC}"
    exit 1
fi

# Determine Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

echo -e "${YELLOW}Using Python command: $PYTHON_CMD${NC}"

# Check if virtual environment already exists
if [ -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}Virtual environment already exists. Activating...${NC}"
    
    # Activate the virtual environment
    if [ -f "$VENV_DIR/Scripts/activate" ]; then
        # Windows-style activation script
        source "$VENV_DIR/Scripts/activate"
    elif [ -f "$VENV_DIR/bin/activate" ]; then
        # Unix-style activation script
        source "$VENV_DIR/bin/activate"
    else
        echo -e "${RED}Error: Could not find activation script in virtual environment${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Virtual environment activated successfully!${NC}"
else
    echo -e "${YELLOW}Creating new virtual environment...${NC}"
    
    # Create virtual environment
    $PYTHON_CMD -m venv "$VENV_DIR"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Virtual environment created successfully!${NC}"
        
        # Activate the virtual environment
        if [ -f "$VENV_DIR/Scripts/activate" ]; then
            # Windows-style activation script
            source "$VENV_DIR/Scripts/activate"
        elif [ -f "$VENV_DIR/bin/activate" ]; then
            # Unix-style activation script
            source "$VENV_DIR/bin/activate"
        else
            echo -e "${RED}Error: Could not find activation script in virtual environment${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}Virtual environment activated!${NC}"
    else
        echo -e "${RED}Error: Failed to create virtual environment${NC}"
        exit 1
    fi
fi

# Upgrade pip
echo -e "${YELLOW}Upgrading pip...${NC}"
python -m pip install --upgrade pip

# Check if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo -e "${YELLOW}Installing packages from requirements.txt...${NC}"
    pip install -r requirements.txt
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}All packages installed successfully!${NC}"
    else
        echo -e "${RED}Error: Failed to install some packages${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}No requirements.txt found. Skipping package installation.${NC}"
fi

echo -e "${GREEN}Setup complete! Your Python environment is ready.${NC}"
echo -e "${YELLOW}To activate the environment manually in the future, run:${NC}"

if [ -f "$VENV_DIR/Scripts/activate" ]; then
    echo -e "${YELLOW}  source $VENV_DIR/Scripts/activate${NC}"
else
    echo -e "${YELLOW}  source $VENV_DIR/bin/activate${NC}"
fi

echo -e "${YELLOW}To deactivate the environment, run: deactivate${NC}"