package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strings"
)

func main() {
	routerFilePath := "internal/router/router.go"

	// Read the router file
	content, err := ioutil.ReadFile(routerFilePath)
	if err != nil {
		log.Fatalf("Error reading router file: %v", err)
	}

	// Get allowed origins from environment variable or use default
	allowedOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:3001" // Default fallback
	}

	// Convert comma-separated list to slice for Go code
	origins := strings.Split(allowedOrigins, ",")
	originsCode := "[]string{"
	for i, origin := range origins {
		if i > 0 {
			originsCode += ", "
		}
		originsCode += fmt.Sprintf("%q", strings.TrimSpace(origin))
	}
	originsCode += "}"

	// Replace hardcoded origins with our dynamic origins
	oldCorsConfig := `r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Frontend URL`

	newCorsConfig := fmt.Sprintf(`r.Use(cors.New(cors.Config{
		AllowOrigins:     %s, // Frontend URL`, originsCode)

	updatedContent := strings.Replace(string(content), oldCorsConfig, newCorsConfig, 1)

	// Write the modified content back
	if err := ioutil.WriteFile(routerFilePath, []byte(updatedContent), 0644); err != nil {
		log.Fatalf("Error writing updated router file: %v", err)
	}

	fmt.Println("Router CORS configuration updated successfully.")
}
