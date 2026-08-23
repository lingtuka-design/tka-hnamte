import React from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      <Header />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  ),
});
