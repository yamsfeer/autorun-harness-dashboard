import chokidar, { FSWatcher } from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import type { Task, Statistics, EvaluatorReport } from '../types.js';
import { StateCache } from './state-cache.js';

export class FileWatcher {
  private watchers: Map<string, FSWatcher> = new Map();
  private stateCache: StateCache;
  private io: SocketIOServer;

  constructor(stateCache: StateCache, io: SocketIOServer) {
    this.stateCache = stateCache;
    this.io = io;
  }

  /**
   * 开始监听项目
   */
  async watch(projectId: string, projectPath: string): Promise<void> {
    // 如果已存在监听器，先停止
    this.unwatch(projectId);

    const harnessDir = path.join(projectPath, '.harness');
    
    // 检查目录是否存在
    try {
      await fs.access(harnessDir);
    } catch {
      // 目录不存在，标记为丢失
      this.io.emit('project:lost', projectId);
      throw new Error('项目目录不存在');
    }

    const watcher = chokidar.watch(harnessDir, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    watcher.on('change', (filePath) => {
      this.handleChange(projectId, filePath, projectPath);
    });

    watcher.on('add', (filePath) => {
      this.handleChange(projectId, filePath, projectPath);
    });

    watcher.on('error', (error) => {
      console.error(`文件监听错误 (${projectId}):`, error);
      // 可能是目录被删除
      if (error.message.includes('ENOENT')) {
        this.io.emit('project:lost', projectId);
      }
    });

    this.watchers.set(projectId, watcher);
  }

  /**
   * 停止监听项目
   */
  unwatch(projectId: string): void {
    const watcher = this.watchers.get(projectId);
    if (watcher) {
      watcher.close();
      this.watchers.delete(projectId);
    }
  }

  /**
   * 处理文件变化
   */
  private async handleChange(projectId: string, filePath: string, _projectPath: string): Promise<void> {
    const filename = path.basename(filePath);

    try {
      // 处理 tasks.json 变化
      if (filename === 'tasks.json') {
        await this.handleTasksChange(projectId, filePath);
        return;
      }

      // 处理 progress.txt 变化
      if (filename === 'progress.txt') {
        await this.handleProgressChange(projectId, filePath);
        return;
      }

      // 处理评估报告变化
      if (filename.startsWith('evaluator_report_') && filename.endsWith('.json')) {
        await this.handleReportChange(projectId, filePath);
        return;
      }

      // 处理 spec.md 变化
      if (filename === 'spec.md') {
        await this.handleSpecChange(projectId, filePath);
        return;
      }

    } catch (error) {
      console.error(`处理文件变化失败 (${filePath}):`, error);
    }
  }

  /**
   * 处理 tasks.json 变化
   */
  private async handleTasksChange(projectId: string, filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    const tasks: Task[] = data.tasks || [];
    const statistics: Statistics = data.statistics || this.calculateStatistics(tasks);

    // 更新缓存
    this.stateCache.updateTasks(projectId, tasks, statistics);

    // 广播更新
    this.io.to(`project:${projectId}`).emit('project:updated', {
      projectId,
      updates: { tasks, statistics },
    });
  }

  /**
   * 处理 progress.txt 变化
   */
  private async handleProgressChange(projectId: string, filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // 获取缓存的旧内容
    const state = this.stateCache.get(projectId);
    const oldProgress = state?.progress || '';
    
    // 计算新增部分
    const newContent = content.slice(oldProgress.length);
    
    if (newContent) {
      this.stateCache.appendProgress(projectId, newContent);
      
      // 广播更新
      this.io.to(`project:${projectId}`).emit('project:updated', {
        projectId,
        updates: { progress: content },
      });
    }
  }

  /**
   * 处理评估报告变化
   */
  private async handleReportChange(projectId: string, filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const report: EvaluatorReport = JSON.parse(content);
    
    // 更新缓存
    this.stateCache.addReport(projectId, report);

    // 广播更新
    const state = this.stateCache.get(projectId);
    this.io.to(`project:${projectId}`).emit('project:updated', {
      projectId,
      updates: { reports: state?.reports || [] },
    });
  }

  /**
   * 处理 spec.md 变化
   */
  private async handleSpecChange(projectId: string, filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // 更新缓存
    const state = this.stateCache.get(projectId);
    if (state) {
      state.spec = content;
    }

    // 广播更新
    this.io.to(`project:${projectId}`).emit('project:updated', {
      projectId,
      updates: { spec: content },
    });
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
