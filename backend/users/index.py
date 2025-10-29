import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User management for admin - CRUD operations on users
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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    session_token = headers.get('x-session-token') or headers.get('X-Session-Token')
    
    if not session_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT u.role FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = %s AND s.expires_at > CURRENT_TIMESTAMP
            """,
            (session_token,)
        )
        session_user = cursor.fetchone()
        
        if not session_user or session_user['role'] != 'admin':
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Access denied - admin only'}),
                'isBase64Encoded': False
            }
        
        if method == 'GET':
            return handle_get_users(conn)
        elif method == 'POST':
            return handle_create_user(event, conn)
        elif method == 'PUT':
            return handle_update_user(event, conn)
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        conn.close()


def handle_get_users(conn) -> Dict[str, Any]:
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, username, full_name, role, status, department, is_active, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        """
    )
    users = cursor.fetchall()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps([dict(user) for user in users], default=str),
        'isBase64Encoded': False
    }


def handle_create_user(event: Dict[str, Any], conn) -> Dict[str, Any]:
    body_data = json.loads(event.get('body', '{}'))
    
    username = body_data.get('username', '')
    password = body_data.get('password', '')
    full_name = body_data.get('full_name', '')
    role = body_data.get('role', 'client')
    department = body_data.get('department', '')
    
    if not username or not password or not full_name:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Username, password, and full_name required'}),
            'isBase64Encoded': False
        }
    
    if role not in ['client', 'operator', 'okk', 'admin']:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid role'}),
            'isBase64Encoded': False
        }
    
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO users (username, password_hash, full_name, role, department)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, username, full_name, role, status, department, is_active, created_at
        """,
        (username, password_hash, full_name, role, department)
    )
    new_user = cursor.fetchone()
    conn.commit()
    
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(dict(new_user), default=str),
        'isBase64Encoded': False
    }


def handle_update_user(event: Dict[str, Any], conn) -> Dict[str, Any]:
    body_data = json.loads(event.get('body', '{}'))
    
    user_id = body_data.get('id')
    username = body_data.get('username')
    full_name = body_data.get('full_name')
    role = body_data.get('role')
    department = body_data.get('department')
    is_active = body_data.get('is_active')
    password = body_data.get('password')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    update_fields = []
    params = []
    
    if username:
        update_fields.append("username = %s")
        params.append(username)
    if full_name:
        update_fields.append("full_name = %s")
        params.append(full_name)
    if role:
        update_fields.append("role = %s")
        params.append(role)
    if department is not None:
        update_fields.append("department = %s")
        params.append(department)
    if is_active is not None:
        update_fields.append("is_active = %s")
        params.append(is_active)
    if password:
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        update_fields.append("password_hash = %s")
        params.append(password_hash)
    
    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    params.append(user_id)
    
    cursor = conn.cursor()
    cursor.execute(
        f"""
        UPDATE users
        SET {', '.join(update_fields)}
        WHERE id = %s
        RETURNING id, username, full_name, role, status, department, is_active, updated_at
        """,
        params
    )
    updated_user = cursor.fetchone()
    conn.commit()
    
    if not updated_user:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(dict(updated_user), default=str),
        'isBase64Encoded': False
    }
