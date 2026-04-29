import React from 'react';

type AuthCardProps = {
  children: React.ReactNode;
  className?: string;
};

const AuthCard = React.forwardRef<HTMLDivElement, AuthCardProps>(({ children, className = '' }, ref) => {
  return (
    <div ref={ref} className={`auth-glass-card auth-login-card cartoon-auth-card ${className}`.trim()}>
      {children}
    </div>
  );
});

AuthCard.displayName = 'AuthCard';

export default AuthCard;
