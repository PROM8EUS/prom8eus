import React from 'react';

interface CodeHighlightProps {
  code: string;
  language: string;
  className?: string;
}

const CodeHighlight: React.FC<CodeHighlightProps> = ({ code, language, className = '' }) => {
  const renderHighlightedCode = (code: string, language: string) => {
    if (language !== 'python') return code;

    const lines = code.split('\n');
    const result: React.ReactNode[] = [];
    
    lines.forEach((line, lineIndex) => {
      // Add empty line before comments
      if (line.trim().startsWith('#') && lineIndex > 0) {
        const previousLine = lines[lineIndex - 1];
        if (previousLine.trim() !== '') {
          result.push(<div key={`empty-${lineIndex}`} style={{ whiteSpace: 'pre' }}>&nbsp;</div>);
        }
      }

      // Process the line content
      const processedLine = processLineContent(line, lineIndex);
      result.push(<div key={lineIndex} style={{ whiteSpace: 'pre' }}>{processedLine}</div>);
    });
    
    return result;
  };

  const processLineContent = (line: string, lineIndex: number) => {
    // Comments
    const commentMatch = line.match(/(#.*$)/);
    if (commentMatch) {
      const beforeComment = line.substring(0, commentMatch.index);
      const parts: React.ReactNode[] = [];
      
      if (beforeComment) {
        parts.push(<span key={`text-${lineIndex}`}>{beforeComment}</span>);
      }
      parts.push(
        <span key={`comment-${lineIndex}`} className="text-gray-500 italic">
          {commentMatch[0]}
        </span>
      );
      return parts;
    }

    // Strings first
    const stringRegex = /(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g;
    let stringMatch;
    let lastIndex = 0;
    const stringParts: React.ReactNode[] = [];

    while ((stringMatch = stringRegex.exec(line)) !== null) {
      if (stringMatch.index > lastIndex) {
        stringParts.push(
          <span key={`text-${lineIndex}-${lastIndex}`}>
            {line.substring(lastIndex, stringMatch.index)}
          </span>
        );
      }
      stringParts.push(
        <span key={`string-${lineIndex}-${stringMatch.index}`} className="text-green-600">
          {stringMatch[0]}
        </span>
      );
      lastIndex = stringMatch.index + stringMatch[0].length;
    }

    if (lastIndex < line.length) {
      stringParts.push(
        <span key={`text-end-${lineIndex}`}>
          {line.substring(lastIndex)}
        </span>
      );
    }

    // Now process keywords in the non-string parts
    const keywordRegex = /\b(import|from|class|def|if|else|elif|for|while|try|except|finally|with|as|in|is|not|and|or|True|False|None|return|pass|break|continue|raise|yield|lambda|global|nonlocal|self|super)\b/g;
    let keywordMatch;
    lastIndex = 0;
    const keywordParts: React.ReactNode[] = [];

    while ((keywordMatch = keywordRegex.exec(line)) !== null) {
      if (keywordMatch.index > lastIndex) {
        keywordParts.push(
          <span key={`text-${lineIndex}-${lastIndex}`}>
            {line.substring(lastIndex, keywordMatch.index)}
          </span>
        );
      }
      keywordParts.push(
        <span key={`keyword-${lineIndex}-${keywordMatch.index}`} className="text-purple-600 font-semibold">
          {keywordMatch[0]}
        </span>
      );
      lastIndex = keywordMatch.index + keywordMatch[0].length;
    }

    if (lastIndex < line.length) {
      keywordParts.push(
        <span key={`text-end-${lineIndex}`}>
          {line.substring(lastIndex)}
        </span>
      );
    }

    return keywordParts.length > 0 ? keywordParts : stringParts;
  };

  return (
    <div className={`bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre ${className}`}>
      <code>
        {renderHighlightedCode(code, language)}
      </code>
    </div>
  );
};

export default CodeHighlight;
