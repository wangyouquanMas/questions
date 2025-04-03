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
  const [showFormatHelp, setShowFormatHelp] = useState(false);

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    
    if (!trimmedTag) return;
    
    if (tags.includes(trimmedTag)) {
      setErrors({ ...errors, tags: "该标签已添加" });
      return;
    }
    
    if (tags.length >= 5) {
      setErrors({ ...errors, tags: "最多可添加5个标签" });
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
      newErrors.title = "标题不能为空";
    } else if (title.length < 10) {
      newErrors.title = "标题至少需要10个字符";
    } else if (title.length > 100) {
      newErrors.title = "标题最多100个字符";
    }
    
    if (!content.trim()) {
      newErrors.content = "问题内容不能为空";
    } else if (content.length < 30) {
      newErrors.content = "问题内容至少需要30个字符";
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
        submit: "创建问题失败。请重试。"
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
      <h1 className="text-2xl font-bold mb-6">提出问题</h1>
      
      {errors.submit && (
        <ErrorMessage message={errors.submit} retryFunction={() => handleSubmit} />
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
            标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            placeholder="您的问题是什么？请具体描述。"
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
            内容 <span className="text-red-500">*</span>
            <button 
              type="button" 
              className="ml-2 text-xs text-indigo-600 hover:text-indigo-800"
              onClick={() => setShowFormatHelp(!showFormatHelp)}
            >
              {showFormatHelp ? '隐藏格式帮助' : '显示格式帮助'}
            </button>
          </label>
          
          {showFormatHelp && (
            <div className="mb-3 bg-gray-50 p-3 rounded-lg text-sm">
              <p className="font-semibold mb-1">支持 Markdown 格式:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>使用 # 表示标题（## 二级标题，### 三级标题）</li>
                <li>使用 **文本** 表示<strong>加粗</strong></li>
                <li>使用 *文本* 表示<em>斜体</em></li>
                <li>使用 - 或 * 创建列表项</li>
                <li>插入代码块使用三个反引号({"`"}```{"`"})：
                  <pre className="bg-gray-100 p-2 mt-1 rounded">
                    {"`"}```javascript<br/>
                    // 这是一段JavaScript代码示例<br/>
                    function hello() {"{"}<br/>
                    &nbsp;&nbsp;console.log("Hello world!");<br/>
                    {"}"}<br/>
                    {"`"}```
                  </pre>
                </li>
                <li>支持的语言有：javascript, typescript, html, css, java, python, c, cpp等</li>
                <li>行内代码使用一个反引号: {"`"}code{"`"}</li>
              </ul>
            </div>
          )}
          
          <textarea
            id="content"
            rows={10}
            placeholder="提供回答者需要的所有细节..."
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${
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
            标签（最多5个）
          </label>
          <div className="flex">
            <input
              type="text"
              id="tags"
              placeholder="添加标签..."
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
              添加
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
            {isSubmitting ? '提交中...' : '发布您的问题'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="border border-gray-300 bg-white text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isSubmitting}
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuestionPage; 