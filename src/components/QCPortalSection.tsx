import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { chatsService } from '@/lib/chats';
import { useToast } from '@/hooks/use-toast';

interface QCPortalSectionProps {
  currentUserId?: number;
}

const QCPortalSection = ({ currentUserId }: QCPortalSectionProps) => {
  const [closedChats, setClosedChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [score, setScore] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadClosedChats();
  }, []);

  const loadClosedChats = async () => {
    try {
      const data = await chatsService.getChats('closed');
      setClosedChats(data);
    } catch (error) {
      console.error('Failed to load closed chats:', error);
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedChat || !score || !currentUserId) return;

    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast({
        title: 'Ошибка',
        description: 'Оценка должна быть от 0 до 100',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await chatsService.addQCRating(
        selectedChat.id,
        selectedChat.assigned_operator_id,
        currentUserId,
        scoreNum,
        comment
      );
      
      toast({
        title: 'Оценка добавлена',
        description: 'Оператор получит уведомление о вашей оценке',
      });
      
      setScore('');
      setComment('');
      setSelectedChat(null);
      loadClosedChats();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить оценку',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="p-6 mb-6">
        <h3 className="font-bold mb-4">Критерии оценки</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border">
            <Icon name="MessageSquare" className="text-blue-500 mb-2" size={24} />
            <h4 className="font-semibold mb-1">Качество ответов</h4>
            <p className="text-xs text-muted-foreground">Полнота, корректность и вежливость</p>
          </div>
          <div className="p-4 rounded-lg border">
            <Icon name="Clock" className="text-green-500 mb-2" size={24} />
            <h4 className="font-semibold mb-1">Скорость реакции</h4>
            <p className="text-xs text-muted-foreground">Время первого ответа и решения</p>
          </div>
          <div className="p-4 rounded-lg border">
            <Icon name="Smile" className="text-purple-500 mb-2" size={24} />
            <h4 className="font-semibold mb-1">Удовлетворенность</h4>
            <p className="text-xs text-muted-foreground">Оценка клиентов</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4">Закрытые чаты для оценки</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {closedChats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Нет закрытых чатов для оценки
              </p>
            ) : (
              closedChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    selectedChat?.id === chat.id ? 'border-primary bg-accent' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{chat.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Оператор: {chat.assigned_operator_name || 'Не назначен'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      ID: {chat.id}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Закрыт: {new Date(chat.updated_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">Оценить качество работы</h3>
          
          {!selectedChat ? (
            <div className="text-center py-12">
              <Icon name="Star" className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-sm text-muted-foreground">
                Выберите чат слева для оценки
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm font-semibold">Чат с: {selectedChat.client_name}</p>
                <p className="text-xs text-muted-foreground">
                  Оператор: {selectedChat.assigned_operator_name}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="score">Оценка (0-100 баллов)</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="Введите оценку от 0 до 100"
                />
                <p className="text-xs text-muted-foreground">
                  80-100: Отлично | 60-79: Хорошо | 0-59: Требует улучшения
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Комментарий (необязательно)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Опишите что было хорошо и что нужно улучшить..."
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSubmitRating}
                disabled={!score || loading}
                className="w-full gradient-bg text-white"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Icon name="Send" className="mr-2" size={18} />
                    Отправить оценку
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default QCPortalSection;
