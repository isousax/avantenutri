import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => (
  <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`} {...rest}>
    {children}
  </div>
);

export default Card;