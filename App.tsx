
import React from 'react';
import ChatPanel from './components/ChatPanel';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-slate-900 text-gray-100 font-sans">
      <header className="p-4 border-b border-gray-700/50 shadow-lg bg-gray-900/50 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          스트림라인 채팅
        </h1>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <ChatPanel />
      </main>
      
      <Footer />
    </div>
  );
};

export default App;
