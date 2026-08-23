import React from 'react';
import { Link } from '@tanstack/react-router';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-900 py-8 mt-12 text-center text-xs text-gray-500 dark:text-gray-400">
      <div className="site-wrapper flex flex-col items-center gap-3">
        <p>&copy; {new Date().getFullYear()} ṬKA HNAMTE. All Rights Reserved.</p>
        <Link to="/admin" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          Admin Dashboard
        </Link>
      </div>
    </footer>
  );
};
