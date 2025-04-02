package api

import (
	"context"
	"database/sql"
	"encoding/json"
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
	
	questions := []models.Question{}
	for rows.Next() {
		var q models.Question
		if err := rows.Scan(&q.ID, &q.Title, &q.Content, &q.CreatedAt, &q.UpdatedAt, &q.LikeCount, &q.ViewCount); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan question"})
			return
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
	
	// Prepare pagination metadata
	totalPages := (total + limit - 1) / limit
	
	c.JSON(http.StatusOK, gin.H{
		"questions": questions,
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
	
	// Try to get question from Redis cache
	ctx := context.Background()
	cacheKey := fmt.Sprintf("question:%d", questionID)
	
	cachedQuestion, err := db.Redis.Get(ctx, cacheKey).Result()
	if err == nil {
		// Cache hit
		var response models.QuestionResponse
		if err := json.Unmarshal([]byte(cachedQuestion), &response); err == nil {
			// Update view count in the background
			go incrementViewCount(questionID)
			c.JSON(http.StatusOK, response)
			return
		}
	}
	
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
	
	// Prepare response
	response := models.QuestionResponse{
		Question: question,
		Tags:     tags,
		Comments: comments,
		Likes:    question.LikeCount,
	}
	
	// Update view count
	go incrementViewCount(questionID)
	
	// Cache the response
	if responseJSON, err := json.Marshal(response); err == nil {
		db.Redis.Set(ctx, cacheKey, responseJSON, 30*time.Minute)
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
		"id": questionID,
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
	
	// Update likes count in questions table
	_, err = tx.Exec("UPDATE questions SET like_count = like_count + 1 WHERE id = ?", questionID)
	if err != nil {
		fmt.Printf("Error updating like count: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update like count"})
		return
	}
	
	// Commit the transaction
	if err := tx.Commit(); err != nil {
		fmt.Printf("Error committing transaction: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}
	
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

// Helper function to increment view count
func incrementViewCount(questionID int64) {
	_, err := db.DB.Exec("UPDATE questions SET view_count = view_count + 1 WHERE id = ?", questionID)
	if err != nil {
		// Log error but don't fail the request
		fmt.Printf("Failed to increment view count: %v\n", err)
	}
}

// Helper function to truncate content
func truncateContent(content string, maxLength int) string {
	if len(content) <= maxLength {
		return content
	}
	return content[:maxLength] + "..."
}

