package api

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/questions/backend/internal/db"
	"github.com/questions/backend/internal/models"
)

// GetQuestions handles retrieving all questions with pagination, sorting, and filtering
func GetQuestions(c *gin.Context) {
	// Parse query parameters
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	sort := c.DefaultQuery("sort", "created_at")
	order := c.DefaultQuery("order", "desc")
	tag := c.Query("tag")
	search := c.Query("search")

	// Log request parameters for debugging
	fmt.Printf("GetQuestions called with params: page=%s, limit=%s, sort=%s, order=%s, tag=%s, search=%s\n",
		pageStr, limitStr, sort, order, tag, search)

	// Validate and adjust pagination
	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(limitStr)
	if limit < 1 || limit > 100 {
		limit = 10
	}

	// Calculate offset
	offset := (page - 1) * limit

	// Construct base query
	baseQuery := "SELECT q.id, q.title, q.content, q.created_at, q.updated_at, q.like_count, q.view_count FROM questions q"
	countQuery := "SELECT COUNT(*) FROM questions q"

	// Add joins and filters
	var args []interface{}
	var whereClause string

	if tag != "" {
		baseQuery += " JOIN question_tags qt ON q.id = qt.question_id JOIN tags t ON qt.tag_id = t.id"
		countQuery += " JOIN question_tags qt ON q.id = qt.question_id JOIN tags t ON qt.tag_id = t.id"
		whereClause = " WHERE t.name = ?"
		args = append(args, tag)
	}

	if search != "" {
		if whereClause == "" {
			whereClause = " WHERE"
		} else {
			whereClause += " AND"
		}
		whereClause += " (q.title LIKE ? OR q.content LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}

	baseQuery += whereClause
	countQuery += whereClause

	// Add order and pagination
	validSortFields := map[string]bool{
		"created_at": true, "updated_at": true, "like_count": true, "view_count": true,
	}

	if !validSortFields[sort] {
		sort = "created_at"
	}

	if order != "asc" && order != "desc" {
		order = "desc"
	}

	baseQuery += fmt.Sprintf(" ORDER BY q.%s %s LIMIT ? OFFSET ?", sort, order)
	args = append(args, limit, offset)

	// Add debug print statements
	fmt.Printf("Debug - Base SQL Query: %s\n", baseQuery)
	fmt.Printf("Debug - Count SQL Query: %s\n", countQuery)
	fmt.Printf("Debug - Args: %v\n", args)

	// Query for total count
	var total int
	err := db.DB.QueryRow(countQuery, args[:len(args)-2]...).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count questions"})
		return
	}

	// Query for questions
	rows, err := db.DB.Query(baseQuery, args...)
	if err != nil {
		fmt.Printf("Query error: %v\nQuery: %s\nArgs: %v\n", err, baseQuery, args)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to retrieve questions: %v", err)})
		return
	}
	defer rows.Close()

	ctx := context.Background()
	questions := []models.Question{}
	for rows.Next() {
		var q models.Question
		if err := rows.Scan(&q.ID, &q.Title, &q.Content, &q.CreatedAt, &q.UpdatedAt, &q.LikeCount, &q.ViewCount); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan question"})
			return
		}

		// Get the latest counts from Redis
		redisViewCount := getCountFromRedis(ctx, q.ID, "views")
		redisLikeCount := getCountFromRedis(ctx, q.ID, "likes")

		// Update with Redis counts if available
		if redisViewCount > 0 {
			q.ViewCount = redisViewCount
		}
		if redisLikeCount > 0 {
			q.LikeCount = redisLikeCount
		}

		questions = append(questions, q)
	}

	// Get tags for each question and store in a map
	questionTags := make(map[int64][]models.Tag)
	for i, question := range questions {
		tags, err := getQuestionTags(question.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve tags"})
			return
		}
		questionTags[question.ID] = tags
		questions[i].Content = truncateContent(questions[i].Content, 200) // Truncate for list view
	}

	// Create custom questions response with both field naming conventions
	customQuestions := make([]map[string]interface{}, len(questions))
	for i, q := range questions {
		customQuestions[i] = map[string]interface{}{
			"id":          q.ID,
			"title":       q.Title,
			"content":     q.Content,
			"created_at":  q.CreatedAt,
			"updated_at":  q.UpdatedAt,
			"like_count":  q.LikeCount,
			"view_count":  q.ViewCount,
			"likes_count": q.LikeCount,
			"views_count": q.ViewCount,
		}
	}

	// Prepare pagination metadata
	totalPages := (total + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"questions":     customQuestions,
		"question_tags": questionTags,
		"pagination": gin.H{
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": totalPages,
		},
	})
}

// GetQuestion handles retrieving a single question by ID
func GetQuestion(c *gin.Context) {
	// Parse question ID from URL parameter
	questionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID"})
		return
	}

	// Setup context for Redis operations
	ctx := context.Background()

	// Try to get question from Redis cache - skip cache for now to test our changes
	/*
		cacheKey := fmt.Sprintf("question:%d", questionID)
		cachedQuestion, err := db.Redis.Get(ctx, cacheKey).Result()
		if err == nil {
			// Cache hit
			var response models.QuestionResponse
			if err := json.Unmarshal([]byte(cachedQuestion), &response); err == nil {
				// Update view count in the background
				go incrementViewCount(questionID)

				// Get the latest counts from Redis
				response.Question.ViewCount = getCountFromRedis(ctx, questionID, "views")
				response.Question.LikeCount = getCountFromRedis(ctx, questionID, "likes")
				response.Likes = response.Question.LikeCount

				c.JSON(http.StatusOK, response)
				return
			}
		}
	*/

	// Cache miss or error, fetch from database
	query := `SELECT id, title, content, created_at, updated_at, like_count, view_count 
			  FROM questions WHERE id = ?`

	var question models.Question
	err = db.DB.QueryRow(query, questionID).Scan(
		&question.ID, &question.Title, &question.Content,
		&question.CreatedAt, &question.UpdatedAt,
		&question.LikeCount, &question.ViewCount,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Question not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve question"})
		return
	}

	// Get tags for this question
	tags, err := getQuestionTags(questionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve tags"})
		return
	}

	// Get comments for this question
	comments, err := getQuestionComments(questionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve comments"})
		return
	}

	// Get the latest counts from Redis or initialize them
	viewCount := getCountFromRedis(ctx, questionID, "views")
	likeCount := getCountFromRedis(ctx, questionID, "likes")

	// Update the question struct with the latest counts
	question.ViewCount = viewCount
	question.LikeCount = likeCount

	// Track unique views by IP address with a time window of 24 hours
	clientIP := c.ClientIP()
	viewKey := fmt.Sprintf("question:%d:view:%s", questionID, clientIP)

	// Check if this IP has already viewed the question in the last 24 hours
	exists, err := db.Redis.Exists(ctx, viewKey).Result()
	if err != nil {
		fmt.Printf("Error checking view key: %v\n", err)
	}

	// If the view doesn't exist in Redis, increment view count and set record
	if exists == 0 {
		// Set a record that this IP has viewed this question, with 24h expiry
		db.Redis.Set(ctx, viewKey, 1, 24*time.Hour)

		// Increment view asynchronously
		go incrementViewCount(questionID)
	}

	// Create a direct response with both field naming conventions
	response := map[string]interface{}{
		"question": map[string]interface{}{
			"id":          question.ID,
			"title":       question.Title,
			"content":     question.Content,
			"created_at":  question.CreatedAt,
			"updated_at":  question.UpdatedAt,
			"like_count":  question.LikeCount,
			"view_count":  question.ViewCount,
			"likes_count": question.LikeCount,
			"views_count": question.ViewCount,
		},
		"tags":     tags,
		"comments": comments,
		"likes":    question.LikeCount,
	}

	c.JSON(http.StatusOK, response)
}

// CreateQuestion handles creating a new question
func CreateQuestion(c *gin.Context) {
	var req models.QuestionCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Begin transaction
	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to begin transaction"})
		return
	}
	defer tx.Rollback()

	// Insert question
	result, err := tx.Exec(
		"INSERT INTO questions (title, content) VALUES (?, ?)",
		req.Title, req.Content,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create question"})
		return
	}

	// Get the newly inserted question ID
	questionID, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get question ID"})
		return
	}

	// Process tags
	if len(req.TagNames) > 0 {
		for _, tagName := range req.TagNames {
			// Try to find existing tag or create a new one
			var tagID int64
			err := tx.QueryRow("SELECT id FROM tags WHERE name = ?", tagName).Scan(&tagID)
			if err == sql.ErrNoRows {
				// Tag doesn't exist, create it
				res, err := tx.Exec("INSERT INTO tags (name) VALUES (?)", tagName)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create tag"})
					return
				}
				tagID, err = res.LastInsertId()
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tag ID"})
					return
				}
			} else if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check tag existence"})
				return
			}

			// Associate tag with question
			_, err = tx.Exec(
				"INSERT INTO question_tags (question_id, tag_id) VALUES (?, ?)",
				questionID, tagID,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to associate tag with question"})
				return
			}
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Invalidate cache
	db.Redis.Del(context.Background(), "questions:list")

	c.JSON(http.StatusCreated, gin.H{
		"id":      questionID,
		"message": "Question created successfully",
	})
}

// AddComment handles adding a comment to a question
func AddComment(c *gin.Context) {
	questionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID"})
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if question exists
	var exists bool
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM questions WHERE id = ?)", questionID).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check question existence"})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Question not found"})
		return
	}

	// Insert comment
	_, err = db.DB.Exec(
		"INSERT INTO comments (question_id, content) VALUES (?, ?)",
		questionID, req.Content,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add comment"})
		return
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("question:%d", questionID)
	db.Redis.Del(context.Background(), cacheKey)

	c.JSON(http.StatusCreated, gin.H{"message": "Comment added successfully"})
}

// LikeQuestion handles adding a like to a question
func LikeQuestion(c *gin.Context) {
	questionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID"})
		return
	}

	fmt.Printf("LikeQuestion called for question ID: %d\n", questionID)

	// Check if question exists
	var exists bool
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM questions WHERE id = ?)", questionID).Scan(&exists)
	if err != nil {
		fmt.Printf("Error checking if question exists: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check question existence"})
		return
	}

	if !exists {
		fmt.Printf("Question ID %d not found\n", questionID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Question not found"})
		return
	}

	// Check if already liked
	var alreadyLiked bool
	err = db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM likes WHERE question_id = ?)", questionID).Scan(&alreadyLiked)
	if err != nil {
		fmt.Printf("Error checking if already liked: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check like status"})
		return
	}

	// If already liked, just return success
	if alreadyLiked {
		fmt.Printf("Question ID %d already liked\n", questionID)
		c.JSON(http.StatusOK, gin.H{"message": "Question already liked"})
		return
	}

	// Begin transaction
	tx, err := db.DB.Begin()
	if err != nil {
		fmt.Printf("Error beginning transaction: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to begin transaction"})
		return
	}
	defer tx.Rollback()

	// Insert like
	_, err = tx.Exec("INSERT INTO likes (question_id) VALUES (?)", questionID)
	if err != nil {
		fmt.Printf("Error inserting like: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add like"})
		return
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		fmt.Printf("Error committing transaction: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Increment like count in Redis
	go incrementLikeCount(questionID)

	fmt.Printf("Successfully liked question ID: %d\n", questionID)

	// Invalidate cache
	cacheKey := fmt.Sprintf("question:%d", questionID)
	db.Redis.Del(context.Background(), cacheKey)

	c.JSON(http.StatusOK, gin.H{"message": "Question liked successfully"})
}

// Helper function to get tags for a question
func getQuestionTags(questionID int64) ([]models.Tag, error) {
	query := `
		SELECT t.id, t.name 
		FROM tags t
		JOIN question_tags qt ON t.id = qt.tag_id
		WHERE qt.question_id = ?
	`

	rows, err := db.DB.Query(query, questionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []models.Tag
	for rows.Next() {
		var tag models.Tag
		if err := rows.Scan(&tag.ID, &tag.Name); err != nil {
			return nil, err
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

// Helper function to get comments for a question
func getQuestionComments(questionID int64) ([]models.Comment, error) {
	query := `
		SELECT id, question_id, content, created_at
		FROM comments
		WHERE question_id = ?
		ORDER BY created_at DESC
	`

	rows, err := db.DB.Query(query, questionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		if err := rows.Scan(&comment.ID, &comment.QuestionID, &comment.Content, &comment.CreatedAt); err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}

	return comments, nil
}

// Helper function to get count from Redis with fallback to database
func getCountFromRedis(ctx context.Context, questionID int64, countType string) int {
	// Try to get count from Redis
	redisKey := fmt.Sprintf("question:%d:%s", questionID, countType)
	count, err := db.Redis.Get(ctx, redisKey).Int()
	if err == nil {
		return count
	}

	// Fallback to database if Redis fails
	var dbCount int
	var query string
	if countType == "views" {
		query = "SELECT view_count FROM questions WHERE id = ?"
	} else if countType == "likes" {
		query = "SELECT like_count FROM questions WHERE id = ?"
	}

	err = db.DB.QueryRow(query, questionID).Scan(&dbCount)
	if err != nil {
		fmt.Printf("Error getting %s count from database: %v\n", countType, err)
		return 0
	}

	// Update Redis with the database value
	db.Redis.Set(ctx, redisKey, dbCount, 24*time.Hour)
	return dbCount
}

// Helper function to increment view count
func incrementViewCount(questionID int64) {
	ctx := context.Background()
	redisKey := fmt.Sprintf("question:%d:views", questionID)

	// Increment in Redis
	newCount, err := db.Redis.Incr(ctx, redisKey).Result()
	if err != nil {
		fmt.Printf("Failed to increment view count in Redis: %v\n", err)
		// Fallback to database update
		_, err = db.DB.Exec("UPDATE questions SET view_count = view_count + 1 WHERE id = ?", questionID)
		if err != nil {
			fmt.Printf("Failed to increment view count in database: %v\n", err)
		}
		return
	}

	// Set expiration if this is a new key
	if newCount == 1 {
		db.Redis.Expire(ctx, redisKey, 24*time.Hour)
	}

	// Periodically update the database (e.g., every 5 views)
	if newCount%5 == 0 {
		_, err = db.DB.Exec("UPDATE questions SET view_count = ? WHERE id = ?", newCount, questionID)
		if err != nil {
			fmt.Printf("Failed to update view count in database: %v\n", err)
		}
	}
}

// Helper function to increment like count
func incrementLikeCount(questionID int64) {
	ctx := context.Background()
	redisKey := fmt.Sprintf("question:%d:likes", questionID)

	// Increment in Redis
	newCount, err := db.Redis.Incr(ctx, redisKey).Result()
	if err != nil {
		fmt.Printf("Failed to increment like count in Redis: %v\n", err)
		return
	}

	// Set expiration if this is a new key
	if newCount == 1 {
		db.Redis.Expire(ctx, redisKey, 24*time.Hour)
	}

	// Update the database immediately for likes
	_, err = db.DB.Exec("UPDATE questions SET like_count = ? WHERE id = ?", newCount, questionID)
	if err != nil {
		fmt.Printf("Failed to update like count in database: %v\n", err)
	}
}

// Helper function to truncate content
func truncateContent(content string, maxLength int) string {
	if len(content) <= maxLength {
		return content
	}
	return content[:maxLength] + "..."
}
