import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-lg font-semibold">Questions</p>
            <p className="text-sm mt-1">A place to ask and answer questions</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <p>&copy; {currentYear} Questions. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 