import React from 'react';

interface EditorStatsProps { text: string | undefined; className?: string; }

function calc(text: string){
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = text.length;
  // average reading speed ~200 wpm
  const minutes = Math.max(1, Math.ceil(words / 200));
  return { words, chars, minutes };
}

export const EditorStats: React.FC<EditorStatsProps> = ({ text='', className='' }) => {
  const { words, chars, minutes } = calc(text);
  return (
    <div className={`flex flex-wrap gap-4 text-xs text-gray-500 justify-end ${className}`}>
      <span>{words} palavras</span>
      <span>{chars} caracteres</span>
      <span>{minutes} min leitura</span>
    </div>
  );
};

export default EditorStats;