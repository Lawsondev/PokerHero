// src/components/Chatbot.jsx
import React, { useState, useEffect, useRef } from 'react';
import { sendToAI } from '../utils/aiService.js';

export default function Chatbot({ logs, onSend, onReceive, loading }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSend = async () => {
    const trimmed = input.trim();
    // Basic greeting handling
    if (/^(hi|hello|hey|howdy|good morning|good afternoon)$/i.test(trimmed)) {
      onSend(trimmed);
      onReceive('Hello! How can I help you with your poker training today?');
      setInput('');
      return;
    }
    if (!trimmed || loading) return;

    // Send user message
    onSend(trimmed);
    setInput('');

    // Request AI response
    try {
      const response = await sendToAI(trimmed, logs);
      onReceive(response);
    } catch (err) {
      onReceive('Sorry, I encountered an error generating a response.');
      console.error(err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-white p-4">
      {/* Message history box */}
      <div className="flex-1 overflow-y-auto mb-2">
        {logs.map((log, idx) => (
          <div
            key={idx}
            className={
              log.sender === 'ai'
                ? 'text-gray-800 my-1'
                : 'text-blue-600 my-1 text-right'
            }
          >
            <span className="font-semibold">
              {log.sender === 'ai' ? 'AI' : 'You'}:
            </span>{' '}
            {log.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input and send button */}
      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-2 border rounded-l focus:outline-none"
          placeholder="Type your move or question..."
          disabled={loading}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 flex items-center justify-center"
          disabled={loading}
        >
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : 'Send'
          }
        </button>
      </div>
    </div>
  );
}
