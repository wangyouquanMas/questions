import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-lg font-semibold">问题</p>
            <p className="text-sm mt-1">一个提问和回答问题的地方</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <p>&copy; {currentYear} 问题网站. 保留所有权利.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 