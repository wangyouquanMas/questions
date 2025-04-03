import React from 'react';

interface ErrorMessageProps {
  message: string;
  retryFunction?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, retryFunction }) => {
  // Detect if message is about network connection to backend
  const isBackendConnectionError = message.toLowerCase().includes('network error') || 
                                  message.toLowerCase().includes('connection refused') ||
                                  message.toLowerCase().includes('connect to the server');
  
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
              <p className="font-semibold">The application cannot connect to the backend server.</p>
              <p className="mt-1">Please try the following steps:</p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Check if the backend server is running on port 8081</li>
                <li>Open a terminal and run: <code className="bg-red-200 px-1 rounded">cd backend && go run cmd/main.go</code></li>
                <li>Make sure your network firewall isn't blocking the connection</li>
                <li>Check if the MySQL database is running (port 3307)</li>
                <li>Verify that all services in docker-compose are up</li>
              </ol>
              <p className="mt-2">Backend URL: <code className="bg-red-200 px-1 rounded">http://localhost:8081</code></p>
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
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage; 