declare module 'highlight.js' {
  const hljs: {
    highlight(code: string, options: { language: string }): { value: string };
  };
  export default hljs;
}