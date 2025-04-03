export interface Tag {
  id: number;
  name: string;
}

export interface Comment {
  id: number;
  content: string;
  user_id: number;
  username: string;
  question_id: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: number;
  title: string;
  content: string;
  user_id: number;
  username: string;
  created_at: string;
  updated_at: string;
  view_count?: number;
  like_count?: number;
  views_count?: number;
  likes_count?: number;
  tags?: Tag[];
}

export interface QuestionResponse {
  question: Question;
  tags: Tag[];
  comments: Comment[];
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

export interface QuestionsResponse {
  questions: Question[];
  tags: Tag[];
  meta: PaginationMeta;
}

export interface CreateQuestionRequest {
  title: string;
  content: string;
  tags: string[];
}

export interface CreateCommentRequest {
  content: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface ApiError {
  error: string;
  status: number;
} 