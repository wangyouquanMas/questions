import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-2xl font-bold hover:text-indigo-200">
              Questions
            </Link>
            <Link to="/" className="hover:text-indigo-200">
              Home
            </Link>
          </div>

          <div className="flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search questions..."
                  className="w-full py-2 px-4 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-4 py-2 bg-indigo-500 rounded-r-lg hover:bg-indigo-600 focus:outline-none"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          <div>
            <Link
              to="/ask"
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-300"
            >
              Ask Question
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 