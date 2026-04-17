import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 类型定义
export interface Task {
  id: string;
  title: string;
  category: string;
  priority: string;
  description: string;
  acceptance_criteria: AcceptanceCriterion[];
  dependencies: string[];
  attempts: number;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'needs_human';
  assigned_to: string | null;
  completed_at: string | null;
  notes: string[];
}

export interface AcceptanceCriterion {
  id: string;
  description: string;
  steps: string[];
  status: 'pending' | 'pass' | 'fail';
}

export interface Statistics {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  blocked: number;
  needs_human: number;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  addedAt: string;
  status?: 'active' | 'lost';
}

export interface ProjectState {
  project: { name: string; version: string; created_at: string };
  tasks: Task[];
  statistics: Statistics;
  spec: string;
  progress: string;
  reports: EvaluatorReport[];
}

export interface EvaluatorReport {
  report_id: string;
  task_id: string;
  attempt: number;
  timestamp: string;
  overall_result: 'pass' | 'fail';
  summary: string;
  criteria_results: CriterionResult[];
  quality_scores: QualityScores;
  total_weighted_score: number;
  threshold: number;
  final_decision: 'pass' | 'fail';
  feedback_for_generator: string;
  screenshot_paths: string[];
}

export interface CriterionResult {
  criterion_id: string;
  description: string;
  result: 'pass' | 'fail';
  details: Array<{
    step: number;
    action: string;
    status: 'pass' | 'fail' | 'pending';
    reason?: string;
    note?: string;
  }>;
}

export interface QualityScores {
  functionality: QualityScore;
  code_quality: QualityScore;
  product_depth: QualityScore;
  visual_design: QualityScore;
}

export interface QualityScore {
  score: number;
  weight: number;
  weighted: number;
  comment: string;
}

// Store 状态
interface StoreState {
  // 认证
  token: string | null;
  setToken: (token: string | null) => void;

  // 项目列表
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
  updateProjectStatus: (id: string, status: 'active' | 'lost') => void;

  // 项目状态缓存
  projectStates: Record<string, ProjectState>;
  setProjectState: (projectId: string, state: ProjectState) => void;
  updateProjectTasks: (projectId: string, tasks: Task[], statistics: Statistics) => void;

  // 当前选中的项目
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;

  // WebSocket 连接状态
  connected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // 认证
      token: null,
      setToken: (token) => set({ token }),

      // 项目列表
      projects: [],
      setProjects: (projects) => set({ projects }),
      addProject: (project) => set((state) => ({
        projects: [...state.projects, project],
      })),
      removeProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        projectStates: Object.fromEntries(
          Object.entries(state.projectStates).filter(([key]) => key !== id)
        ),
      })),
      updateProjectStatus: (id, status) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, status } : p
        ),
      })),

      // 项目状态缓存
      projectStates: {},
      setProjectState: (projectId, state) => set((s) => ({
        projectStates: { ...s.projectStates, [projectId]: state },
      })),
      updateProjectTasks: (projectId, tasks, statistics) => set((s) => {
        const existing = s.projectStates[projectId];
        if (!existing) return s;
        return {
          projectStates: {
            ...s.projectStates,
            [projectId]: { ...existing, tasks, statistics },
          },
        };
      }),

      // 当前项目
      currentProjectId: null,
      setCurrentProjectId: (id) => set({ currentProjectId: id }),

      // WebSocket 连接
      connected: false,
      setConnected: (connected) => set({ connected }),
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        token: state.token,
        projects: state.projects,
      }),
    }
  )
);
