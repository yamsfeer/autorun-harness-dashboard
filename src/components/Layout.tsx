import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../stores/useStore';

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export default function Layout({ children, sidebar }: LayoutProps) {
  const navigate = useNavigate();
  const { connected, setToken } = useStore();

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header - 极简 */}
      <header className="h-9 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors"
        >
          Autorun Harness
        </button>

        <div className="flex items-center gap-3">
          {/* 连接状态 */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-gray-400">
              {connected ? '在线' : '离线'}
            </span>
          </div>

          {/* 退出 */}
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            退出
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebar && (
          <aside className="w-44 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto">
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
