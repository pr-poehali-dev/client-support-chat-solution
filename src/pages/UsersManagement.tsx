import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { User, usersService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const roleLabels = {
  client: 'Клиент',
  operator: 'Оператор КЦ',
  okk: 'ОКК КЦ',
  admin: 'Супер админ',
};

const statusConfig = {
  online: { label: 'На линии', color: 'bg-green-500' },
  jira: { label: 'Обработка Jira', color: 'bg-orange-500' },
  break: { label: 'Перерыв', color: 'bg-yellow-500' },
  offline: { label: 'Не в сети', color: 'bg-gray-500' },
};

const UsersManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'operator',
    department: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список пользователей',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await usersService.createUser(formData);
      toast({
        title: 'Успешно',
        description: 'Пользователь создан',
      });
      setDialogOpen(false);
      setFormData({ username: '', password: '', full_name: '', role: 'operator', department: '' });
      loadUsers();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать пользователя',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateUser = async (userId: number, updates: Partial<User> & { is_active?: boolean }) => {
    try {
      await usersService.updateUser({ id: userId, ...updates });
      toast({
        title: 'Успешно',
        description: 'Пользователь обновлён',
      });
      loadUsers();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить пользователя',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-2">
            <Icon name="ArrowLeft" className="mr-2" size={16} />
            Назад к дашборду
          </Button>
          <h1 className="text-3xl font-bold">Управление сотрудниками</h1>
          <p className="text-muted-foreground mt-1">Создание и редактирование учётных записей</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-white">
              <Icon name="UserPlus" className="mr-2" size={18} />
              Добавить сотрудника
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Новый сотрудник</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Логин</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">ФИО</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Иван Иванов"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Роль</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Клиент</SelectItem>
                    <SelectItem value="operator">Оператор КЦ</SelectItem>
                    <SelectItem value="okk">ОКК КЦ</SelectItem>
                    <SelectItem value="admin">Супер админ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Отдел</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Поддержка"
                />
              </div>
              <Button onClick={handleCreateUser} className="w-full gradient-bg text-white">
                Создать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <Icon name="Loader2" className="mx-auto animate-spin mb-4" size={32} />
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Сотрудник</TableHead>
                <TableHead>Логин</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Отдел</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Активен</TableHead>
                <TableHead>Дата создания</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{user.username}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{roleLabels[user.role]}</Badge>
                  </TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusConfig[user.status].color}`} />
                      <span className="text-sm">{statusConfig[user.status].label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={(user as any).is_active !== false}
                      onCheckedChange={(checked) => handleUpdateUser(user.id, { is_active: checked })}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date((user as any).created_at).toLocaleDateString('ru-RU')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default UsersManagement;