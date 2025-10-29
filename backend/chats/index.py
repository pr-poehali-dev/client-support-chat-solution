import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Chat and message management - create chats, send/receive messages
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id attribute
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    
    try:
        body_data = json.loads(event.get('body', '{}')) if event.get('body') else {}
        action = body_data.get('action', '')
        
        if method == 'POST':
            if action == 'create_chat':
                return handle_create_chat(body_data, conn)
            elif action == 'send_message':
                return handle_send_message(body_data, conn)
            elif action == 'get_messages':
                return handle_get_messages(body_data, conn)
        
        elif method == 'GET':
            return handle_get_chats(event, conn)
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid action'}),
            'isBase64Encoded': False
        }
    
    finally:
        conn.close()


def handle_create_chat(body_data: Dict[str, Any], conn) -> Dict[str, Any]:
    client_name = body_data.get('client_name', '')
    client_email = body_data.get('client_email')
    
    if not client_name:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Client name required'}),
            'isBase64Encoded': False
        }
    
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO chats (client_name, client_email, status)
        VALUES (%s, %s, 'waiting')
        RETURNING id, client_name, client_email, status, created_at
        """,
        (client_name, client_email)
    )
    chat = cursor.fetchone()
    
    cursor.execute(
        """
        INSERT INTO messages (chat_id, sender_type, message_text)
        VALUES (%s, 'system', %s)
        """,
        (chat['id'], f'Добро пожаловать, {client_name}! Ожидайте подключения оператора...')
    )
    
    conn.commit()
    
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(dict(chat), default=str),
        'isBase64Encoded': False
    }


def handle_send_message(body_data: Dict[str, Any], conn) -> Dict[str, Any]:
    chat_id = body_data.get('chat_id')
    sender_type = body_data.get('sender_type', 'client')
    sender_id = body_data.get('sender_id')
    message_text = body_data.get('message_text', '')
    
    if not chat_id or not message_text:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Chat ID and message text required'}),
            'isBase64Encoded': False
        }
    
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO messages (chat_id, sender_type, sender_id, message_text)
        VALUES (%s, %s, %s, %s)
        RETURNING id, chat_id, sender_type, sender_id, message_text, created_at
        """,
        (chat_id, sender_type, sender_id, message_text)
    )
    message = cursor.fetchone()
    
    cursor.execute(
        "UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = %s",
        (chat_id,)
    )
    
    conn.commit()
    
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(dict(message), default=str),
        'isBase64Encoded': False
    }


def handle_get_messages(body_data: Dict[str, Any], conn) -> Dict[str, Any]:
    chat_id = body_data.get('chat_id')
    
    if not chat_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Chat ID required'}),
            'isBase64Encoded': False
        }
    
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT m.id, m.chat_id, m.sender_type, m.sender_id, m.message_text, m.created_at,
               u.full_name as sender_name
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = %s
        ORDER BY m.created_at ASC
        """,
        (chat_id,)
    )
    messages = cursor.fetchall()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps([dict(msg) for msg in messages], default=str),
        'isBase64Encoded': False
    }


def handle_get_chats(event: Dict[str, Any], conn) -> Dict[str, Any]:
    params = event.get('queryStringParameters') or {}
    status = params.get('status')
    
    cursor = conn.cursor()
    
    if status:
        cursor.execute(
            """
            SELECT c.id, c.client_name, c.client_email, c.assigned_operator_id, c.status,
                   c.created_at, c.updated_at,
                   u.full_name as assigned_operator_name,
                   (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND is_read = false AND sender_type = 'client') as unread_count,
                   (SELECT message_text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                   (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
            FROM chats c
            LEFT JOIN users u ON c.assigned_operator_id = u.id
            WHERE c.status = %s
            ORDER BY c.updated_at DESC
            """,
            (status,)
        )
    else:
        cursor.execute(
            """
            SELECT c.id, c.client_name, c.client_email, c.assigned_operator_id, c.status,
                   c.created_at, c.updated_at,
                   u.full_name as assigned_operator_name,
                   (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND is_read = false AND sender_type = 'client') as unread_count,
                   (SELECT message_text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                   (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
            FROM chats c
            LEFT JOIN users u ON c.assigned_operator_id = u.id
            ORDER BY c.updated_at DESC
            """
        )
    
    chats = cursor.fetchall()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps([dict(chat) for chat in chats], default=str),
        'isBase64Encoded': False
    }
