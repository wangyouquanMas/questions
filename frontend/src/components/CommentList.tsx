import React from 'react';
import { Comment } from '../api/types';

interface CommentListProps {
  comments: Comment[];
}

const CommentList: React.FC<CommentListProps> = ({ comments = [] }) => {
  // Format date for better display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
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
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800">{comment.content}</p>
            <p className="text-xs text-gray-500 mt-2">
              Posted on {formatDate(comment.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentList; 