import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionsApi } from '../api/client';
import ErrorMessage from '../components/ErrorMessage';

const CreateQuestionPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    
    if (!trimmedTag) return;
    
    if (tags.includes(trimmedTag)) {
      setErrors({ ...errors, tags: "This tag is already added" });
      return;
    }
    
    if (tags.length >= 5) {
      setErrors({ ...errors, tags: "You can add at most 5 tags" });
      return;
    }
    
    setTags([...tags, trimmedTag]);
    setTagInput('');
    setErrors({ ...errors, tags: '' });
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length < 10) {
      newErrors.title = "Title must be at least 10 characters";
    } else if (title.length > 100) {
      newErrors.title = "Title must be at most 100 characters";
    }
    
    if (!content.trim()) {
      newErrors.content = "Question content is required";
    } else if (content.length < 30) {
      newErrors.content = "Question content must be at least 30 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await questionsApi.createQuestion({
        title: title.trim(),
        content: content.trim(),
        tags
      });
      
      // Navigate to the new question page
      navigate(`/questions/${response.id}`);
    } catch (err) {
      console.error('Error creating question:', err);
      setErrors({
        ...errors,
        submit: "Failed to create the question. Please try again."
      });
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && tagInput) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ask a Question</h1>
      
      {errors.submit && (
        <ErrorMessage message={errors.submit} retryFunction={() => handleSubmit} />
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            placeholder="What's your question? Be specific."
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
          />
          {errors.title && (
            <p className="mt-1 text-red-500 text-sm">{errors.title}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label htmlFor="content" className="block text-gray-700 font-medium mb-2">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            rows={10}
            placeholder="Provide all the details someone would need to answer your question..."
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
          {errors.content && (
            <p className="mt-1 text-red-500 text-sm">{errors.content}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label htmlFor="tags" className="block text-gray-700 font-medium mb-2">
            Tags (up to 5)
          </label>
          <div className="flex">
            <input
              type="text"
              id="tags"
              placeholder="Add a tag..."
              className={`flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.tags ? 'border-red-500' : 'border-gray-300'
              }`}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting || tags.length >= 5}
            />
            <button
              type="button"
              onClick={addTag}
              className="bg-indigo-600 text-white px-4 rounded-r-lg hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
              disabled={isSubmitting || !tagInput.trim() || tags.length >= 5}
            >
              Add
            </button>
          </div>
          {errors.tags && (
            <p className="mt-1 text-red-500 text-sm">{errors.tags}</p>
          )}
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag) => (
                <div key={tag} className="bg-gray-200 flex items-center px-3 py-1 rounded-full">
                  <span className="text-gray-800 text-sm">{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                    disabled={isSubmitting}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Post Your Question'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="border border-gray-300 bg-white text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuestionPage; 