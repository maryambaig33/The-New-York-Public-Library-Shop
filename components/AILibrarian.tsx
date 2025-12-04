import React, { useState, useRef, useEffect } from 'react';
import { X, Send, User, Sparkles } from 'lucide-react';
import { chatWithLibrarian } from '../services/geminiService';
import { ChatMessage, Product } from '../types';

interface AILibrarianProps {
  isOpen: boolean;
  onClose: () => void;
  onProductClick: (productId: string) => void;
  products: Product[];
}

export const AILibrarian: React.FC<AILibrarianProps> = ({ isOpen, onClose, onProductClick, products }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm the shop's Digital Librarian. Are you looking for a specific book, a gift, or something special for yourself?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass recent history excluding the newly added one (managed internally by mapping)
      const result = await chatWithLibrarian(messages, userMsg.text);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text,
        relatedProductIds: result.productIds
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[600px] max-h-[80vh] animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="bg-nypl-red text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-2 rounded-full">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-serif font-bold">The Librarian</h3>
            <p className="text-xs text-white/80">AI Assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-gray-900 text-white rounded-tr-sm' 
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              {/* Recommended Products Embed */}
              {msg.relatedProductIds && msg.relatedProductIds.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {msg.relatedProductIds.map(pid => {
                    const p = products.find(prod => prod.id === pid);
                    if (!p) return null;
                    return (
                      <div 
                        key={pid} 
                        onClick={() => onProductClick(pid)}
                        className="bg-gray-50 p-2 rounded border border-gray-200 cursor-pointer hover:border-nypl-red hover:shadow-sm transition-all text-left"
                      >
                        <img src={p.image} className="w-full h-20 object-cover rounded mb-2" alt={p.title} />
                        <div className="font-bold text-xs truncate text-gray-900">{p.title}</div>
                        <div className="text-xs text-nypl-red">${p.price}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-nypl-red rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-nypl-red rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-nypl-red rounded-full animate-bounce delay-200" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for a recommendation..."
            className="flex-1 bg-gray-100 border-none rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-nypl-red/20 focus:outline-none"
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-nypl-red text-white p-3 rounded-full hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
