import { useState } from 'react';
import { api } from '../api/client';
import { useStore } from '../stores/useStore';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setToken = useStore((s) => s.setToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login(username, password);
      if (result.success && result.token) {
        setToken(result.token);
      } else {
        setError('登录失败');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment">
      <div className="max-w-md w-full p-8 bg-ivory rounded-2xl border border-borderCream shadow-whisper">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium font-serif text-nearblack">Dashboard</h1>
          <p className="text-olive mt-2">请登录以继续</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-olive mb-2">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-borderCream rounded-xl bg-white focus:ring-2 focus:ring-focusBlue/30 focus:border-focusBlue transition-colors"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-olive mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-3 border border-borderCream rounded-xl bg-white focus:ring-2 focus:ring-focusBlue/30 focus:border-focusBlue transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-warmRedLight text-warmRed rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 px-4 bg-terracotta hover:bg-terracotta-hover text-ivory font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
