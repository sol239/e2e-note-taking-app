import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

interface WYSIWYGEditorProps {
  content: string;
  onChange: (html: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  onKeyUp?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface WYSIWYGEditorRef {
  focus: () => void;
  toggleFormat: (format: string) => void;
}

// Clean HTML and normalize formatting
const cleanHtml = (html: string): string => {
  if (!html) return '';
  
  let cleaned = html;

  // Normalize bold tags
  cleaned = cleaned.replace(/<strong>(.*?)<\/strong>/g, '<b>$1</b>');
  cleaned = cleaned.replace(/<span style="font-weight: ?bold;?">(.*?)<\/span>/g, '<b>$1</b>');
  
  // Normalize italic tags
  cleaned = cleaned.replace(/<em>(.*?)<\/em>/g, '<i>$1</i>');
  cleaned = cleaned.replace(/<span style="font-style: ?italic;?">(.*?)<\/span>/g, '<i>$1</i>');

  // Normalize strikethrough tags
  cleaned = cleaned.replace(/<strike>(.*?)<\/strike>/g, '<s>$1</s>');
  cleaned = cleaned.replace(/<del>(.*?)<\/del>/g, '<s>$1</s>');
  cleaned = cleaned.replace(/<span style="text-decoration: ?line-through;?">(.*?)<\/span>/g, '<s>$1</s>');

  // Normalize underline tags
  cleaned = cleaned.replace(/<span style="text-decoration: ?underline;?">(.*?)<\/span>/g, '<u>$1</u>');

  return cleaned;
};

const WYSIWYGEditor = forwardRef<WYSIWYGEditorRef, WYSIWYGEditorProps>(({
  content,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  onMouseUp,
  onKeyUp,
  placeholder,
  className,
  style
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [lastHtml, setLastHtml] = useState('');
  const isComposing = useRef(false);
  const isProcessing = useRef(false);

  // Save cursor position
  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return null;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const offset = preCaretRange.toString().length;

    return offset;
  };

  // Restore cursor position
  const restoreCursorPosition = (offset: number) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    const createRange = (node: Node, chars: { count: number }): Range | null => {
      if (chars.count === 0) {
        const range = document.createRange();
        range.setStart(node, 0);
        range.collapse(true);
        return range;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        if (textNode.length >= chars.count) {
          const range = document.createRange();
          range.setStart(node, chars.count);
          range.collapse(true);
          return range;
        } else {
          chars.count -= textNode.length;
        }
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          const range = createRange(node.childNodes[i], chars);
          if (range) return range;
        }
      }
      return null;
    };

    const range = createRange(editorRef.current, { count: offset });
    if (range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // Clean and normalize HTML formatting
  const cleanAndNormalizeHtml = () => {
    if (!editorRef.current || isProcessing.current) return;

    isProcessing.current = true;
    const cursorOffset = saveCursorPosition();
    
    let html = editorRef.current.innerHTML;
    let cleaned = cleanHtml(html);
    
    // Only update if different
    if (editorRef.current.innerHTML !== cleaned) {
      editorRef.current.innerHTML = cleaned;
      
      // Restore cursor
      if (cursorOffset !== null) {
        restoreCursorPosition(cursorOffset);
      }
    }
    
    isProcessing.current = false;
  };

  // Initialize content
  useEffect(() => {
    if (editorRef.current) {
      const newHtml = cleanHtml(content);
      // Only update if significantly different to avoid cursor jumps
      if (editorRef.current.innerHTML !== newHtml) {
        // If we are not focused, or if the content is completely different (external update)
        if (document.activeElement !== editorRef.current) {
           editorRef.current.innerHTML = newHtml;
           setLastHtml(newHtml);
        } else {
           // If focused, check if the content is actually different
           const currentHtml = cleanHtml(editorRef.current.innerHTML);
           if (currentHtml !== newHtml) {
              // External change - save and restore cursor
              const cursorOffset = saveCursorPosition();
              editorRef.current.innerHTML = newHtml;
              if (cursorOffset !== null) {
                restoreCursorPosition(cursorOffset);
              }
           }
        }
      }
    }
  }, [content]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      editorRef.current?.focus();
    },
    toggleFormat: (format: string) => {
      document.execCommand('styleWithCSS', false, 'false');
      switch (format) {
        case 'bold':
          document.execCommand('bold', false);
          break;
        case 'italic':
          document.execCommand('italic', false);
          break;
        case 'underline':
          document.execCommand('underline', false);
          break;
        case 'strikethrough':
          document.execCommand('strikeThrough', false);
          break;
      }
      handleInput();
    }
  }));

  const handleInput = () => {
    if (editorRef.current && !isProcessing.current) {
      // Clean and normalize HTML formatting
      cleanAndNormalizeHtml();
      
      const html = cleanHtml(editorRef.current.innerHTML);
      setLastHtml(html);
      onChange(html);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      className={className}
      style={{ ...style, outline: 'none', minHeight: '1.5em' }}
      onInput={handleInput}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      onMouseUp={onMouseUp}
      onKeyUp={onKeyUp}
      onPaste={handlePaste}
      data-placeholder={placeholder}
    />
  );
});

WYSIWYGEditor.displayName = 'WYSIWYGEditor';

export default WYSIWYGEditor;
