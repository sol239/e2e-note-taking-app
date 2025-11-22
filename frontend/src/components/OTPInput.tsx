import React, { useRef, useEffect } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function OTPInput({ length = 6, value, onChange, disabled = false }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  if (inputRefs.current.length !== length) {
    inputRefs.current = Array(length).fill(null);
  }

  const focusInput = (index: number) => {
    const target = inputRefs.current[index];
    if (target) {
      target.focus();
      target.select();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value;
    if (isNaN(Number(newValue))) return;

    const newOtp = value.split('');
    // Ensure array is correct length if value was shorter
    while (newOtp.length < length) newOtp.push('');
    
    // Handle the case where user types in a field that already has a value (replace it)
    const char = newValue.substring(newValue.length - 1);
    newOtp[index] = char;
    
    const combinedOtp = newOtp.join('').substring(0, length);
    onChange(combinedOtp);

    if (char && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // If empty and backspace, move to prev and delete
        const newOtp = value.split('');
        newOtp[index - 1] = '';
        onChange(newOtp.join(''));
        focusInput(index - 1);
      } else {
         // Just delete current (handled by onChange usually, but for clarity)
         // Actually default behavior is fine for deleting current char
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
        e.preventDefault();
        focusInput(index + 1);
    }
  };
  
  // Handle backspace specifically to support moving back even if field is empty
  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Backspace' && !value[index] && index > 0) {
          focusInput(index - 1);
      }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    onChange(pastedData);
    // Focus the last filled input or the end
    const nextIndex = Math.min(pastedData.length, length - 1);
    focusInput(nextIndex);
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onKeyUp={(e) => handleKeyUp(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400 text-gray-900"
        />
      ))}
    </div>
  );
}
