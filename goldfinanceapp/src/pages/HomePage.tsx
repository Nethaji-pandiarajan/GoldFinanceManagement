import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to the Home Page!</h1>
      <p className="text-lg mb-8">You have successfully logged in.</p>
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg"
      >
        Logout
      </button>
    </div>
  );
}

export default HomePage;