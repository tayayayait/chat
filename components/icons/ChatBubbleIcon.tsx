import React from 'react';

export const ChatBubbleIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M21 11.5a7.5 7.5 0 0 1-7.5 7.5H9l-4 3v-5.5A7.5 7.5 0 0 1 9 4h4.5A7.5 7.5 0 0 1 21 11.5Z" />
    <path d="M9 9h6" />
    <path d="M9 13h3" />
  </svg>
);
