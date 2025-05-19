import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-muted/40 text-muted-foreground py-6 text-center">
      <div className="container mx-auto px-4">
        <p>&copy; {new Date().getFullYear()} PathFinder. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 