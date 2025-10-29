import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

const ClientChat = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'system',
      text: 'Здравствуйте! Вас приветствует служба поддержки. Опишите ваш вопрос, и мы свяжем вас с оператором.',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [messageText, setMessageText] = useState('');
  const [clientName, setClientName] = useState('');
  const [chatStarted, setChatStarted] = useState(false);

  const handleStartChat = () => {
    if (!clientName.trim()) return;
    setChatStarted(true);
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        sender: 'system',
        text: `Добро пожаловать, ${clientName}! Ожидайте подключения оператора...`,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      sender: 'client',
      text: messageText,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages([...messages, newMessage]);
    setMessageText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatStarted) {
        handleSendMessage();
      } else {
        handleStartChat();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col animate-scale-in">
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
              <Icon name="Headphones" className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl">Поддержка SupportHub</h1>
              <p className="text-sm text-muted-foreground">Мы всегда на связи</p>
            </div>
          </div>
        </div>

        {!chatStarted ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-4">
              <div className="text-center space-y-2 mb-6">
                <div className="w-16 h-16 rounded-full gradient-bg mx-auto flex items-center justify-center mb-4">
                  <Icon name="MessageSquare" className="text-white" size={32} />
                </div>
                <h2 className="font-bold text-2xl">Начать чат</h2>
                <p className="text-muted-foreground">Представьтесь, чтобы мы могли вам помочь</p>
              </div>
              
              <div className="space-y-4">
                <Input
                  placeholder="Введите ваше имя"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-lg"
                />
                <Button
                  onClick={handleStartChat}
                  className="w-full gradient-bg text-white"
                  disabled={!clientName.trim()}
                >
                  <Icon name="Send" className="mr-2" size={18} />
                  Начать чат
                </Button>
              </div>

              <div className="text-center mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Вы сотрудник?</p>
                <a href="/staff" className="text-primary hover:underline text-sm font-medium">
                  Войти в панель сотрудника →
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === 'client' ? 'justify-end' : 'justify-start'
                    } animate-fade-in`}
                  >
                    {msg.sender !== 'client' && (
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {msg.sender === 'system' ? '🤖' : 'ОП'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-md p-3 rounded-2xl ${
                        msg.sender === 'client'
                          ? 'gradient-bg text-white'
                          : msg.sender === 'system'
                          ? 'bg-muted'
                          : 'bg-card border border-border'
                      }`}
                    >
                      <p className="text-sm mb-1">{msg.text}</p>
                      <span
                        className={`text-xs ${
                          msg.sender === 'client' ? 'text-white/70' : 'text-muted-foreground'
                        }`}
                      >
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Button variant="outline" size="icon">
                  <Icon name="Paperclip" size={18} />
                </Button>
                <Input
                  placeholder="Введите сообщение..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  className="gradient-bg text-white"
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                >
                  <Icon name="Send" size={18} />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ClientChat;
