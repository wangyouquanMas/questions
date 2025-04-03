import React from 'react';

interface ErrorMessageProps {
  message: string;
  retryFunction?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, retryFunction }) => {
  // Detect if message is about network connection to backend
  const isBackendConnectionError = message.toLowerCase().includes('network error') || 
                                  message.toLowerCase().includes('connection refused') ||
                                  message.toLowerCase().includes('connect to the server') ||
                                  message.toLowerCase().includes('无法连接到后端服务器');
  
  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm leading-5 font-medium">{message}</p>
          
          {isBackendConnectionError && (
            <div className="mt-2 text-sm leading-5">
              <p className="font-semibold">应用程序无法连接到后端服务器。</p>
              <p className="mt-1">请尝试以下步骤：</p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>检查后端服务器是否在端口8081上运行</li>
                <li>打开终端并运行: <code className="bg-red-200 px-1 rounded">cd backend && go run cmd/main.go</code></li>
                <li>确保您的网络防火墙没有阻止连接</li>
                <li>检查MySQL数据库是否正在运行（端口3307）</li>
                <li>验证docker-compose中的所有服务都已启动</li>
              </ol>
              <p className="mt-2">后端URL: <code className="bg-red-200 px-1 rounded">http://localhost:8081</code></p>
            </div>
          )}
          
          {retryFunction && (
            <div className="mt-4">
              <button
                onClick={retryFunction}
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:border-red-700 focus:shadow-outline-red active:bg-red-700 transition ease-in-out duration-150"
              >
                <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7.805V10a1 1 0 01-2 0V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H16a1 1 0 110 2h-5a1 1 0 01-1-1v-5a1 1 0 112 0v1.101a7.002 7.002 0 01-8.601 3.566 1 1 0 01-.61-1.276 1 1 0 01.61-.334z" clipRule="evenodd" />
                </svg>
                重试
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage; 