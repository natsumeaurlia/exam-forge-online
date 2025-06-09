import React from 'react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-examforge-blue text-6xl font-bold">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
      <p className="mt-2 max-w-md text-gray-600">
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <Link
        href="/"
        className="bg-examforge-blue hover:bg-examforge-blue-dark mt-6 rounded px-4 py-2 font-medium text-white transition-colors"
      >
        Return to Homepage
      </Link>
    </div>
  );
}
