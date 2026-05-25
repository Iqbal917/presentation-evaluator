#!/bin/bash

# Script to start all required services for multi-user presentation evaluator

echo "Starting Presentation Evaluator Services..."

# Check if MongoDB is running
if ! mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "Please start MongoDB manually:"
    echo "  macOS: brew services start mongodb-community"
    echo "  Linux: sudo systemctl start mongod"
    echo "  Windows: net start MongoDB"
    exit 1
fi

echo "MongoDB is running!"

echo ""
echo "All services started successfully!"
echo "You can now run: python -m app.main"