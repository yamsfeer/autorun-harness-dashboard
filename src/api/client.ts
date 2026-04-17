const API_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  private getToken(): string | null {
    const stored = localStorage.getItem('dashboard-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.token || null;
    }
    return null;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '请求失败' }));
      throw new Error(error.error || '请求失败');
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // 认证
  async login(username: string, password: string): Promise<{ success: boolean; token?: string }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async checkAuth(): Promise<{ authenticated: boolean }> {
    return this.request('/api/auth/check');
  }

  // 项目
  async getProjects(): Promise<any[]> {
    return this.request('/api/projects');
  }

  async addProject(path: string): Promise<any> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }

  async removeProject(id: string): Promise<void> {
    return this.request(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getProjectState(id: string): Promise<any> {
    return this.request(`/api/projects/${id}/state`);
  }

  async getProjectSpec(id: string): Promise<string> {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/api/projects/${id}/spec`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.text();
  }

  async getProjectProgress(id: string): Promise<string> {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/api/projects/${id}/progress`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.text();
  }

  // 截图 URL
  getScreenshotUrl(projectId: string, filename: string): string {
    const token = this.getToken();
    return `${API_URL}/api/projects/${projectId}/screenshots/${filename}?token=${token}`;
  }
}

export const api = new ApiClient();
