import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline-white';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = 'px-4 py-2 rounded font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105 transition-transform duration-200';
  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    secondary: 'bg-white text-green-700 border border-green-600 hover:bg-green-50 focus:ring-green-500',
    'outline-white': 'bg-transparent text-white border border-white hover:bg-white hover:text-green-700 focus:ring-white'
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;