INSERT INTO users (username, password_hash, full_name, role, status, department, is_active)
VALUES ('123', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eiKjH.Xgq8zC', 'Главный Администратор', 'admin', 'online', 'Администрация', true)
ON CONFLICT (username) DO UPDATE 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eiKjH.Xgq8zC',
    full_name = 'Главный Администратор',
    role = 'admin',
    is_active = true;