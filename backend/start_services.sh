#!/bin/bash

# Script to start all required services for multi-user presentation evaluator

echo "Starting Presentation Evaluator Services..."

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Starting Redis server..."
    redis-server --daemonize yes
    sleep 2
fi

# Check if MongoDB is running
if ! mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "Please start MongoDB manually:"
    echo "  macOS: brew services start mongodb-community"
    echo "  Linux: sudo system.start mongod"
    echo "  Windows: net start MongoDB"
    exit 1
fi

echo "Redis and MongoDB are running!"

# Start Celery worker in background
echo "Starting Celery worker..."
celery -A app.core.celery_app worker --loglevel=info --detach

# Start Celery beat scheduler for periodic tasks
echo "Starting Celery beat scheduler..."
celery -A app.core.celery_app beat --loglevel=info --detach

# Wait a moment for workers to start
sleep 3

# Check Celery workers
echo "Checking Celery workers..."
celery -A app.core.celery_app inspect active

echo ""
echo "All services started successfully!"
echo "You can now run: python -m app.main"
echo ""
echo "To stop services later:"
echo "  pkill -f celery"
echo "  redis-cli shutdown"