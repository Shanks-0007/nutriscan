import React from 'react';
import { Navbar } from './Navbar';
import { Outlet } from 'react-router-dom';
import { ParticleBackground } from './ParticleBackground';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      <ParticleBackground />
      <Navbar />
      <main className="flex-1 flex flex-col z-10">
        <Outlet />
      </main>
    </div>
  );
};
