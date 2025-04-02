package db

import (
	"context"
	"fmt"
	"os"
	"strconv"

	"github.com/redis/go-redis/v9"
)

// Redis is the global Redis client
var Redis *redis.Client

// InitRedis initializes the Redis connection
func InitRedis() error {
	// Get Redis configuration from environment variables
	host := os.Getenv("REDIS_HOST")
	port := os.Getenv("REDIS_PORT")
	password := os.Getenv("REDIS_PASSWORD")
	dbStr := os.Getenv("REDIS_DB")

	// Parse DB number
	db, err := strconv.Atoi(dbStr)
	if err != nil {
		db = 0 // Default to DB 0 if parsing fails
	}

	// Create Redis client
	Redis = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", host, port),
		Password: password,
		DB:       db,
	})

	// Verify the connection
	_, err = Redis.Ping(context.Background()).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %v", err)
	}

	return nil
}

// CloseRedis closes the Redis connection
func CloseRedis() error {
	if Redis != nil {
		return Redis.Close()
	}
	return nil
} 