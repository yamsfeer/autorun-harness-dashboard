import fs from 'fs/promises';
import path from 'path';
import type { ProjectState, Task, Statistics, EvaluatorReport } from '../types.js';

export class StateCache {
  private cache: Map<string, ProjectState> = new Map();

  /**
   * 获取项目状态
   */
  get(projectId: string): ProjectState | null {
    return this.cache.get(projectId) || null;
  }

  /**
   * 设置项目状态
   */
  set(projectId: string, state: ProjectState): void {
    this.cache.set(projectId, state);
  }

  /**
   * 使缓存失效
   */
  invalidate(projectId: string): void {
    this.cache.delete(projectId);
  }

  /**
   * 从磁盘加载项目状态
   */
  async loadFromDisk(projectId: string, projectPath: string): Promise<ProjectState> {
    const harnessDir = path.join(projectPath, '.harness');
    
    // 读取 tasks.json
    const tasksData = await this.readJsonFile(path.join(harnessDir, 'tasks.json'));
    const tasks: Task[] = tasksData?.tasks || [];
    const statistics: Statistics = tasksData?.statistics || this.calculateStatistics(tasks);
    const project = tasksData?.project || { name: 'Unknown', version: '1.0.0', created_at: new Date().toISOString() };

    // 读取 spec.md
    let spec = '';
    try {
      spec = await fs.readFile(path.join(harnessDir, 'spec.md'), 'utf-8');
    } catch {
      // 忽略
    }

    // 读取 progress.txt
    let progress = '';
    try {
      progress = await fs.readFile(path.join(harnessDir, 'progress.txt'), 'utf-8');
    } catch {
      // 忽略
    }

    // 读取评估报告
    const reports = await this.loadReports(harnessDir);

    const state: ProjectState = {
      project,
      tasks,
      statistics,
      spec,
      progress,
      reports,
    };

    this.cache.set(projectId, state);
    return state;
  }

  /**
   * 更新任务列表
   */
  updateTasks(projectId: string, tasks: Task[], statistics: Statistics): void {
    const state = this.cache.get(projectId);
    if (state) {
      state.tasks = tasks;
      state.statistics = statistics;
    }
  }

  /**
   * 追加进度日志
   */
  appendProgress(projectId: string, newProgress: string): void {
    const state = this.cache.get(projectId);
    if (state) {
      state.progress += newProgress;
    }
  }

  /**
   * 添加评估报告
   */
  addReport(projectId: string, report: EvaluatorReport): void {
    const state = this.cache.get(projectId);
    if (state) {
      // 检查是否已存在
      const existingIndex = state.reports.findIndex(r => r.report_id === report.report_id);
      if (existingIndex >= 0) {
        state.reports[existingIndex] = report;
      } else {
        state.reports.push(report);
        // 按时间倒序排序
        state.reports.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    }
  }

  /**
   * 读取 JSON 文件
   */
  private async readJsonFile(filePath: string): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * 加载评估报告
   */
  private async loadReports(harnessDir: string): Promise<EvaluatorReport[]> {
    const reports: EvaluatorReport[] = [];
    const reportsDir = path.join(harnessDir, 'reports');

    try {
      const files = await fs.readdir(reportsDir);
      const reportFiles = files.filter(f => f.startsWith('evaluator_report_') && f.endsWith('.json'));

      for (const file of reportFiles) {
        const report = await this.readJsonFile(path.join(reportsDir, file));
        if (report) {
          reports.push(report);
        }
      }

      // 按时间倒序排序
      reports.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch {
      // 报告目录不存在
    }

    return reports;
  }

  /**
   * 计算统计信息
   */
  private calculateStatistics(tasks: Task[]): Statistics {
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      needs_human: tasks.filter(t => t.status === 'needs_human').length,
    };
  }
}
