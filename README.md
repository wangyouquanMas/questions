# Questions Web Application

A full-stack web application for managing questions, built with React, Golang, MySQL, and Redis.

## Project Structure

- `frontend/`: React frontend application
- `backend/`: Golang backend API

## Backend

The backend is built with Golang using:
- Gin for HTTP routing
- MySQL for persistent storage
- Redis for caching
- JWT for authentication

### Setup

1. Ensure you have Go 1.21+ installed
2. Navigate to the backend directory: `cd questions/backend`
3. Install dependencies: `go mod tidy`
4. Set up the environment variables by copying the example file: `cp .env.example .env` (if needed)
5. Make sure MySQL and Redis are running
6. Run the application: `go run cmd/main.go`

The server will start on port 8080 (or the port specified in your .env file).

## Frontend

The frontend is built with React, TypeScript, and Vite.

### Setup

1. Ensure you have Node.js 18+ installed
2. Navigate to the frontend directory: `cd questions/frontend`
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`

The frontend will be available at http://localhost:5173.

## API Endpoints

### Questions

- `GET /api/v1/questions`: Get all questions with pagination, filtering, and sorting
- `GET /api/v1/questions/:id`: Get a specific question by ID
- `POST /api/v1/questions`: Create a new question
- `POST /api/v1/questions/:id/comments`: Add a comment to a question
- `POST /api/v1/questions/:id/like`: Like a question

## Development

### Database Setup

The application requires MySQL database. Make sure to set up the database with the correct credentials as specified in the .env file.

```sql
CREATE DATABASE questions_db;
CREATE USER 'questions_user'@'localhost' IDENTIFIED BY 'questions_password';
GRANT ALL PRIVILEGES ON questions_db.* TO 'questions_user'@'localhost';
FLUSH PRIVILEGES;
```

### Redis Setup

Redis is used for caching. Make sure Redis is running on the host and port specified in the .env file.



### How to connect to mysql database 
docker exec -it questions_mysql mysql -u questions_user -pquestions_password