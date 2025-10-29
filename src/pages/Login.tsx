import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.login(username, password);
      toast({
        title: 'Успешный вход',
        description: 'Добро пожаловать в SupportHub!',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Ошибка входа',
        description: error instanceof Error ? error.message : 'Неверный логин или пароль',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6 animate-scale-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl gradient-bg mx-auto flex items-center justify-center mb-4">
            <Icon name="Headphones" className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold">SupportHub</h1>
          <p className="text-muted-foreground">Платформа клиентской поддержки</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Логин</Label>
            <div className="relative">
              <Icon
                name="User"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                id="username"
                type="text"
                placeholder="Введите логин"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Icon
                name="Lock"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gradient-bg text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                Вход...
              </>
            ) : (
              <>
                <Icon name="LogIn" className="mr-2" size={18} />
                Войти
              </>
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <p>Демо доступ:</p>
          <p className="font-mono">admin / demo123</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
