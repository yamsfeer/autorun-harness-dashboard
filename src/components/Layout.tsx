import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../stores/useStore';

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export default function Layout({ children, sidebar }: LayoutProps) {
  const navigate = useNavigate();
  const { connected, setToken, projects } = useStore();
  const activeProjects = projects.filter(p => p.status === 'active').length;

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-parchment">
      {/* Header */}
      <header className="h-14 bg-ivory border-b border-borderCream flex items-center justify-between px-5 shrink-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="text-sm font-medium font-serif text-nearblack hover:text-terracotta transition-colors py-2"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Autorun Harness
        </button>

        <div className="flex items-center gap-4">
          {/* 项目计数 */}
          <span className="text-xs text-stone">
            {projects.length} 个项目{activeProjects > 0 && ` · ${activeProjects} 运行中`}
          </span>

          {/* 连接状态 */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connected ? 'bg-warmGreen' : 'bg-stone'
              }`}
            />
            <span className="text-xs text-stone">
              {connected ? '在线' : '离线'}
            </span>
          </div>

          {/* 退出 */}
          <button
            onClick={handleLogout}
            className="text-stone hover:text-olive text-xs transition-colors py-2"
          >
            退出
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebar && (
          <aside className="w-44 bg-ivory border-r border-borderCream flex flex-col shrink-0 overflow-y-auto">
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
