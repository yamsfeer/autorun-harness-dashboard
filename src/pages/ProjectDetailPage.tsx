import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Layout from '../components/Layout';
import TaskBoard from '../components/TaskBoard';
import LogViewer from '../components/LogViewer';
import ReportsPage from '../components/ReportsPage';
import TaskDependencyGraph from '../components/TaskDependencyGraph';
import { api } from '../api/client';
import { useStore } from '../stores/useStore';
import { useSocket } from '../hooks/useSocket';

type Tab = 'board' | 'dependencies' | 'reports' | 'logs' | 'spec';

const tabs: { id: Tab; label: string }[] = [
  { id: 'board', label: '任务看板' },
  { id: 'dependencies', label: '任务依赖' },
  { id: 'reports', label: '评估报告' },
  { id: 'logs', label: '执行日志' },
  { id: 'spec', label: '产品规格' },
];

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projectStates, setProjectState, projects } = useStore();
  const { subscribeProject, unsubscribeProject } = useSocket();

  const [activeTab, setActiveTab] = useState<Tab>('board');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const project = projects.find(p => p.id === projectId);
  const state = projectStates[projectId || ''];

  useEffect(() => {
    if (!projectId) return;

    const loadState = async () => {
      setLoading(true);
      try {
        const data = await api.getProjectState(projectId);
        setProjectState(projectId, data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (!state) {
      loadState();
    } else {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      subscribeProject(projectId);
      return () => unsubscribeProject(projectId);
    }
  }, [projectId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-olive text-sm">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (error || !project || !state) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-warmRed mb-4 text-sm">{error || '项目不存在'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-terracotta text-ivory rounded-xl text-sm"
          >
            返回项目列表
          </button>
        </div>
      </Layout>
    );
  }

  const stats = state.statistics;
  const isFullyCompleted = stats.in_progress === 0 && stats.completed === stats.total && stats.total > 0;

  return (
    <Layout>
      <div className="h-full flex overflow-hidden">
        {/* 左侧 Tab 导航 */}
        <nav className="shrink-0 w-44 border-r border-borderCream bg-parchment flex flex-col">
          {/* 项目名称 */}
          <div className="px-4 py-4 border-b border-borderCream">
            <h1 className="text-lg font-medium font-serif text-nearblack truncate" style={{ fontFamily: 'Georgia, serif' }}>
              {state.project.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${project.status === 'active' ? 'bg-terracotta' : 'bg-stone'}`} />
              <span className="text-xs text-stone truncate">{project.status === 'active' ? '运行中' : '已丢失'}</span>
            </div>
          </div>

          {/* Tab 按钮 */}
          <div className="flex-1 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-center px-4 py-2.5 text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-ivory text-nearblack border-l-2 border-terracotta'
                    : 'text-olive hover:bg-ivory/50 hover:text-nearblack'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 底部统计和操作 */}
          <div className="px-4 py-3 border-t border-borderCream space-y-3">
            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-nearblack">{stats.total}</div>
                <div className="text-stone">总任务</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-terracotta">{stats.in_progress}</div>
                <div className="text-stone">进行中</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-warmGreen">{stats.completed}</div>
                <div className="text-stone">已完成</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-warmRed">{stats.needs_human}</div>
                <div className="text-stone">需人工</div>
              </div>
            </div>

            {/* Progress bar */}
            {stats.total > 0 && (
              <div className="h-1.5 bg-borderCream rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out ${isFullyCompleted ? 'bg-warmGreen' : 'bg-terracotta'}`}
                  style={{ width: `${Math.round((stats.completed / stats.total) * 100)}%` }}
                />
              </div>
            )}

            <button
              onClick={() => {
                if (confirm('确定要移除项目 "' + project.name + '" 吗？')) {
                  api.removeProject(projectId!).then(() => navigate('/'));
                }
              }}
              className="w-full px-3 py-1.5 bg-warmRedLight text-warmRed text-xs font-medium rounded-lg hover:bg-warmRedLight/80 transition-colors"
            >
              删除项目
            </button>
          </div>
        </nav>

        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'board' && (
            <div className="flex-1 p-3 overflow-hidden">
              <TaskBoard tasks={state.tasks} />
            </div>
          )}

          {activeTab === 'dependencies' && (
            <div className="flex-1 overflow-hidden">
              <TaskDependencyGraph tasks={state.tasks} />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="flex-1 overflow-hidden">
              <ReportsPage
                tasks={state.tasks}
                reports={state.reports}
                projectId={projectId!}
              />
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="flex-1 p-3 overflow-hidden">
              <LogViewer content={state.progress} />
            </div>
          )}

          {activeTab === 'spec' && (
            <div className="flex-1 overflow-y-auto p-3">
              <div className="bg-ivory rounded-lg border border-borderCream">
                {state.spec ? (
                  <div className="prose prose-sm max-w-none p-4">
                    <ReactMarkdown>{state.spec}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center text-olive text-sm py-8">
                    暂无产品规格文档
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
