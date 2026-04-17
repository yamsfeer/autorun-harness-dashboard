// 后端类型定义

export interface DashboardConfig {
  version: string;
  passwordHash: string;
  jwtSecret: string;
  port: number;
  projects: ProjectConfig[];
}

export interface ProjectConfig {
  id: string;
  name: string;
  path: string;
  addedAt: string;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  addedAt: string;
  status: 'active' | 'lost';
}

export interface ProjectState {
  project: {
    name: string;
    version: string;
    created_at: string;
  };
  tasks: Task[];
  statistics: Statistics;
  spec: string;
  progress: string;
  reports: EvaluatorReport[];
}

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

// API 请求/响应类型
export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface AddProjectRequest {
  path: string;
}

export interface AddProjectResponse {
  success: boolean;
  project?: Project;
  error?: string;
}

// WebSocket 事件类型
export interface WebSocketEvents {
  // 服务端 -> 客户端
  'project:added': (project: Project) => void;
  'project:removed': (projectId: string) => void;
  'project:updated': (data: { projectId: string; updates: Partial<ProjectState> }) => void;
  'project:lost': (projectId: string) => void;
  
  // 客户端 -> 服务端
  'subscribe:project': (projectId: string) => void;
  'unsubscribe:project': (projectId: string) => void;
}
