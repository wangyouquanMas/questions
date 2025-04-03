import React from 'react';
import { Link } from 'react-router-dom';
import { Question, Tag } from '../api/types';

interface QuestionCardProps {
  question: Question;
  tags?: Tag[];
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, tags = [] }) => {
  // Format date for better display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format counter with singular/plural form
  const formatCounter = (count: number | undefined, label: string) => {
    const safeCount = count ?? 0;
    return `${safeCount} ${label}`;
  };

  // Get view count from either field
  const getViewCount = () => {
    return question.view_count ?? question.views_count ?? 0;
  };

  // Get like count from either field
  const getLikeCount = () => {
    return question.like_count ?? question.likes_count ?? 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <Link to={`/questions/${question.id}`}>
        <h2 className="text-xl font-semibold text-indigo-700 mb-2 hover:text-indigo-900">
          {question.title}
        </h2>
      </Link>
      
      <p className="text-gray-700 mb-4">{question.content}</p>
      
      {tags && tags.length > 0 && (
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
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            {formatCounter(getLikeCount(), '赞')}
          </span>
          <span>,</span>
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {formatCounter(getViewCount(), '浏览')}
          </span>
        </div>
        <span>发布于 {formatDate(question.created_at)}</span>
      </div>
    </div>
  );
};

export default QuestionCard; 