import React, { useState } from 'react';
import { questionsApi } from '../api/client';

interface AddCommentProps {
  questionId: number;
  onCommentAdded: () => void;
}

const AddComment: React.FC<AddCommentProps> = ({ questionId, onCommentAdded }) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormatHelp, setShowFormatHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError('评论不能为空');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await questionsApi.addComment(questionId, comment.trim());
      setComment('');
      onCommentAdded();
    } catch (err) {
      setError('添加评论失败。请重试。');
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">添加评论</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <label htmlFor="comment" className="text-gray-700 font-medium">
              您的评论
            </label>
            <button 
              type="button" 
              className="ml-2 text-xs text-indigo-600 hover:text-indigo-800"
              onClick={() => setShowFormatHelp(!showFormatHelp)}
            >
              {showFormatHelp ? '隐藏格式帮助' : '显示格式帮助'}
            </button>
          </div>
          
          {showFormatHelp && (
            <div className="mb-3 bg-gray-50 p-3 rounded-lg text-sm">
              <p className="font-semibold mb-1">支持 Markdown 格式:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>使用 **文本** 表示<strong>加粗</strong></li>
                <li>使用 *文本* 表示<em>斜体</em></li>
                <li>行内代码使用一个反引号: {"`"}code{"`"}</li>
                <li>代码块使用三个反引号:
                  <pre className="bg-gray-100 p-1 mt-1 rounded text-xs">
                    {"`"}```语言名<br/>
                    // 代码内容<br/>
                    {"`"}```
                  </pre>
                </li>
                <li>支持的语言：javascript, typescript, html, css等</li>
              </ul>
            </div>
          )}
          
          <textarea
            id="comment"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            rows={4}
            placeholder="在此输入您的评论..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        
        {error && (
          <div className="mb-4 text-red-500 text-sm">{error}</div>
        )}
        
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? '提交中...' : '添加评论'}
        </button>
      </form>
    </div>
  );
};

export default AddComment; 