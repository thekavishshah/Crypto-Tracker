import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StockMovement } from '@/types/stock';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface StockChatbotProps {
  stockData: StockMovement[];
  isVisible: boolean;
  onToggle: () => void;
}

const StockChatbot: React.FC<StockChatbotProps> = ({ stockData, isVisible, onToggle }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I can help you analyze stocks and provide investment recommendations based on current market data. What would you like to know?',
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('stock-advisor', {
        body: {
          question: input,
          stockData: stockData,
        },
      });

      if (error) throw error;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.advice,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting advice:', error);
      toast.error('Failed to get stock advice');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting to my analysis system. Please try again in a moment.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Stock Advisor
        </CardTitle>
        <Button onClick={onToggle} variant="ghost" size="sm">
          ×
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${
                  message.isBot ? 'justify-start' : 'justify-end'
                }`}
              >
                {message.isBot && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[280px] rounded-lg px-3 py-2 text-sm ${
                    message.isBot
                      ? 'bg-muted text-foreground'
                      : 'bg-primary text-white'
                  }`}
                >
                  {message.text}
                </div>
                {!message.isBot && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about stocks..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockChatbot;