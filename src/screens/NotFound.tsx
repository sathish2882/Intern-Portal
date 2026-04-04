import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-navy px-4">
      <div className="bg-white/90 rounded-2xl shadow-2xl p-10 flex flex-col items-center max-w-md w-full">
        <div className="flex flex-col items-center mb-6">
          <svg width="80" height="80" fill="none" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="38" stroke="#2563eb" strokeWidth="4" fill="#eff6ff" />
            <text x="50%" y="54%" textAnchor="middle" fill="#2563eb" fontSize="36" fontWeight="bold" dy=".3em">404</text>
          </svg>
          <h1 className="text-3xl font-extrabold mt-4 mb-2 text-blue-700">Page Not Found</h1>
          <p className="text-base text-slate-500 mb-2 text-center">Sorry, the page you are looking for does not exist or has been moved.</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-2 px-6 py-2.5 rounded-lg bg-blue text-white font-bold text-base shadow-md hover:bg-blue-700 transition-all"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
