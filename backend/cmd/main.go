package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/questions/backend/internal/db"
	"github.com/questions/backend/internal/router"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: Error loading .env file:", err)
	}

	// Initialize MySQL database connection
	if err := db.InitMySQL(); err != nil {
		log.Fatalf("Failed to initialize MySQL: %v", err)
	}
	defer db.Close()

	// Initialize Redis connection
	if err := db.InitRedis(); err != nil {
		log.Fatalf("Failed to initialize Redis: %v", err)
	}
	defer db.CloseRedis()

	// Setup router
	r := router.SetupRouter()

	// Get port from environment variable or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	log.Printf("Server starting on port %s...\n", port)
	if err := r.Run(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
} 