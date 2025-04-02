import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { questionsApi } from '../api/client';
import QuestionCard from '../components/QuestionCard';
import { Question, Tag, PaginationMeta } from '../api/types';

const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionTags, setQuestionTags] = useState<Record<string, Tag[]>>({});
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get query parameters
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const tag = searchParams.get('tag') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'desc';

  useEffect(() => {
    fetchQuestions();
  }, [searchParams]);

  const fetchQuestions = async () => {
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
      
      // Convert tags as well
      const mappedTags: Record<string, Tag[]> = {};
      Object.entries(response.question_tags).forEach(([qId, tagList]) => {
        mappedTags[qId] = tagList.map(t => ({
          id: t.id,
          name: t.name
        }));
      });
      
      setQuestionTags(mappedTags);
      setPagination({
        current_page: response.pagination.page,
        total_pages: response.pagination.total_pages,
        total_items: response.pagination.total,
        items_per_page: response.pagination.limit
      });
    } catch (err: any) {
      console.error('Error fetching questions:', err);
      // More detailed error message
      const errorMessage = err.response 
        ? `Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`
        : 'Network error: Could not connect to the server. Please check if the backend is running.';
      setError(errorMessage);
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
          &laquo; Previous
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
          Next &raquo;
        </button>
      );
    }
    
    return <div className="flex justify-center mt-6">{links}</div>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {tag ? `Questions tagged "${tag}"` : 
           search ? `Search results for "${search}"` : 
           'Recent Questions'}
        </h1>
        
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="sort" className="mr-2 text-sm text-gray-600">Sort by:</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border rounded p-1 text-sm"
            >
              <option value="created_at">Date</option>
              <option value="like_count">Likes</option>
              <option value="view_count">Views</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="order" className="mr-2 text-sm text-gray-600">Order:</label>
            <select
              id="order"
              value={order}
              onChange={(e) => handleOrderChange(e.target.value)}
              className="border rounded p-1 text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-6">
          No questions found. Try adjusting your search criteria or {' '}
          <a href="/ask" className="underline">ask a new question</a>.
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