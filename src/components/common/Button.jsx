import React from 'react'

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', // primary, secondary, outline, danger
  type = 'button',
  fullWidth = false,
  className = '',
  disabled = false
}) => {
  const baseStyles = "flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-200 font-medium"
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    outline: "border-2 border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-500",
    danger: "bg-red-600 hover:bg-red-700 text-white"
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button 