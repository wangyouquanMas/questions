package router

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/questions/backend/internal/api"
)

// SetupRouter configures the application's routes
func SetupRouter() *gin.Engine {
	// Set Gin mode based on environment
	// gin.SetMode(gin.ReleaseMode) // Uncomment for production

	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:3000"}, // Allow multiple frontend URLs
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API routes
	v1 := r.Group("/api/v1")
	{
		// Questions routes
		questions := v1.Group("/questions")
		{
			questions.GET("", api.GetQuestions)
			questions.GET("/:id", api.GetQuestion)
			questions.POST("", api.CreateQuestion)

			// Comments
			questions.POST("/:id/comments", api.AddComment)

			// Likes
			questions.POST("/:id/like", api.LikeQuestion)
		}
	}

	return r
}
