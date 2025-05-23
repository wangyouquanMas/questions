import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { questionsApi } from '../api/client';
import QuestionCard from '../components/QuestionCard';
import ErrorMessage from '../components/ErrorMessage';
import { Question, Tag, PaginationMeta } from '../api/types';

const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionTags, setQuestionTags] = useState<Record<string, Tag[]>>({});
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Get query parameters
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const tag = searchParams.get('tag') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'desc';

  // Check backend connectivity
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const isHealthy = await questionsApi.checkApiHealth();
        setBackendStatus(isHealthy ? 'connected' : 'disconnected');
      } catch (err) {
        setBackendStatus('disconnected');
      }
    };
    
    checkBackendStatus();
    // Set an interval to check backend status every 30 seconds
    const intervalId = setInterval(checkBackendStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [searchParams]);

  const fetchQuestions = async () => {
    if (backendStatus === 'disconnected') {
      setError('无法连接到后端服务器。请检查服务器是否运行。');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching questions with params:', { page, limit: 10, sort, order, tag, search });
      
      const response = await questionsApi.getQuestions(
        page,
        10,
        sort,
        order,
        tag,
        search
      );
      
      console.log('API Response:', response);
      
      // Validate response data before processing
      if (!response || !response.questions) {
        throw new Error('Invalid response from server: missing questions data');
      }
      
      // Convert to our local Question type
      const mappedQuestions = response.questions.map(q => ({
        id: q.id,
        title: q.title,
        content: q.content,
        created_at: q.created_at,
        updated_at: q.updated_at,
        user_id: 0, // Default value
        username: '', // Default value
        view_count: q.views_count,
        like_count: q.likes_count
      }));
      
      setQuestions(mappedQuestions);
      
      // Convert tags with defensive check
      const mappedTags: Record<string, Tag[]> = {};
      if (response.question_tags) {
        Object.entries(response.question_tags).forEach(([qId, tagList]) => {
          if (Array.isArray(tagList)) {
            mappedTags[qId] = tagList.map(t => ({
              id: t.id,
              name: t.name
            }));
          } else {
            // If tagList is not an array, provide an empty array as fallback
            mappedTags[qId] = [];
          }
        });
      }
      
      setQuestionTags(mappedTags);
      
      // Add defensive check for pagination
      if (response.pagination) {
        setPagination({
          current_page: response.pagination.page,
          total_pages: response.pagination.total_pages,
          total_items: response.pagination.total,
          items_per_page: response.pagination.limit
        });
      } else {
        setPagination(null);
      }
      
      // Update backend status to connected if successful
      setBackendStatus('connected');
    } catch (err: any) {
      console.error('Error fetching questions:', err);
      
      // Check for network error specifically
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setBackendStatus('disconnected');
        setError('网络错误：无法连接到后端服务器。请检查服务器是否在 http://localhost:8081 上运行。');
      } else {
        // More detailed error message for other errors
        const errorMessage = err.response 
          ? `服务器错误: ${err.response.status} - ${err.response.data?.error || '未知错误'}`
          : err.message || '连接服务器时出错。请稍后再试。';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (newSort: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    setSearchParams(newParams);
  };

  const handleOrderChange = (newOrder: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('order', newOrder);
    setSearchParams(newParams);
  };

  const getPaginationLinks = () => {
    if (!pagination) return null;
    
    const links = [];
    const currentPage = pagination.current_page;
    const totalPages = pagination.total_pages;
    
    // Previous page link
    if (currentPage > 1) {
      links.push(
        <button
          key="prev"
          onClick={() => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('page', (currentPage - 1).toString());
            setSearchParams(newParams);
          }}
          className="px-3 py-1 mx-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          &laquo; 上一页
        </button>
      );
    }
    
    // Page number links
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      links.push(
        <button
          key={i}
          onClick={() => {
            if (i !== currentPage) {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('page', i.toString());
              setSearchParams(newParams);
            }
          }}
          className={`px-3 py-1 mx-1 rounded ${
            i === currentPage 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Next page link
    if (currentPage < totalPages) {
      links.push(
        <button
          key="next"
          onClick={() => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('page', (currentPage + 1).toString());
            setSearchParams(newParams);
          }}
          className="px-3 py-1 mx-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          下一页 &raquo;
        </button>
      );
    }
    
    return <div className="flex justify-center mt-6">{links}</div>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {tag ? `标签为 "${tag}" 的问题` : 
           search ? `搜索结果： "${search}"` : 
           '最近的问题'}
        </h1>
        
        <div className="flex items-center space-x-4">
          {/* Backend status indicator */}
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">后端状态:</span>
            <span 
              className={`inline-block w-3 h-3 rounded-full ${
                backendStatus === 'connected' 
                  ? 'bg-green-500' 
                  : backendStatus === 'checking' 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
              }`}
            ></span>
            <span className="ml-1 text-xs text-gray-500">
              {backendStatus === 'connected' 
                ? '已连接' 
                : backendStatus === 'checking' 
                  ? '检查中...' 
                  : '未连接'}
            </span>
          </div>
          
          <div>
            <label htmlFor="sort" className="mr-2 text-sm text-gray-600">排序方式:</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border rounded p-1 text-sm"
              disabled={backendStatus !== 'connected'}
            >
              <option value="created_at">日期</option>
              <option value="like_count">点赞</option>
              <option value="view_count">浏览量</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="order" className="mr-2 text-sm text-gray-600">顺序:</label>
            <select
              id="order"
              value={order}
              onChange={(e) => handleOrderChange(e.target.value)}
              className="border rounded p-1 text-sm"
              disabled={backendStatus !== 'connected'}
            >
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <ErrorMessage message={error} retryFunction={fetchQuestions} />
      ) : questions.length === 0 ? (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-6">
          没有找到问题。请调整搜索条件或 {' '}
          <a href="/ask" className="underline">提出一个新问题</a>。
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {questions.map((question) => (
              <QuestionCard 
                key={question.id} 
                question={question} 
                tags={questionTags[question.id.toString()]} 
              />
            ))}
          </div>
          
          {getPaginationLinks()}
        </>
      )}
    </div>
  );
};

export default HomePage; 