import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import type { DashboardConfig, ProjectConfig } from './types.js';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'autorun-harness');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// 固定账号密码
const FIXED_USERNAME = 'admin';
const FIXED_PASSWORD = '111';

const DEFAULT_CONFIG: Omit<DashboardConfig, 'passwordHash' | 'jwtSecret'> = {
  version: '1.0.0',
  port: 3001,
  projects: [],
};

/**
 * 确保配置目录存在
 */
async function ensureConfigDir(): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

/**
 * 生成随机密钥
 */
function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 加载配置
 */
export async function loadConfig(): Promise<DashboardConfig> {
  await ensureConfigDir();
  
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content) as DashboardConfig;
    return config;
  } catch {
    // 配置文件不存在，创建默认配置
    const defaultConfig: DashboardConfig = {
      ...DEFAULT_CONFIG,
      passwordHash: '', // 不再使用
      jwtSecret: generateSecret(),
    };
    await saveConfig(defaultConfig);
    return defaultConfig;
  }
}

/**
 * 保存配置
 */
export async function saveConfig(config: DashboardConfig): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * 验证账号密码
 */
export function verifyCredentials(username: string, password: string): boolean {
  return username === FIXED_USERNAME && password === FIXED_PASSWORD;
}

/**
 * 获取 JWT 密钥
 */
export async function getJwtSecret(): Promise<string> {
  const config = await loadConfig();
  return config.jwtSecret;
}

/**
 * 获取项目列表
 */
export async function getProjects(): Promise<ProjectConfig[]> {
  const config = await loadConfig();
  return config.projects;
}

/**
 * 添加项目
 */
export async function addProject(project: ProjectConfig): Promise<void> {
  const config = await loadConfig();
  config.projects.push(project);
  await saveConfig(config);
}

/**
 * 移除项目
 */
export async function removeProject(projectId: string): Promise<void> {
  const config = await loadConfig();
  config.projects = config.projects.filter(p => p.id !== projectId);
  await saveConfig(config);
}

/**
 * 获取服务端口
 */
export async function getPort(): Promise<number> {
  const config = await loadConfig();
  return config.port;
}

export { CONFIG_DIR, CONFIG_FILE };
