import React from 'react';
import Link from 'next/link';
import { AuthButtons } from './auth-buttons';

const Header = () => {
  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">PathFinder</Link>
        <nav>
          <ul className="flex items-center space-x-4">
            <li><AuthButtons /></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 