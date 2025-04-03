package models

import (
	"encoding/json"
	"time"
)

// Question represents a question asked by a user
type Question struct {
	ID        int64     `json:"id" db:"id"`
	Title     string    `json:"title" db:"title"`
	Content   string    `json:"content" db:"content"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
	LikeCount int       `json:"like_count" db:"like_count"`
	ViewCount int       `json:"view_count" db:"view_count"`
}

// MarshalJSON implements custom JSON marshalling for Question to support both field naming conventions
func (q Question) MarshalJSON() ([]byte, error) {
	type QuestionAlias Question // Create a type alias to avoid recursion

	// Create a map with both field naming conventions
	return json.Marshal(struct {
		QuestionAlias
		LikesCount int `json:"likes_count"`
		ViewsCount int `json:"views_count"`
	}{
		QuestionAlias: QuestionAlias(q),
		LikesCount:    q.LikeCount,
		ViewsCount:    q.ViewCount,
	})
}

// Tag represents a tag that can be associated with a question
type Tag struct {
	ID   int64  `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
}

// Comment represents a comment on a question
type Comment struct {
	ID         int64     `json:"id" db:"id"`
	QuestionID int64     `json:"question_id" db:"question_id"`
	Content    string    `json:"content" db:"content"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// QuestionTag represents a many-to-many relationship between questions and tags
type QuestionTag struct {
	QuestionID int64 `json:"question_id" db:"question_id"`
	TagID      int64 `json:"tag_id" db:"tag_id"`
}

// Like represents a like on a question
type Like struct {
	ID         int64     `json:"id" db:"id"`
	QuestionID int64     `json:"question_id" db:"question_id"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// QuestionResponse is the response structure for question queries
type QuestionResponse struct {
	Question Question  `json:"question"`
	Tags     []Tag     `json:"tags"`
	Comments []Comment `json:"comments"`
	Likes    int       `json:"likes"`
}

// QuestionCreateRequest represents the structure for creating a new question
type QuestionCreateRequest struct {
	Title    string   `json:"title" binding:"required"`
	Content  string   `json:"content" binding:"required"`
	TagNames []string `json:"tags"`
}

// QuestionUpdateRequest represents the structure for updating an existing question
type QuestionUpdateRequest struct {
	Title    string   `json:"title"`
	Content  string   `json:"content"`
	TagNames []string `json:"tags"`
}
