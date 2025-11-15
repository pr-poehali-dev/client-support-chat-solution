import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { authService } from '@/lib/auth';
import { chatsService, Chat as ChatType, Message } from '@/lib/chats';
import { useToast } from '@/hooks/use-toast';
import MyRatingsSection from '@/components/MyRatingsSection';
import QCPortalSection from '@/components/QCPortalSection';

type UserRole = 'client' | 'operator' | 'okk' | 'admin';
type UserStatus = 'online' | 'jira' | 'break' | 'offline';

interface User {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

const statusConfig = {
  online: { label: 'На линии', color: 'bg-green-500', icon: 'CircleCheck' as const },
  jira: { label: 'Обработка Jira', color: 'bg-orange-500', icon: 'FileText' as const },
  break: { label: 'Перерыв', color: 'bg-yellow-500', icon: 'Coffee' as const },
  offline: { label: 'Не в сети', color: 'bg-gray-500', icon: 'CircleOff' as const },
};

const roleLabels = {
  client: 'Клиент',
  operator: 'Оператор КЦ',
  okk: 'ОКК КЦ',
  admin: 'Супер админ',
};

const menuItems = [
  { id: 'chats', label: 'Чаты с клиентами', icon: 'MessageSquare' as const, roles: ['operator', 'okk', 'admin'] },
  { id: 'my-ratings', label: 'Мои оценки', icon: 'Award' as const, roles: ['operator', 'okk', 'admin'] },
  { id: 'knowledge', label: 'База знаний', icon: 'BookOpen' as const, roles: ['operator', 'okk', 'admin'] },
  { id: 'monitoring', label: 'Мониторинг операторов', icon: 'Monitor' as const, roles: ['okk', 'admin'] },
  { id: 'quality', label: 'Портал QC', icon: 'Star' as const, roles: ['okk', 'admin'] },
  { id: 'employees', label: 'Управление сотрудниками', icon: 'Users' as const, roles: ['admin'] },
  { id: 'statuses', label: 'Управление статусами', icon: 'Settings' as const, roles: ['admin'] },
  { id: 'analytics', label: 'Аналитика и отчёты', icon: 'BarChart3' as const, roles: ['okk', 'admin'] },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<ChatType[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeSection, setActiveSection] = useState('chats');
  const [messageText, setMessageText] = useState('');
  const [userStatus, setUserStatus] = useState<UserStatus>('online');
  const [chatFilter, setChatFilter] = useState<'all' | 'waiting' | 'active' | 'closed'>('all');
  const [operators, setOperators] = useState<User[]>([]);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser({
        id: user.id.toString(),
        name: user.full_name,
        role: user.role,
        status: user.status,
      });
      setUserStatus(user.status);
    }
    loadOperators();
  }, []);

  const loadOperators = async () => {
    try {
      const ops = await authService.getOperators();
      setOperators(ops.map(op => ({
        id: op.id.toString(),
        name: op.full_name,
        role: op.role,
        status: op.status,
      })));
    } catch (error) {
      console.error('Failed to load operators:', error);
    }
  };

  useEffect(() => {
    if (activeSection === 'chats') {
      loadChats();
      const interval = setInterval(loadChats, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSection]);

  useEffect(() => {
    if (selectedChatId) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChatId]);

  const loadChats = async () => {
    try {
      const data = await chatsService.getChats();
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedChatId) return;
    try {
      const msgs = await chatsService.getMessages(selectedChatId);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChatId || !currentUser) return;
    
    const tempText = messageText;
    setMessageText('');
    
    try {
      await chatsService.sendMessage(selectedChatId, tempText, 'operator', parseInt(currentUser.id));
      await loadMessages();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
      setMessageText(tempText);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/staff');
  };

  const handleNavigateToUsers = () => {
    navigate('/users');
  };

  const handleStatusChange = async (newStatus: UserStatus) => {
    try {
      await authService.updateStatus(newStatus);
      setUserStatus(newStatus);
      if (currentUser) {
        setCurrentUser({ ...currentUser, status: newStatus });
      }
      toast({
        title: 'Статус обновлен',
        description: `Ваш статус изменен на "${statusConfig[newStatus].label}"`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive',
      });
    }
  };

  const availableMenuItems = currentUser 
    ? menuItems.filter(item => item.roles.includes(currentUser.role))
    : [];

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'chats':
        return (
          <div className="flex-1 flex">
            <aside className="w-80 border-r border-border flex flex-col bg-card">
              <div className="p-4 border-b border-border">
                <h2 className="font-bold text-lg mb-3">Чаты с клиентами</h2>
                <div className="relative mb-3">
                  <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input placeholder="Поиск по чатам..." className="pl-10" />
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant={chatFilter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setChatFilter('all')}
                  >
                    Все
                  </Button>
                  <Button
                    variant={chatFilter === 'waiting' ? 'default' : 'ghost'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setChatFilter('waiting')}
                  >
                    Ожидают
                  </Button>
                  <Button
                    variant={chatFilter === 'active' ? 'default' : 'ghost'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setChatFilter('active')}
                  >
                    Активные
                  </Button>
                  <Button
                    variant={chatFilter === 'closed' ? 'default' : 'ghost'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setChatFilter('closed')}
                  >
                    Закрытые
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {chats.filter(chat => chatFilter === 'all' || chat.status === chatFilter).map((chat) => (
                    <Card
                      key={chat.id}
                      className={`p-3 cursor-pointer transition-all hover-scale ${
                        selectedChatId === chat.id
                          ? 'bg-accent border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedChatId(chat.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 mt-1">
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {chat.client_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm truncate">{chat.client_name}</p>
                            <span className="text-xs text-muted-foreground">
                              {chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            {chat.last_message || 'Нет сообщений'}
                          </p>
                          {chat.assigned_operator_name && (
                            <Badge variant="secondary" className="text-xs">
                              <Icon name="User" size={10} className="mr-1" />
                              {chat.assigned_operator_name}
                            </Badge>
                          )}
                        </div>
                        {(chat.unread_count || 0) > 0 && (
                          <Badge className="gradient-bg text-white">{chat.unread_count}</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </aside>

            <main className="flex-1 flex flex-col bg-background">
              {selectedChatId ? (
                <>
                  <header className="p-4 border-b border-border bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {chats.find(c => c.id === selectedChatId)?.client_name.split(' ').map(n => n[0]).join('') || 'К'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="font-bold">{chats.find(c => c.id === selectedChatId)?.client_name}</h2>
                          <p className="text-xs text-muted-foreground">Онлайн</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {chats.find(c => c.id === selectedChatId)?.status !== 'closed' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={async () => {
                                try {
                                  await chatsService.closeChat(selectedChatId);
                                  toast({ title: 'Чат закрыт' });
                                  loadChats();
                                } catch (error) {
                                  toast({ title: 'Ошибка', variant: 'destructive' });
                                }
                              }}
                            >
                              <Icon name="CheckCircle" size={16} className="mr-1" />
                              Закрыть
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const operatorId = prompt('ID оператора для эскалации (или пусто для отмены назначения):');
                                if (operatorId !== null) {
                                  chatsService.escalateChat(selectedChatId, operatorId ? parseInt(operatorId) : undefined)
                                    .then(() => {
                                      toast({ title: 'Чат переназначен' });
                                      loadChats();
                                    })
                                    .catch(() => toast({ title: 'Ошибка', variant: 'destructive' }));
                                }
                              }}
                            >
                              <Icon name="UserPlus" size={16} className="mr-1" />
                              Эскалация
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const note = prompt('Комментарий о клиенте:');
                                if (note && currentUser) {
                                  chatsService.addNote(selectedChatId, parseInt(currentUser.id), note)
                                    .then(() => toast({ title: 'Комментарий добавлен' }))
                                    .catch(() => toast({ title: 'Ошибка', variant: 'destructive' }));
                                }
                              }}
                            >
                              <Icon name="FileText" size={16} className="mr-1" />
                              Комментарий
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </header>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4 max-w-4xl mx-auto">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_type === 'operator' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                          <div
                            className={`max-w-md p-3 rounded-2xl ${
                              msg.sender_type === 'operator'
                                ? 'gradient-bg text-white'
                                : msg.sender_type === 'system'
                                ? 'bg-muted'
                                : 'bg-card border border-border'
                            }`}
                          >
                            <p className="text-sm mb-1">{msg.message_text}</p>
                            <span className={`text-xs ${msg.sender_type === 'operator' ? 'text-white/70' : 'text-muted-foreground'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <footer className="p-4 border-t border-border bg-card">
                    <div className="flex gap-2 max-w-4xl mx-auto">
                      <Button variant="outline" size="icon">
                        <Icon name="Paperclip" size={18} />
                      </Button>
                      <Input
                        placeholder="Введите сообщение..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
                  </footer>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full gradient-bg mx-auto mb-4 flex items-center justify-center">
                      <Icon name="MessageSquare" className="text-white" size={32} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Выберите чат</h3>
                    <p className="text-muted-foreground text-sm">
                      Выберите чат из списка, чтобы начать общение
                    </p>
                  </div>
                </div>
              )}
            </main>

            <aside className="w-72 border-l border-border bg-card p-4">
              <h3 className="font-bold mb-4">Операторы онлайн</h3>
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="space-y-2">
                  {operators.map((operator) => (
                    <Card key={operator.id} className="p-3 hover-scale cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                              {operator.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
                              statusConfig[operator.status].color
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{operator.name}</p>
                          <p className="text-xs text-muted-foreground">{roleLabels[operator.role]}</p>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center gap-2">
                        <Icon name={statusConfig[operator.status].icon} size={14} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {statusConfig[operator.status].label}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </aside>
          </div>
        );

      case 'my-ratings':
        return (
          <div className="flex-1 p-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Мои оценки QC</h2>
              
              <MyRatingsSection currentUserId={currentUser?.id} />
            </div>
          </div>
        );

      case 'knowledge':
        return (
          <div className="flex-1 p-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">База знаний сотрудников</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 hover-scale cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Icon name="BookOpen" className="text-blue-500" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">Руководства по продуктам</h3>
                      <p className="text-sm text-muted-foreground">Инструкции и описания всех продуктов компании</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 hover-scale cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Icon name="MessageSquare" className="text-green-500" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">Шаблоны ответов</h3>
                      <p className="text-sm text-muted-foreground">Готовые ответы на частые вопросы</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 hover-scale cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Icon name="HelpCircle" className="text-purple-500" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">FAQ</h3>
                      <p className="text-sm text-muted-foreground">Часто задаваемые вопросы и ответы</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 hover-scale cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Icon name="Video" className="text-orange-500" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">Видео-обучение</h3>
                      <p className="text-sm text-muted-foreground">Обучающие материалы для новых сотрудников</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        );

      case 'monitoring':
        return (
          <div className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Мониторинг операторов</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Icon name="UserCheck" className="text-green-500" size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{mockOperators.filter(o => o.status === 'online').length}</p>
                      <p className="text-xs text-muted-foreground">На линии</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Icon name="FileText" className="text-orange-500" size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{mockOperators.filter(o => o.status === 'jira').length}</p>
                      <p className="text-xs text-muted-foreground">В Jira</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Icon name="Coffee" className="text-yellow-500" size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{mockOperators.filter(o => o.status === 'break').length}</p>
                      <p className="text-xs text-muted-foreground">На перерыве</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                      <Icon name="UserX" className="text-gray-500" size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{mockOperators.filter(o => o.status === 'offline').length}</p>
                      <p className="text-xs text-muted-foreground">Офлайн</p>
                    </div>
                  </div>
                </Card>
              </div>
              
              <Card className="p-6">
                <h3 className="font-bold mb-4">Список операторов</h3>
                <div className="space-y-3">
                  {mockOperators.map((operator) => (
                    <div key={operator.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {operator.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${statusConfig[operator.status].color}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{operator.name}</p>
                          <p className="text-xs text-muted-foreground">{roleLabels[operator.role]}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        <Icon name={statusConfig[operator.status].icon} size={12} className="mr-1" />
                        {statusConfig[operator.status].label}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );

      case 'quality':
        return (
          <div className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Портал оценки качества (QC)</h2>
              
              <QCPortalSection currentUserId={currentUser ? parseInt(currentUser.id) : undefined} />
            </div>
          </div>
        );

      case 'statuses':
        return (
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Управление статусами</h2>
              
              <Card className="p-6">
                <h3 className="font-bold mb-4">Доступные статусы сотрудников</h3>
                <div className="space-y-4">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${config.color}`} />
                        <div>
                          <p className="font-semibold">{config.label}</p>
                          <p className="text-xs text-muted-foreground">Статус: {key}</p>
                        </div>
                      </div>
                      <Icon name={config.icon} className="text-muted-foreground" size={20} />
                    </div>
                  ))}
                </div>
              </Card>
              
              <Card className="p-6 mt-6">
                <h3 className="font-bold mb-2">Правила использования статусов</h3>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                  <li><strong>На линии</strong> — оператор готов принимать чаты</li>
                  <li><strong>Обработка Jira</strong> — работа с задачами в Jira</li>
                  <li><strong>Перерыв</strong> — временно недоступен</li>
                  <li><strong>Не в сети</strong> — оператор офлайн</li>
                </ul>
              </Card>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Аналитика и отчёты</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Всего чатов</h3>
                    <Icon name="MessageSquare" className="text-primary" size={20} />
                  </div>
                  <p className="text-3xl font-bold">{chats.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">За сегодня</p>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Активных</h3>
                    <Icon name="Activity" className="text-green-500" size={20} />
                  </div>
                  <p className="text-3xl font-bold">{chats.filter(c => c.status === 'active').length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Сейчас в работе</p>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Ожидают</h3>
                    <Icon name="Clock" className="text-orange-500" size={20} />
                  </div>
                  <p className="text-3xl font-bold">{chats.filter(c => c.status === 'waiting').length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Требуют внимания</p>
                </Card>
              </div>
              
              <Card className="p-6">
                <h3 className="font-bold mb-4">Детальная статистика</h3>
                <p className="text-sm text-muted-foreground">Графики и детальная аналитика появятся после накопления данных</p>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Icon name="Headphones" className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg">SupportHub</h1>
              <p className="text-xs text-muted-foreground">Платформа поддержки</p>
            </div>
          </div>
          
          <Card className="p-3 bg-sidebar-accent border-sidebar-border">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="gradient-bg text-white font-semibold">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{roleLabels[currentUser.role]}</p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 h-8 px-2">
                  <div className={`w-2 h-2 rounded-full ${statusConfig[userStatus].color}`} />
                  <span className="text-xs flex-1 text-left">{statusConfig[userStatus].label}</span>
                  <Icon name="ChevronDown" size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <DropdownMenuItem key={key} onClick={() => handleStatusChange(key as UserStatus)}>
                    <div className={`w-2 h-2 rounded-full ${config.color} mr-2`} />
                    {config.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        </div>

        <ScrollArea className="flex-1 px-2">
          <nav className="space-y-1 py-2">
            {availableMenuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 ${
                  activeSection === item.id ? 'gradient-bg text-white' : ''
                }`}
                onClick={() => {
                  if (item.id === 'employees') {
                    handleNavigateToUsers();
                  } else {
                    setActiveSection(item.id);
                  }
                }}
              >
                <Icon name={item.icon} size={18} />
                <span className="text-sm">{item.label}</span>
              </Button>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border">
          <Button variant="outline" className="w-full gap-2" size="sm" onClick={handleLogout}>
            <Icon name="LogOut" size={16} />
            Выход
          </Button>
        </div>
      </aside>

      {renderContent()}
    </div>
  );
};

export default Dashboard;