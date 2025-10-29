-- Таблица для комментариев/заметок о клиентах
CREATE TABLE IF NOT EXISTS chat_notes (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id),
    operator_id INTEGER NOT NULL REFERENCES users(id),
    note_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для оценок QC
CREATE TABLE IF NOT EXISTS qc_ratings (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id),
    operator_id INTEGER NOT NULL REFERENCES users(id),
    qc_user_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_chat_notes_chat_id ON chat_notes(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_notes_operator_id ON chat_notes(operator_id);
CREATE INDEX IF NOT EXISTS idx_qc_ratings_chat_id ON qc_ratings(chat_id);
CREATE INDEX IF NOT EXISTS idx_qc_ratings_operator_id ON qc_ratings(operator_id);
CREATE INDEX IF NOT EXISTS idx_qc_ratings_qc_user_id ON qc_ratings(qc_user_id);