import React from 'react';
import { Comment } from '../api/types';
import MarkdownRenderer from './MarkdownRenderer';

interface CommentListProps {
  comments: Comment[];
}

const CommentList: React.FC<CommentListProps> = ({ comments = [] }) => {
  // Format date for better display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  if (!Array.isArray(comments) || comments.length === 0) {
    return (
      <div className="mt-4 text-gray-500 italic">
        暂无评论。成为第一个评论的人！
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">评论 ({comments.length})</h3>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer content={comment.content} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              发布于 {formatDate(comment.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentList; 