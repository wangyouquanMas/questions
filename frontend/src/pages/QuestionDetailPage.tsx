import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { questionsApi } from '../api/client';
import CommentList from '../components/CommentList';
import AddComment from '../components/AddComment';
import ErrorMessage from '../components/ErrorMessage';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { Question, Comment, Tag } from '../api/types';

const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const questionId = id ? parseInt(id, 10) : 0;
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNaN(questionId) || questionId <= 0) {
      setError('无效的问题ID');
      setIsLoading(false);
      return;
    }
    
    fetchQuestionData();
  }, [id, questionId]);

  const fetchQuestionData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await questionsApi.getQuestion(questionId);
      
      if (!response || !response.question) {
        throw new Error('服务器响应无效');
      }
      
      // Check which fields are available in the response
      const apiQuestion = response.question as any; // Use any to bypass TypeScript temporarily
      
      // Map the response data to our Question type
      const questionData: Question = {
        id: apiQuestion.id,
        title: apiQuestion.title,
        content: apiQuestion.content,
        created_at: apiQuestion.created_at,
        updated_at: apiQuestion.updated_at,
        user_id: 0, // Default value since not provided by API
        username: '', // Default value since not provided by API
        // Use either field name that's available with default to 0
        view_count: apiQuestion.view_count !== undefined ? apiQuestion.view_count : 
                    apiQuestion.views_count !== undefined ? apiQuestion.views_count : 0,
        like_count: apiQuestion.like_count !== undefined ? apiQuestion.like_count : 
                    apiQuestion.likes_count !== undefined ? apiQuestion.likes_count : 0,
        // Keep the original fields too for reference
        views_count: apiQuestion.views_count,
        likes_count: apiQuestion.likes_count
      };
      
      console.log('Question data from API:', response.question); // Debug log
      console.log('Mapped question data:', questionData); // Debug log
      
      setQuestion(questionData);
      
      // Map comments with defensive checks
      const mappedComments = Array.isArray(response.comments) 
        ? response.comments.map(c => ({
            id: c.id,
            content: c.content,
            question_id: c.question_id,
            user_id: 0, // Default value
            username: '', // Default value
            created_at: c.created_at,
            updated_at: c.created_at, // Use created_at as update_at
          }))
        : [];
      
      setComments(mappedComments);
      
      // Set tags with defensive check
      setTags(Array.isArray(response.tags) ? response.tags : []);
    } catch (err) {
      console.error('Error fetching question:', err);
      setError('加载问题失败，请重试。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (isLiking || !questionId) return;
    
    setIsLiking(true);
    
    try {
      const response = await questionsApi.likeQuestion(questionId);
      
      // Update the question state directly with the new like count
      setQuestion(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          like_count: response.like_count,
          likes_count: response.like_count
        };
      });
    } catch (err) {
      console.error('Error liking question:', err);
      alert('点赞失败，请重试。');
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentAdded = () => {
    // Refresh the question data to get the new comment
    fetchQuestionData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format counter with singular/plural form
  const formatCounter = (count: number | undefined, label: string) => {
    const safeCount = count ?? 0;
    return `${safeCount} ${label}`;
  };

  // Get view count from either field
  const getViewCount = () => {
    if (!question) return 0;
    return question.view_count ?? question.views_count ?? 0;
  };

  // Get like count from either field
  const getLikeCount = () => {
    if (!question) return 0;
    return question.like_count ?? question.likes_count ?? 0;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <>
        <ErrorMessage 
          message={error || '未找到问题'} 
          retryFunction={id ? fetchQuestionData : undefined} 
        />
        <div className="mt-4">
          <Link to="/" className="text-indigo-600 hover:underline">
            &larr; 返回问题列表
          </Link>
        </div>
      </>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="text-indigo-600 hover:underline flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回问题列表
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{question.title}</h1>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/?tag=${tag.name}`}
                className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-sm hover:bg-gray-300"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        <div className="prose max-w-none mb-6">
          <MarkdownRenderer content={question.content} />
        </div>

        <div className="flex justify-between text-sm text-gray-500 border-t pt-4">
          <div className="flex items-center">
            <span className="mr-4">
              发布于 {formatDate(question.created_at)}
            </span>
            {question.updated_at !== question.created_at && (
              <span>
                更新于 {formatDate(question.updated_at)}
              </span>
            )}
          </div>
          
          <div className="flex space-x-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              {formatCounter(getViewCount(), '浏览')}
            </div>
            
            <button 
              onClick={handleLike} 
              disabled={isLiking}
              className="flex items-center text-gray-700 hover:text-red-500 focus:outline-none disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              {formatCounter(getLikeCount(), '赞')}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <CommentList comments={comments} />
        <AddComment questionId={questionId} onCommentAdded={handleCommentAdded} />
      </div>
    </div>
  );
};

export default QuestionDetailPage; 