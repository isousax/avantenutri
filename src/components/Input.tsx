import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input
      className={`border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${className}`}
      {...props}
    />
  </div>
);

export default Input;
