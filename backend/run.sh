#!/bin/bash

# Ensure the script stops on first error
set -e

echo "Starting Questions Backend Application..."

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "Error: Go is not installed. Please install Go 1.21+ and try again."
    exit 1
fi

# Check for MySQL and Redis services
echo "Checking for MySQL service..."
if ! command -v mysql &> /dev/null; then
    echo "Warning: MySQL command not found. Make sure MySQL service is running."
fi

echo "Checking for Redis service..."
if ! command -v redis-cli &> /dev/null; then
    echo "Warning: Redis CLI not found. Make sure Redis service is running."
fi

# Download dependencies
echo "Downloading dependencies..."
go mod tidy

# Build the application
echo "Building application..."
go build -o bin/questions_backend ./cmd/main.go

# Run the application
echo "Running application..."
./bin/questions_backend 