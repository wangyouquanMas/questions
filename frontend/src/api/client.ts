import axios from 'axios';
import { 
  Question, 
  Tag, 
  Comment, 
  QuestionResponse, 
  QuestionsResponse, 
  PaginationMeta, 
  CreateQuestionRequest, 
  CreateCommentRequest 
} from './types';

// Create Axios instance with baseURL
const apiClient = axios.create({
  baseURL: 'http://localhost:8081/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API interface for client-side interactions
interface ApiQuestionsResponse {
  questions: {
    id: number;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    likes_count: number;
    views_count: number;
  }[];
  question_tags: Record<string, {
    id: number;
    name: string;
  }[]>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface ApiQuestionResponse {
  question: {
    id: number;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    likes_count: number;
    views_count: number;
  };
  tags: {
    id: number;
    name: string;
  }[];
  comments: {
    id: number;
    question_id: number;
    content: string;
    created_at: string;
  }[];
  likes: number;
}

// API methods
export const questionsApi = {
  // Get all questions with pagination, sorting, and filtering
  getQuestions: async (
    page = 1, 
    limit = 10, 
    sort = 'created_at', 
    order = 'desc', 
    tag?: string, 
    search?: string
  ): Promise<ApiQuestionsResponse> => {
    const params: Record<string, any> = { page, limit, sort, order };
    if (tag) params['tag'] = tag;
    if (search) params['search'] = search;

    const response = await apiClient.get('/questions', { params });
    return response.data;
  },

  // Get a single question by ID
  getQuestion: async (id: number): Promise<ApiQuestionResponse> => {
    try {
      const response = await apiClient.get(`/questions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching question ${id}:`, error);
      throw error;
    }
  },

  // Create a new question
  createQuestion: async (question: CreateQuestionRequest): Promise<{ id: number; message: string }> => {
    const response = await apiClient.post('/questions', question);
    return response.data;
  },

  // Add a comment to a question
  addComment: async (questionId: number, content: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/questions/${questionId}/comments`, { content });
    return response.data;
  },

  // Like a question
  likeQuestion: async (questionId: number): Promise<{ message: string }> => {
    const response = await apiClient.post(`/questions/${questionId}/like`);
    return response.data;
  },
};

export default apiClient; 