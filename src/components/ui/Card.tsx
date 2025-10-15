import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', padding = 'p-6', ...rest }) => (
  <div {...rest} className={`bg-white rounded-xl shadow-sm box-border ${padding} ${className}`}>
    {children}
  </div>
);

export default Card;