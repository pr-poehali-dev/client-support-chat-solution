CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('client', 'operator', 'okk', 'admin')),
    status VARCHAR(50) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'jira', 'break', 'offline')),
    department VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_users_username ON users(username);

INSERT INTO users (username, password_hash, full_name, role, status, department) 
VALUES 
('admin', '$2b$10$YourHashedPasswordHere', 'Супер Администратор', 'admin', 'online', 'Администрация'),
('anna.ivanova', '$2b$10$YourHashedPasswordHere', 'Анна Иванова', 'operator', 'online', 'Поддержка'),
('dmitry.volkov', '$2b$10$YourHashedPasswordHere', 'Дмитрий Волков', 'operator', 'online', 'Поддержка'),
('elena.sokolova', '$2b$10$YourHashedPasswordHere', 'Елена Соколова', 'okk', 'jira', 'Контроль качества'),
('igor.morozov', '$2b$10$YourHashedPasswordHere', 'Игорь Морозов', 'operator', 'break', 'Поддержка'),
('olga.novikova', '$2b$10$YourHashedPasswordHere', 'Ольга Новикова', 'operator', 'offline', 'Поддержка')
ON CONFLICT (username) DO NOTHING;