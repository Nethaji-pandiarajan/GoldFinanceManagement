// src/components/AuthLayout.tsx
import React from 'react';
import BackgroundImage from '../assets/authbackground.jpg';

type AuthLayoutProps = {
  children: React.ReactNode;
};

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-gray-950">
      <div
        className="absolute inset-0 bg-cover bg-center blur-xl"
        style={{ backgroundImage: `url(${BackgroundImage})` }}
      ></div>

      <div
        className="absolute inset-[40px] bg-cover bg-center rounded-2xl overflow-hidden"
        style={{ backgroundImage: `url(${BackgroundImage})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.7)_100%)]"></div>
        <div className="relative h-full flex items-center justify-center p-4">
          <div className="w-full md:w-1/2 flex justify-center p-4">
            {children}
          </div>
          <div className="w-full md:w-1/2 hidden md:block">
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;