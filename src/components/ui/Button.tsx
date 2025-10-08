import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline-white";
  noFocus?: boolean;
  noBorder?: boolean;
  noBackground?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  noFocus = false,
  noBorder = false,
  noBackground = false,
  ...props
}) => {
  const base = [
    'px-4 py-2 rounded-full font-semibold transition transform hover:scale-105 duration-200',
    !noFocus && 'focus:outline-none focus:ring-2 focus:ring-offset-2',
  ]
    .filter(Boolean)
    .join(' ');

  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    secondary: 'bg-white text-green-700 border border-green-600 hover:bg-green-50 focus:ring-green-500',
    'outline-white': 'bg-transparent text-white border border-white hover:bg-white hover:text-green-700 focus:ring-white',
  };

  // Remove classes de borda se `noBorder` for true
  let variantClasses = variants[variant];
  if (noBorder) {
    variantClasses = variantClasses.replace(/border[^ ]*/g, '');
  }

  // Remove classes de background se `noBackground` for true
  if (noBackground) {
    variantClasses = variantClasses
      .replace(/bg-[^ ]*/g, '') // remove bg-* classes
      .replace(/hover:bg-[^ ]*/g, '') // remove hover:bg-* classes
      .replace(/bg-transparent/g, ''); // remove bg-transparent também
  }

  return (
    <button className={`${base} ${variantClasses.trim()} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
