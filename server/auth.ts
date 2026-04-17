import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret, verifyCredentials } from './config.js';

// 扩展 Express Request 类型
declare module 'express' {
  interface Request {
    userId?: string;
  }
}

/**
 * JWT 认证中间件
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const secret = await getJwtSecret();
    const decoded = jwt.verify(token, secret) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: '无效的认证令牌' });
  }
}

/**
 * 登录处理
 */
export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;
  
  if (!username || !password) {
    res.status(400).json({ success: false, error: '请输入用户名和密码' });
    return;
  }
  
  if (!verifyCredentials(username, password)) {
    res.status(401).json({ success: false, error: '用户名或密码错误' });
    return;
  }
  
  // 生成 JWT
  const secret = await getJwtSecret();
  const token = jwt.sign({ userId: username }, secret, { expiresIn: '7d' });
  
  res.json({ success: true, token });
}

/**
 * 检查认证状态
 */
export async function checkAuthHandler(_req: Request, res: Response): Promise<void> {
  res.json({ authenticated: true });
}
