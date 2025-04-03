import axios, { AxiosError } from 'axios';
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

// Get API URL from environment variables or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';

// Log which API URL we're using (helpful for debugging)
console.log(`Using API URL: ${API_URL}`);

// Create Axios instance with baseURL
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add a timeout to avoid long-hanging requests
  timeout: 10000, // 10 seconds
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    // Handle network errors more gracefully
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      console.error('Network error detected:', error.message);
      // You could implement a custom retry logic here
    }
    
    // Log all errors with details to help debugging
    console.error('API request error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      errorCode: error.code
    });
    
    return Promise.reject(error);
  }
);

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

    try {
      const response = await apiClient.get('/questions', { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching questions:`, error);
      throw error;
    }
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
    try {
      const response = await apiClient.post('/questions', question);
      return response.data;
    } catch (error) {
      console.error(`Error creating question:`, error);
      throw error;
    }
  },

  // Add a comment to a question
  addComment: async (questionId: number, content: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post(`/questions/${questionId}/comments`, { content });
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to question ${questionId}:`, error);
      throw error;
    }
  },

  // Like a question
  likeQuestion: async (questionId: number): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post(`/questions/${questionId}/like`);
      return response.data;
    } catch (error) {
      console.error(`Error liking question ${questionId}:`, error);
      throw error;
    }
  },
  
  // Check if the API is available (can be used for health checks)
  checkApiHealth: async (): Promise<boolean> => {
    try {
      await apiClient.get('/questions?page=1&limit=1');
      return true;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
};

export default apiClient; 