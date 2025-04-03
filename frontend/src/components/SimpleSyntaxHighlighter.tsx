import React from 'react';

interface SimpleSyntaxHighlighterProps {
  language?: string;
  children: string;
}

const SimpleSyntaxHighlighter: React.FC<SimpleSyntaxHighlighterProps> = ({ 
  language = '', 
  children 
}) => {
  // Strip trailing newline which React Markdown sometimes adds
  const code = String(children).replace(/\n$/, '');
  
  // Apply basic syntax highlighting for readability
  const highlightedCode = language ? applyBasicHighlighting(code, language) : code;
  
  return (
    <div className="syntax-highlight">
      {language && (
        <div className="language-tag">
          {language}
        </div>
      )}
      <pre className="language-pre">
        {language ? (
          <code 
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        ) : (
          <code className="language-text">{code}</code>
        )}
      </pre>
    </div>
  );
};

function applyBasicHighlighting(code: string, language: string): string {
  // Convert special characters to HTML entities for safety
  const safeCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  if (language === 'javascript' || language === 'typescript' || language === 'jsx' || language === 'tsx') {
    return safeCode
      // Keywords
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|switch|case|break|continue|try|catch|finally|throw|new|this|super|extends|null|undefined|true|false)\b/g, '<span class="token-keyword">$1</span>')
      // Strings
      .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="token-string">$1</span>')
      // Comments
      .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="token-comment">$1</span>')
      // Numbers
      .replace(/\b(\d+)\b/g, '<span class="token-number">$1</span>');
  }
  
  if (language === 'html' || language === 'xml') {
    return safeCode
      // Tags
      .replace(/(&lt;\/?[a-zA-Z][^&>]*&gt;)/g, '<span class="token-tag">$1</span>')
      // Attributes
      .replace(/\s([a-zA-Z-]+)=(&quot;|&#039;).*?\2/g, ' <span class="token-attr-name">$1</span>=<span class="token-attr-value">$2</span>');
  }
  
  if (language === 'css') {
    return safeCode
      // Selectors
      .replace(/([^{]+)(\{)/g, '<span class="token-selector">$1</span>$2')
      // Properties
      .replace(/(\s*)([a-zA-Z-]+)(\s*:\s*)([^;{}]+)(;?)/g, '$1<span class="token-property">$2</span>$3<span class="token-value">$4</span>$5');
  }
  
  // Return default formatting for other languages
  return safeCode;
}

export default SimpleSyntaxHighlighter; 