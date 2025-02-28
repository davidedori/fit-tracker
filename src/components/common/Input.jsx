import React from 'react'

const Input = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false,
  className = '',
  label,
  min,
  options,
  rows = 3
}) => {
  const baseClasses = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

  // Per input numerici, convertiamo sempre il valore in stringa
  const inputValue = type === 'number' ? 
    (value === 0 || value === '' ? '' : String(value)) : 
    value

  const renderInput = () => {
    switch(type) {
      case 'textarea':
        return (
          <textarea
            value={inputValue}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            rows={rows}
            className={`${baseClasses} ${className} min-h-[100px]`}
          />
        )
      case 'select':
        return (
          <select
            value={inputValue}
            onChange={onChange}
            required={required}
            className={`${baseClasses} ${className}`}
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      default:
        return (
          <input
            type={type}
            value={inputValue}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            min={min}
            className={`${baseClasses} ${className}`}
          />
        )
    }
  }

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {renderInput()}
    </div>
  )
}

export default Input 