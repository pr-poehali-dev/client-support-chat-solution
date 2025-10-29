import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { chatsService } from '@/lib/chats';

interface MyRatingsSectionProps {
  currentUserId?: string;
}

const MyRatingsSection = ({ currentUserId }: MyRatingsSectionProps) => {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    if (currentUserId) {
      loadRatings();
    }
  }, [currentUserId]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const data = await chatsService.getQCRatings(parseInt(currentUserId!));
      setRatings(data);
      
      if (data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.score, 0) / data.length;
        setAverageScore(Math.round(avg));
      }
    } catch (error) {
      console.error('Failed to load ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Icon name="Loader2" className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <>
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-3xl font-bold">{averageScore}</div>
              <div className="text-xs">Средний балл</div>
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">Ваша производительность</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Всего оценок: <strong>{ratings.length}</strong>
            </p>
            
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {ratings.filter(r => r.score >= 80).length}
                </div>
                <div className="text-xs text-muted-foreground">Отлично (80+)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {ratings.filter(r => r.score >= 60 && r.score < 80).length}
                </div>
                <div className="text-xs text-muted-foreground">Хорошо (60-79)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {ratings.filter(r => r.score < 60).length}
                </div>
                <div className="text-xs text-muted-foreground">Требует улучшения (&lt;60)</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {ratings.length === 0 ? (
          <Card className="p-12 text-center">
            <Icon name="Award" className="mx-auto mb-4 text-muted-foreground" size={48} />
            <h3 className="font-bold text-lg mb-2">Пока нет оценок</h3>
            <p className="text-sm text-muted-foreground">
              Ваши оценки от QC появятся здесь после проверки чатов
            </p>
          </Card>
        ) : (
          ratings.map((rating) => (
            <Card key={rating.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">Чат с {rating.client_name}</h4>
                    <Badge className={`${getScoreBadge(rating.score)} text-white`}>
                      {rating.score} баллов
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Оценку поставил: {rating.qc_user_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(rating.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                
                <div className={`text-5xl font-bold ${getScoreColor(rating.score)}`}>
                  {rating.score}
                </div>
              </div>
              
              {rating.comment && (
                <div className="mt-4 p-4 rounded-lg bg-muted">
                  <p className="text-sm font-semibold mb-1">Комментарий от QC:</p>
                  <p className="text-sm">{rating.comment}</p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </>
  );
};

export default MyRatingsSection;
