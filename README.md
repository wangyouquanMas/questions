# Questions Application

A React + Go application for asking and answering questions.

## Project Structure
- `frontend/` - React frontend built with TypeScript, React Router, and Tailwind CSS
- `backend/` - Go backend using Gin framework, MySQL, and Redis

## Prerequisites
- Node.js (v14+)
- Go (v1.18+)
- MySQL (v8+)
- Redis (optional)

## Running the Application

### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Make sure MySQL is running on port 3307 or update the `.env` file with your MySQL configuration.

3. Run the backend server:
```bash
go run cmd/main.go
```

The backend will start on port 8081 by default (http://localhost:8081).

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (if not already present) with the following content:
```bash
VITE_API_URL=http://localhost:8081/api/v1
```

4. Start the development server:
```bash
npm run dev
```

The frontend will start on port 5173 by default (http://localhost:5173).

## Troubleshooting

### Common Issues

#### Backend Connection Error
If you see "Network Error" or "Connection Refused" in the frontend:
1. Check if the backend server is running on port 8081
2. Run `go run cmd/main.go` in the backend directory
3. Make sure your MySQL database is running (port 3307)

#### Database Errors
If the backend can't connect to the database:
1. Check if MySQL is running on the configured port
2. Update the database configuration in `backend/.env`

## PM2 Process Management Commands

This application is managed using PM2 (Process Manager 2). Here are essential commands for maintaining the application:

### Basic Status and Monitoring

```bash
# View all running processes
pm2 list

# View detailed real-time dashboard
pm2 monit

# View all application logs
pm2 logs

# View logs for a specific application
pm2 logs questions-backend
pm2 logs questions-frontend

# View only recent logs (last 200 lines)
pm2 logs --lines 200
```

### Application Management

```bash
# Start an application
pm2 start npm --name "app-name" -- start

# Stop an application
pm2 stop questions-backend

# Restart an application (after code changes)
pm2 restart questions-frontend

# Stop all applications
pm2 stop all

# Restart all applications
pm2 restart all

# Delete/remove an application from PM2
pm2 delete questions-frontend
```

### System Management

```bash
# Save the current process list (for auto-restart)
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Restore previously saved processes
pm2 resurrect

# Show detailed information about an application
pm2 show questions-backend

# Display memory and CPU usage
pm2 prettylist
```

### Updating Applications

```bash
# Restart application with new environment variables
pm2 restart questions-frontend --update-env

# Zero-downtime reload
pm2 reload questions-frontend
```

### Log Management

```bash
# Clear all application logs
pm2 flush

# Display log file paths
pm2 logs --path
```

## API Documentation

### Endpoints

- `GET /api/v1/questions` - Get all questions (with pagination and filtering)
- `GET /api/v1/questions/:id` - Get a specific question
- `POST /api/v1/questions` - Create a new question
- `POST /api/v1/questions/:id/comments` - Add a comment to a question
- `POST /api/v1/questions/:id/like` - Like a question

For more details, see the [API documentation](./backend/docs/api.md).

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


### TODO
1. search by tag 
2. support adding code in questions and answers 