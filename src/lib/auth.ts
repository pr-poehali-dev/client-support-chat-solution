const AUTH_API = 'https://functions.poehali.dev/a2ac04f7-91da-414c-ac5d-cb2d8fa5292d';
const USERS_API = 'https://functions.poehali.dev/1aabd452-d487-4be4-bc06-21ef796424d3';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'client' | 'operator' | 'okk' | 'admin';
  status: 'online' | 'jira' | 'break' | 'offline';
  department?: string;
}

export const authService = {
  async login(username: string, password: string): Promise<{ session_token: string; user: User }> {
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('session_token', data.session_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('session_token');
    if (token) {
      await fetch(AUTH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token,
        },
        body: JSON.stringify({ action: 'logout' }),
      });
    }
    localStorage.removeItem('session_token');
    localStorage.removeItem('user');
  },

  async verifySession(): Promise<{ valid: boolean; user?: User }> {
    const token = localStorage.getItem('session_token');
    if (!token) {
      return { valid: false };
    }

    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': token,
      },
      body: JSON.stringify({ action: 'verify' }),
    });

    if (!response.ok) {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user');
      return { valid: false };
    }

    const data = await response.json();
    if (data.valid) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getSessionToken(): string | null {
    return localStorage.getItem('session_token');
  },

  async updateStatus(status: 'online' | 'jira' | 'break' | 'offline'): Promise<void> {
    const token = localStorage.getItem('session_token');
    if (!token) {
      throw new Error('No session token');
    }

    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': token,
      },
      body: JSON.stringify({ action: 'update_status', status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update status');
    }

    const user = this.getCurrentUser();
    if (user) {
      user.status = status;
      localStorage.setItem('user', JSON.stringify(user));
    }
  },
};

export const usersService = {
  async getUsers(): Promise<User[]> {
    const token = authService.getSessionToken();
    const response = await fetch(USERS_API, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': token || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  },

  async createUser(userData: {
    username: string;
    password: string;
    full_name: string;
    role: string;
    department?: string;
  }): Promise<User> {
    const token = authService.getSessionToken();
    const response = await fetch(USERS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': token || '',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }

    return response.json();
  },

  async updateUser(userData: {
    id: number;
    username?: string;
    password?: string;
    full_name?: string;
    role?: string;
    department?: string;
    is_active?: boolean;
  }): Promise<User> {
    const token = authService.getSessionToken();
    const response = await fetch(USERS_API, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': token || '',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }

    return response.json();
  },
};