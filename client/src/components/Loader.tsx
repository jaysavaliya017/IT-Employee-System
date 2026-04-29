import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-primary-600 border-t-transparent`}
      ></div>
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
};

export const PageLoader: React.FC = () => {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader size="lg" text="Loading..." />
    </div>
  );
};

export { Loader };
