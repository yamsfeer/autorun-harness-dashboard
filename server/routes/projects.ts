import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { ProjectRegistry } from '../services/project-registry.js';
import { StateCache } from '../services/state-cache.js';
import { FileWatcher } from '../services/file-watcher.js';

export function createProjectRoutes(
  registry: ProjectRegistry,
  cache: StateCache,
  watcher: FileWatcher
): Router {
  const router = Router();

  /**
   * GET /api/projects - 获取项目列表
   */
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const projects = await registry.listProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/projects - 添加项目
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { path: projectPath } = req.body;
      
      if (!projectPath) {
        res.status(400).json({ error: '请提供项目路径' });
        return;
      }

      const project = await registry.addProject(projectPath);
      
      // 加载初始状态
      await cache.loadFromDisk(project.id, project.path);
      
      // 开始监听
      await watcher.watch(project.id, project.path);
      
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  /**
   * DELETE /api/projects/:id - 移除项目
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // 停止监听
      watcher.unwatch(id);
      
      // 移除项目
      await registry.removeProject(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/projects/:id/state - 获取项目状态
   */
  router.get('/:id/state', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const state = await registry.getProjectState(id);
      
      if (!state) {
        res.status(404).json({ error: '项目不存在' });
        return;
      }
      
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/projects/:id/reports/:reportId - 获取评估报告详情
   */
  router.get('/:id/reports/:reportId', async (req: Request, res: Response) => {
    try {
      const { id, reportId } = req.params;
      const state = await registry.getProjectState(id);
      
      if (!state) {
        res.status(404).json({ error: '项目不存在' });
        return;
      }
      
      const report = state.reports.find(r => r.report_id === reportId);
      
      if (!report) {
        res.status(404).json({ error: '报告不存在' });
        return;
      }
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/projects/:id/screenshots/:filename - 获取截图
   */
  router.get('/:id/screenshots/:filename', async (req: Request, res: Response) => {
    try {
      const { id, filename } = req.params;
      const projects = await registry.listProjects();
      const project = projects.find(p => p.id === id);
      
      if (!project) {
        res.status(404).json({ error: '项目不存在' });
        return;
      }
      
      // 尝试多个可能的截图位置
      const possiblePaths = [
        path.join(project.path, '.harness', 'reports', 'screenshots', filename),
        path.join(project.path, '.harness', 'screenshots', filename),
        path.join(project.path, '.harness', 'reports', filename),
      ];
      
      for (const screenshotPath of possiblePaths) {
        try {
          await fs.access(screenshotPath);
          res.sendFile(screenshotPath);
          return;
        } catch {
          // 继续尝试下一个路径
        }
      }
      
      res.status(404).json({ error: '截图不存在' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/projects/:id/spec - 获取产品规格
   */
  router.get('/:id/spec', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const state = await registry.getProjectState(id);
      
      if (!state) {
        res.status(404).json({ error: '项目不存在' });
        return;
      }
      
      res.type('text/markdown').send(state.spec);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/projects/:id/progress - 获取进度日志
   */
  router.get('/:id/progress', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const state = await registry.getProjectState(id);
      
      if (!state) {
        res.status(404).json({ error: '项目不存在' });
        return;
      }
      
      res.type('text/plain').send(state.progress);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
