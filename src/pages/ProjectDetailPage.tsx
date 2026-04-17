import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TaskBoard from '../components/TaskBoard';
import LogViewer from '../components/LogViewer';
import EvalReport from '../components/EvalReport';
import { api } from '../api/client';
import { useStore } from '../stores/useStore';
import { useSocket } from '../hooks/useSocket';

type Tab = 'board' | 'reports' | 'logs' | 'spec';

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

  // 加载项目状态
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

    // 如果没有缓存的状态，从服务器加载
    if (!state) {
      loadState();
    } else {
      setLoading(false);
    }
  }, [projectId]);

  // 订阅项目更新
  useEffect(() => {
    if (projectId) {
      subscribeProject(projectId);
      return () => unsubscribeProject(projectId);
    }
  }, [projectId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (error || !project || !state) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-red-500 mb-4">{error || '项目不存在'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg"
          >
            返回项目列表
          </button>
        </div>
      </Layout>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'board', label: '任务看板' },
    { id: 'reports', label: '评估报告' },
    { id: 'logs', label: '执行日志' },
    { id: 'spec', label: '产品规格' },
  ];

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{state.project.name}</h1>
              <p className="text-sm text-gray-500">{project.path}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-6">
            <div className="text-sm">
              <span className="text-gray-500">总任务: </span>
              <span className="font-medium">{state.statistics.total}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">已完成: </span>
              <span className="font-medium text-green-600">{state.statistics.completed}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">进行中: </span>
              <span className="font-medium text-blue-600">{state.statistics.in_progress}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">需人工: </span>
              <span className="font-medium text-red-600">{state.statistics.needs_human}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          {activeTab === 'board' && (
            <TaskBoard tasks={state.tasks} />
          )}

          {activeTab === 'reports' && (
            <div className="h-full overflow-y-auto space-y-4">
              {state.reports.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  暂无评估报告
                </div>
              ) : (
                state.reports.map((report) => (
                  <EvalReport
                    key={report.report_id}
                    report={report}
                    projectId={projectId!}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <LogViewer content={state.progress} />
          )}

          {activeTab === 'spec' && (
            <div className="h-full overflow-y-auto bg-white rounded-lg border border-gray-200 p-6">
              {state.spec ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {state.spec}
                </pre>
              ) : (
                <div className="text-center text-gray-500">
                  暂无产品规格文档
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
