import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Clipboard } from 'lucide-react';

interface CodeBlockRendererProps {
  content: string;
  language?: string;
  className?: string;
  onClick?: () => void;
  onLanguageChange?: (language: string) => void;
}

export const CodeBlockRenderer: React.FC<CodeBlockRendererProps> = ({
  content,
  language,
  className = '',
  onClick,
  onLanguageChange
}) => {
  const languageLabel = language || 'text';
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const languages = [
    { value: 'text', label: 'Plain Text' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'dart', label: 'Dart' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'scss', label: 'SCSS' },
    { value: 'sql', label: 'SQL' },
    { value: 'json', label: 'JSON' },
    { value: 'xml', label: 'XML' },
    { value: 'yaml', label: 'YAML' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'bash', label: 'Bash' },
    { value: 'powershell', label: 'PowerShell' },
    { value: 'dockerfile', label: 'Dockerfile' },
  ];

  const handleLanguageSelect = (newLanguage: string) => {
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
    setShowLanguageMenu(false);
  };

  const currentLanguageLabel = languages.find(l => l.value === languageLabel)?.label || languageLabel;

  return (
    <div
      className={`relative bg-gray-900 border border-gray-700 rounded-lg overflow-hidden ${className}`}
      onClick={onClick}
    >
      {/* Header with language selector and copy button */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLanguageMenu(!showLanguageMenu);
            }}
            className="text-xs text-gray-300 uppercase tracking-wide hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
            title="Change language"
          >
            {currentLanguageLabel}
            <svg 
              className="w-3 h-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Language dropdown menu */}
          {showLanguageMenu && (
            <div 
              className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto w-48"
              onClick={(e) => e.stopPropagation()}
            >
              {languages.map((lang) => (
                <button
                  key={lang.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLanguageSelect(lang.value);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-700 transition-colors ${
                    lang.value === languageLabel 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-300'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(content);
          }}
          className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
          title="Copy code"
        >
          <Clipboard className="w-4 h-4" />
        </button>
      </div>

      {/* Syntax highlighted code */}
      <div className="p-4">
        <SyntaxHighlighter
          language={languageLabel.toLowerCase()}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: 0,
            background: 'transparent',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
          showLineNumbers={false}
          wrapLines={true}
          wrapLongLines={true}
        >
          {content || 'Enter your code here...'}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};