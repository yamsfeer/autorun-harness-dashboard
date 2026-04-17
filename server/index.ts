import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { loadConfig, getPort, getJwtSecret } from './config.js';
import { authMiddleware, loginHandler, checkAuthHandler } from './auth.js';
import { createProjectRoutes } from './routes/projects.js';
import { FileWatcher } from './services/file-watcher.js';
import { StateCache } from './services/state-cache.js';
import { ProjectRegistry } from './services/project-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const config = await loadConfig();
  const port = await getPort();
  
  // 创建 Express 应用
  const app = express();
  const httpServer = createServer(app);
  
  // 创建 Socket.IO 服务器
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });
  
  // 中间件
  app.use(cors());
  app.use(express.json());
  
  // 静态文件服务（生产环境）
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // 初始化服务
  const stateCache = new StateCache();
  const projectRegistry = new ProjectRegistry(stateCache);
  const fileWatcher = new FileWatcher(stateCache, io);
  
  // 认证路由（无需认证）
  app.post('/api/auth/login', loginHandler);
  app.get('/api/auth/check', authMiddleware, checkAuthHandler);
  
  // 项目路由（需要认证）
  app.use('/api/projects', authMiddleware, createProjectRoutes(projectRegistry, stateCache, fileWatcher));
  
  // WebSocket 认证
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('未认证'));
    }
    
    try {
      const secret = await getJwtSecret();
      jwt.verify(token, secret);
      next();
    } catch {
      next(new Error('无效令牌'));
    }
  });
  
  // WebSocket 连接处理
  io.on('connection', (socket) => {
    console.log('客户端已连接:', socket.id);
    
    // 订阅项目更新
    socket.on('subscribe:project', async (projectId: string) => {
      socket.join(`project:${projectId}`);
      
      // 发送当前状态
      const state = stateCache.get(projectId);
      if (state) {
        socket.emit('project:updated', { projectId, updates: state });
      }
    });
    
    // 取消订阅
    socket.on('unsubscribe:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('客户端已断开:', socket.id);
    });
  });
  
  // 启动时恢复项目监听
  const projects = config.projects;
  for (const project of projects) {
    try {
      await fileWatcher.watch(project.id, project.path);
      await stateCache.loadFromDisk(project.id, project.path);
      console.log(`已恢复项目监听: ${project.name}`);
    } catch (error) {
      console.warn(`项目路径不存在: ${project.path}`);
      // 标记项目为丢失状态
      io.emit('project:lost', project.id);
    }
  }
  
  // SPA 回退路由（生产环境）
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
  
  // 启动服务器
  httpServer.listen(port, () => {
    console.log(`Dashboard 服务已启动: http://localhost:${port}`);
  });
}

main().catch(console.error);
