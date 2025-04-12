
import React from 'react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-examforge-blue">404</h1>
      <h2 className="text-2xl font-semibold mt-4">Page Not Found</h2>
      <p className="mt-2 text-gray-600 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link 
        href="/"
        className="mt-6 bg-examforge-blue hover:bg-examforge-blue-dark text-white font-medium py-2 px-4 rounded transition-colors"
      >
        Return to Homepage
      </Link>
    </div>
  );
}
