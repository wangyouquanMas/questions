-- Drop existing tables if they exist (for clean initialization)
DROP TABLE IF EXISTS question_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS questions;

-- Questions table
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Likes table
CREATE TABLE likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    client_ip VARCHAR(45) NOT NULL, -- IPv6 addresses can be up to 45 chars
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    -- Each like should be unique per IP address
    UNIQUE KEY unique_like (question_id, client_ip)
);

-- Tags table
CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Question-Tag relationship (many-to-many)
CREATE TABLE question_tags (
    question_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (question_id, tag_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_questions_created_at ON questions(created_at);
CREATE INDEX idx_questions_like_count ON questions(like_count);
CREATE INDEX idx_questions_view_count ON questions(view_count);
CREATE INDEX idx_comments_question_id ON comments(question_id);
CREATE INDEX idx_likes_question_id ON likes(question_id);

-- Insert some initial tags
INSERT INTO tags (name) VALUES 
('technology'),
('programming'),
('health'),
('science'),
('education'),
('business'),
('finance'),
('travel'),
('food'),
('entertainment');

-- Insert some sample questions
INSERT INTO questions (title, content, view_count, like_count) VALUES
('What is the best way to learn programming?', 'I am a beginner and want to learn programming. What is the best way to start?', 120, 15),
('How does blockchain technology work?', 'I hear a lot about blockchain but I don\'t understand how it actually works. Can someone explain?', 230, 25),
('What are healthy eating habits?', 'I want to improve my diet. What are some healthy eating habits I should adopt?', 310, 42),
('Why is the sky blue?', 'I\'ve always wondered why the sky appears blue during the day. What\'s the scientific explanation?', 95, 8),
('How to start investing in stocks?', 'I have some savings and want to start investing in the stock market. What should I know before starting?', 182, 19);

-- Associate questions with tags
INSERT INTO question_tags (question_id, tag_id) VALUES
(1, 2), -- programming for question 1
(1, 5), -- education for question 1
(2, 1), -- technology for question 2
(2, 6), -- business for question 2
(3, 3), -- health for question 3
(4, 4), -- science for question 4
(5, 6), -- business for question 5
(5, 7); -- finance for question 5

-- Insert some sample comments
INSERT INTO comments (question_id, content) VALUES
(1, 'I recommend starting with Python, it\'s beginner-friendly.'),
(1, 'Try free resources like freeCodeCamp or Codecademy.'),
(2, 'Blockchain is essentially a distributed ledger that records transactions securely.'),
(3, 'Focus on whole foods and reduce processed foods in your diet.'),
(3, 'Don\'t forget to stay hydrated!'),
(4, 'It\'s due to a phenomenon called Rayleigh scattering.'),
(5, 'Start with index funds if you\'re a beginner.');

-- Insert some sample likes
INSERT INTO likes (question_id, client_ip) VALUES
(1, '127.0.0.1'), 
(2, '127.0.0.1'), 
(3, '127.0.0.1'), 
(4, '127.0.0.1'), 
(5, '127.0.0.1'); 