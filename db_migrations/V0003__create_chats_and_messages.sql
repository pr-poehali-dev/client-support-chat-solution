CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    assigned_operator_id INTEGER REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'closed')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id),
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('client', 'operator', 'system')),
    sender_id INTEGER REFERENCES users(id),
    message_text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chats_status ON chats(status);
CREATE INDEX idx_chats_assigned ON chats(assigned_operator_id);
CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_created ON messages(created_at);

INSERT INTO chats (client_name, status, created_at, updated_at)
VALUES 
('Петр Смирнов', 'waiting', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
('Мария Кузнецова', 'active', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
('Алексей Попов', 'waiting', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '15 minutes');

INSERT INTO messages (chat_id, sender_type, message_text, created_at)
VALUES 
(1, 'client', 'Здравствуйте, у меня вопрос по заказу', CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
(2, 'client', 'Добрый день! Не могу войти в личный кабинет', CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
(2, 'operator', 'Здравствуйте! Давайте разберёмся. Какая ошибка появляется?', CURRENT_TIMESTAMP - INTERVAL '44 minutes'),
(2, 'client', 'Спасибо за помощь!', CURRENT_TIMESTAMP - INTERVAL '43 minutes'),
(3, 'client', 'Когда будет доставка?', CURRENT_TIMESTAMP - INTERVAL '15 minutes');