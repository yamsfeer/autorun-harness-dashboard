import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { addProject, removeProject, getProjects } from '../config.js';
import type { Project, ProjectConfig, ProjectState } from '../types.js';
import { StateCache } from './state-cache.js';

export class ProjectRegistry {
  private stateCache: StateCache;

  constructor(stateCache: StateCache) {
    this.stateCache = stateCache;
  }

  /**
   * 获取所有项目
   */
  async listProjects(): Promise<Project[]> {
    const configs = await getProjects();
    const projects: Project[] = [];

    for (const config of configs) {
      const isActive = await this.checkProjectExists(config.path);
      projects.push({
        ...config,
        status: isActive ? 'active' : 'lost',
      });
    }

    return projects;
  }

  /**
   * 添加项目
   */
  async addProject(projectPath: string): Promise<Project> {
    // 规范化路径
    const normalizedPath = path.resolve(projectPath);

    // 验证项目
    const validation = await this.validateProject(normalizedPath);
    if (!validation.valid) {
      throw new Error(validation.error || '无效的项目路径');
    }

    // 检查是否已存在
    const existing = await getProjects();
    if (existing.some(p => p.path === normalizedPath)) {
      throw new Error('项目已存在');
    }

    // 创建项目配置
    const project: ProjectConfig = {
      id: randomUUID(),
      name: validation.name!,
      path: normalizedPath,
      addedAt: new Date().toISOString(),
    };

    // 保存配置
    await addProject(project);

    return {
      ...project,
      status: 'active',
    };
  }

  /**
   * 移除项目
   */
  async removeProject(projectId: string): Promise<void> {
    await removeProject(projectId);
    this.stateCache.invalidate(projectId);
  }

  /**
   * 验证项目路径
   */
  async validateProject(projectPath: string): Promise<{
    valid: boolean;
    error?: string;
    name?: string;
  }> {
    try {
      // 检查路径是否存在
      const stat = await fs.stat(projectPath);
      if (!stat.isDirectory()) {
        return { valid: false, error: '路径不是目录' };
      }

      // 检查 .harness 目录
      const harnessDir = path.join(projectPath, '.harness');
      const harnessStat = await fs.stat(harnessDir);
      if (!harnessStat.isDirectory()) {
        return { valid: false, error: '.harness 目录不存在' };
      }

      // 尝试读取 tasks.json
      const tasksPath = path.join(harnessDir, 'tasks.json');
      const tasksContent = await fs.readFile(tasksPath, 'utf-8');
      const tasks = JSON.parse(tasksContent);

      if (!tasks.project || !tasks.project.name) {
        return { valid: false, error: 'tasks.json 格式无效' };
      }

      return {
        valid: true,
        name: tasks.project.name,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { valid: false, error: '路径不存在' };
      }
      return { valid: false, error: `验证失败: ${(error as Error).message}` };
    }
  }

  /**
   * 检查项目是否存在
   */
  private async checkProjectExists(projectPath: string): Promise<boolean> {
    try {
      const harnessDir = path.join(projectPath, '.harness');
      await fs.access(harnessDir);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取项目状态
   */
  async getProjectState(projectId: string): Promise<ProjectState | null> {
    const projects = await getProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return null;
    }

    // 尝试从缓存获取
    let state = this.stateCache.get(projectId);
    
    if (!state) {
      // 从磁盘加载
      state = await this.stateCache.loadFromDisk(projectId, project.path);
    }

    return state;
  }
}
