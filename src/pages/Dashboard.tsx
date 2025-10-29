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

type UserRole = 'client' | 'operator' | 'okk' | 'admin';
type UserStatus = 'online' | 'jira' | 'break' | 'offline';

interface User {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

interface Chat {
  id: string;
  clientName: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  assignedTo?: string;
}

const mockChats: Chat[] = [
  {
    id: '1',
    clientName: 'Петр Смирнов',
    lastMessage: 'Здравствуйте, у меня вопрос по заказу',
    timestamp: '14:32',
    unread: 2,
    assignedTo: 'Анна Иванова',
  },
  {
    id: '2',
    clientName: 'Мария Кузнецова',
    lastMessage: 'Спасибо за помощь!',
    timestamp: '13:15',
    unread: 0,
    assignedTo: 'Анна Иванова',
  },
  {
    id: '3',
    clientName: 'Алексей Попов',
    lastMessage: 'Когда будет доставка?',
    timestamp: '12:45',
    unread: 1,
  },
];

const mockOperators: User[] = [
  { id: '1', name: 'Анна Иванова', role: 'operator', status: 'online' },
  { id: '2', name: 'Дмитрий Волков', role: 'operator', status: 'online' },
  { id: '3', name: 'Елена Соколова', role: 'okk', status: 'jira' },
  { id: '4', name: 'Игорь Морозов', role: 'operator', status: 'break' },
  { id: '5', name: 'Ольга Новикова', role: 'operator', status: 'offline' },
];

const mockMessages = [
  { id: '1', sender: 'client', text: 'Здравствуйте, у меня вопрос по заказу', time: '14:30' },
  { id: '2', sender: 'operator', text: 'Здравствуйте! Чем могу помочь?', time: '14:31' },
  { id: '3', sender: 'client', text: 'Когда придет моя посылка?', time: '14:32' },
];

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
  { id: 'knowledge', label: 'База знаний', icon: 'BookOpen' as const, roles: ['operator', 'okk', 'admin'] },
  { id: 'monitoring', label: 'Мониторинг операторов', icon: 'Monitor' as const, roles: ['okk', 'admin'] },
  { id: 'quality', label: 'Портал QC', icon: 'Star' as const, roles: ['okk', 'admin'] },
  { id: 'employees', label: 'Управление сотрудниками', icon: 'Users' as const, roles: ['admin'] },
  { id: 'statuses', label: 'Управление статусами', icon: 'Settings' as const, roles: ['admin'] },
  { id: 'analytics', label: 'Аналитика и отчёты', icon: 'BarChart3' as const, roles: ['okk', 'admin'] },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(mockChats[0]);
  const [activeSection, setActiveSection] = useState('chats');
  const [messageText, setMessageText] = useState('');
  const [userStatus, setUserStatus] = useState<UserStatus>('online');

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
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/staff');
  };

  const handleNavigateToUsers = () => {
    navigate('/users');
  };

  const handleStatusChange = (newStatus: UserStatus) => {
    setUserStatus(newStatus);
    if (currentUser) {
      setCurrentUser({ ...currentUser, status: newStatus });
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
                <div className="relative">
                  <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input placeholder="Поиск по чатам..." className="pl-10" />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {mockChats.map((chat) => (
                    <Card
                      key={chat.id}
                      className={`p-3 cursor-pointer transition-all hover-scale ${
                        selectedChat?.id === chat.id
                          ? 'bg-accent border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 mt-1">
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {chat.clientName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm truncate">{chat.clientName}</p>
                            <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            {chat.lastMessage}
                          </p>
                          {chat.assignedTo && (
                            <Badge variant="secondary" className="text-xs">
                              <Icon name="User" size={10} className="mr-1" />
                              {chat.assignedTo}
                            </Badge>
                          )}
                        </div>
                        {chat.unread > 0 && (
                          <Badge className="gradient-bg text-white">{chat.unread}</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </aside>

            <main className="flex-1 flex flex-col bg-background">
              {selectedChat ? (
                <>
                  <header className="p-4 border-b border-border bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {selectedChat.clientName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="font-bold">{selectedChat.clientName}</h2>
                          <p className="text-xs text-muted-foreground">Онлайн</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Icon name="Phone" size={16} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Icon name="Video" size={16} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Icon name="MoreVertical" size={16} />
                        </Button>
                      </div>
                    </div>
                  </header>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4 max-w-4xl mx-auto">
                      {mockMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === 'operator' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                          <div
                            className={`max-w-md p-3 rounded-2xl ${
                              msg.sender === 'operator'
                                ? 'gradient-bg text-white'
                                : 'bg-card border border-border'
                            }`}
                          >
                            <p className="text-sm mb-1">{msg.text}</p>
                            <span className={`text-xs ${msg.sender === 'operator' ? 'text-white/70' : 'text-muted-foreground'}`}>
                              {msg.time}
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
                        className="flex-1"
                      />
                      <Button className="gradient-bg text-white" size="icon">
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
                  {mockOperators.map((operator) => (
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

      case 'knowledge':
        return (
          <div className="flex-1 p-6">
            <h2 className="text-2xl font-bold mb-4">База знаний сотрудников</h2>
            <p className="text-muted-foreground">Раздел в разработке</p>
          </div>
        );

      case 'monitoring':
        return (
          <div className="flex-1 p-6">
            <h2 className="text-2xl font-bold mb-4">Мониторинг операторов</h2>
            <p className="text-muted-foreground">Раздел в разработке</p>
          </div>
        );

      case 'quality':
        return (
          <div className="flex-1 p-6">
            <h2 className="text-2xl font-bold mb-4">Портал оценки качества (QC)</h2>
            <p className="text-muted-foreground">Здесь ОКК могут оценивать работу операторов</p>
          </div>
        );

      case 'statuses':
        return (
          <div className="flex-1 p-6">
            <h2 className="text-2xl font-bold mb-4">Управление статусами</h2>
            <p className="text-muted-foreground">Раздел в разработке</p>
          </div>
        );

      case 'analytics':
        return (
          <div className="flex-1 p-6">
            <h2 className="text-2xl font-bold mb-4">Аналитика и отчёты</h2>
            <p className="text-muted-foreground">Раздел в разработке</p>
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
