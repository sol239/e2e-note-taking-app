import React, { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

// Import Prism.js core and theme
import 'prismjs/themes/prism-dark.css';

// Import language components in dependency order
// Base languages first (many languages depend on clike)
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup'; // HTML/XML base

// Languages that depend on clike or markup
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp'; // depends on c
import 'prismjs/components/prism-csharp'; // depends on clike
import 'prismjs/components/prism-java'; // depends on clike
import 'prismjs/components/prism-javascript'; // depends on clike
import 'prismjs/components/prism-typescript'; // depends on javascript
import 'prismjs/components/prism-php'; // depends on markup and clike
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-go'; // depends on clike
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin'; // depends on clike
import 'prismjs/components/prism-dart'; // depends on clike

// Markup and styling languages
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss'; // depends on css

// Data and config languages
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json'; // depends on javascript
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown'; // depends on markup

// Shell and system languages
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-docker';

interface LiveCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  style?: React.CSSProperties;
  onLanguageChange?: (language: string) => void;
}

export const LiveCodeEditor: React.FC<LiveCodeEditorProps> = ({
  value,
  onChange,
  language,
  placeholder = 'Enter your code here...',
  style = {},
  onLanguageChange
}) => {
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
  const getLanguageGrammar = (lang: string) => {
    const langMap: { [key: string]: any } = {
      javascript: Prism.languages.javascript,
      typescript: Prism.languages.typescript,
      python: Prism.languages.python,
      java: Prism.languages.java,
      cpp: Prism.languages.cpp,
      c: Prism.languages.c,
      csharp: Prism.languages.csharp,
      php: Prism.languages.php,
      ruby: Prism.languages.ruby,
      go: Prism.languages.go,
      rust: Prism.languages.rust,
      swift: Prism.languages.swift,
      kotlin: Prism.languages.kotlin,
      dart: Prism.languages.dart,
      html: Prism.languages.markup,
      css: Prism.languages.css,
      scss: Prism.languages.scss,
      sql: Prism.languages.sql,
      json: Prism.languages.json,
      yaml: Prism.languages.yaml,
      markdown: Prism.languages.markdown,
      bash: Prism.languages.bash,
      powershell: Prism.languages.powershell,
      dockerfile: Prism.languages.docker,
    };
    return langMap[lang.toLowerCase()] || Prism.languages.text;
  };

  const highlightCode = (code: string) => {
    try {
      return Prism.highlight(code, getLanguageGrammar(language), language.toLowerCase());
    } catch (error) {
      return code;
    }
  };

  const handleLanguageSelect = (newLanguage: string) => {
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
    setShowLanguageMenu(false);
  };

  const currentLanguageLabel = languages.find(l => l.value === language)?.label || language;

  return (
    <div className="relative bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header with language selector */}
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
                    lang.value === language 
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
        <span className="text-xs text-gray-400">Editing</span>
      </div>

      {/* Code editor */}
      <div className="p-4">
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={highlightCode}
          padding={0}
          placeholder={placeholder}
          style={{
            fontFamily: '"Fira Code", "Fira Mono", "Consolas", "Monaco", "Courier New", monospace',
            fontSize: 14,
            lineHeight: 1.5,
            backgroundColor: 'transparent',
            color: '#f8f8f2',
            minHeight: '80px',
            outline: 'none',
            ...style
          }}
          textareaClassName="focus:outline-none"
        />
      </div>
    </div>
  );
};