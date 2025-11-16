
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-2 text-center text-xs text-gray-500 bg-gray-900/50 border-t border-gray-700/50 backdrop-blur-sm">
      <a
        href="https://github.com/google/generative-ai-docs/tree/main/site/en/tutorials/node_quickstart"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-cyan-400 transition-colors"
      >
        스트림라인 제공
      </a>
    </footer>
  );
};

export default Footer;
