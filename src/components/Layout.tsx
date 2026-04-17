import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../stores/useStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { projects, connected, setToken } = useStore();

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-0 right-0 z-10">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">
              Autorun Harness Dashboard
            </h1>
            <span className="text-sm text-gray-500">
              {projects.length} 个项目
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* 连接状态 */}
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-gray-500">
                {connected ? '已连接' : '已断开'}
              </span>
            </div>

            {/* 退出按钮 */}
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
