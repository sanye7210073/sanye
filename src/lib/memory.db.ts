/* eslint-disable @typescript-eslint/no-explicit-any */
import { AdminConfig } from './admin.types';
import {
  ContentStat,
  EpisodeSkipConfig,
  Favorite,
  IStorage,
  PlayRecord,
  PlayStatsResult,
  Reminder,
  UserPlayStat,
  CrashLog,
} from './types';

// 内存存储实现 - 用于 localstorage 模式的服务端回退
// 注意：数据存在 serverless 函数实例内存中，实例回收后数据丢失
export class MemoryStorage implements IStorage {
  private data = new Map<string, any>();

  // 播放记录
  async getPlayRecord(userName: string, key: string): Promise<PlayRecord | null> {
    return this.data.get(`play:${userName}:${key}`) || null;
  }
  async setPlayRecord(userName: string, key: string, record: PlayRecord): Promise<void> {
    this.data.set(`play:${userName}:${key}`, record);
  }
  async getAllPlayRecords(userName: string): Promise<{ [key: string]: PlayRecord }> {
    const result: { [key: string]: PlayRecord } = {};
    const prefix = `play:${userName}:`;
    for (const [k, v] of this.data) {
      if (k.startsWith(prefix)) result[k.slice(prefix.length)] = v;
    }
    return result;
  }
  async deletePlayRecord(userName: string, key: string): Promise<void> {
    this.data.delete(`play:${userName}:${key}`);
  }
  async setPlayRecordsBatch(userName: string, records: { [key: string]: PlayRecord }): Promise<void> {
    for (const [k, v] of Object.entries(records)) {
      this.data.set(`play:${userName}:${k}`, v);
    }
  }

  // 收藏
  async getFavorite(userName: string, key: string): Promise<Favorite | null> {
    return this.data.get(`fav:${userName}:${key}`) || null;
  }
  async setFavorite(userName: string, key: string, favorite: Favorite): Promise<void> {
    this.data.set(`fav:${userName}:${key}`, favorite);
  }
  async getAllFavorites(userName: string): Promise<{ [key: string]: Favorite }> {
    const result: { [key: string]: Favorite } = {};
    const prefix = `fav:${userName}:`;
    for (const [k, v] of this.data) {
      if (k.startsWith(prefix)) result[k.slice(prefix.length)] = v;
    }
    return result;
  }
  async deleteFavorite(userName: string, key: string): Promise<void> {
    this.data.delete(`fav:${userName}:${key}`);
  }
  async setFavoritesBatch(userName: string, favorites: { [key: string]: Favorite }): Promise<void> {
    for (const [k, v] of Object.entries(favorites)) {
      this.data.set(`fav:${userName}:${k}`, v);
    }
  }

  // 提醒
  async getReminder(userName: string, key: string): Promise<Reminder | null> {
    return this.data.get(`rem:${userName}:${key}`) || null;
  }
  async setReminder(userName: string, key: string, reminder: Reminder): Promise<void> {
    this.data.set(`rem:${userName}:${key}`, reminder);
  }
  async getAllReminders(userName: string): Promise<{ [key: string]: Reminder }> {
    const result: { [key: string]: Reminder } = {};
    const prefix = `rem:${userName}:`;
    for (const [k, v] of this.data) {
      if (k.startsWith(prefix)) result[k.slice(prefix.length)] = v;
    }
    return result;
  }
  async deleteReminder(userName: string, key: string): Promise<void> {
    this.data.delete(`rem:${userName}:${key}`);
  }

  // 用户
  async registerUser(userName: string, password: string): Promise<void> {
    this.data.set(`user:${userName}`, { password });
  }
  async verifyUser(userName: string, password: string): Promise<boolean> {
    const user = this.data.get(`user:${userName}`);
    return user && user.password === password;
  }
  async checkUserExist(userName: string): Promise<boolean> {
    return this.data.has(`user:${userName}`);
  }
  async changePassword(userName: string, newPassword: string): Promise<void> {
    const user = this.data.get(`user:${userName}`);
    if (user) user.password = newPassword;
  }
  async deleteUser(userName: string): Promise<void> {
    this.data.delete(`user:${userName}`);
    // 删除用户相关数据
    for (const k of [...this.data.keys()]) {
      if (k.includes(`:${userName}:`)) this.data.delete(k);
    }
  }

  // 搜索历史
  async getSearchHistory(userName: string): Promise<string[]> {
    return this.data.get(`history:${userName}`) || [];
  }
  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    const history = this.data.get(`history:${userName}`) || [];
    const filtered = history.filter((h: string) => h !== keyword);
    filtered.unshift(keyword);
    this.data.set(`history:${userName}`, filtered.slice(0, 50));
  }
  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    if (keyword) {
      const history = this.data.get(`history:${userName}`) || [];
      this.data.set(`history:${userName}`, history.filter((h: string) => h !== keyword));
    } else {
      this.data.delete(`history:${userName}`);
    }
  }

  // 用户列表
  async getAllUsers(): Promise<string[]> {
    const users: string[] = [];
    for (const k of this.data.keys()) {
      if (k.startsWith('user:')) users.push(k.slice(5));
    }
    return users;
  }

  // 管理员配置
  async getAdminConfig(): Promise<AdminConfig | null> {
    return this.data.get('admin:config') || null;
  }
  async setAdminConfig(config: AdminConfig): Promise<void> {
    this.data.set('admin:config', config);
  }

  // 跳过片头片尾
  async getSkipConfig(userName: string, source: string, id: string): Promise<EpisodeSkipConfig | null> {
    return this.data.get(`skip:${userName}:${source}:${id}`) || null;
  }
  async setSkipConfig(userName: string, source: string, id: string, config: EpisodeSkipConfig): Promise<void> {
    this.data.set(`skip:${userName}:${source}:${id}`, config);
  }
  async deleteSkipConfig(userName: string, source: string, id: string): Promise<void> {
    this.data.delete(`skip:${userName}:${source}:${id}`);
  }
  async getAllSkipConfigs(userName: string): Promise<{ [key: string]: EpisodeSkipConfig }> {
    const result: { [key: string]: EpisodeSkipConfig } = {};
    const prefix = `skip:${userName}:`;
    for (const [k, v] of this.data) {
      if (k.startsWith(prefix)) result[k.slice(prefix.length)] = v;
    }
    return result;
  }

  // 数据清理
  async clearAllData(): Promise<void> {
    this.data.clear();
  }

  // 通用缓存
  async getCache(key: string): Promise<any | null> {
    const entry = this.data.get(`cache:${key}`);
    if (!entry) return null;
    if (entry.expire && Date.now() > entry.expire) {
      this.data.delete(`cache:${key}`);
      return null;
    }
    return entry.data;
  }
  async setCache(key: string, data: any, expireSeconds?: number): Promise<void> {
    this.data.set(`cache:${key}`, {
      data,
      expire: expireSeconds ? Date.now() + expireSeconds * 1000 : null,
    });
  }
  async deleteCache(key: string): Promise<void> {
    this.data.delete(`cache:${key}`);
  }
  async clearExpiredCache(prefix?: string): Promise<void> {
    const now = Date.now();
    for (const [k, v] of this.data) {
      if (k.startsWith('cache:') && (!prefix || k.includes(prefix))) {
        if (v.expire && now > v.expire) this.data.delete(k);
      }
    }
  }

  // 播放统计
  async getPlayStats(): Promise<PlayStatsResult> {
    return this.data.get('stats:play') || { totalPlays: 0, totalUsers: 0, totalWatchTime: 0 };
  }
  async getUserPlayStat(userName: string): Promise<UserPlayStat> {
    return this.data.get(`stats:user:${userName}`) || { totalPlays: 0, totalWatchTime: 0, lastPlayTime: 0 };
  }
  async getContentStats(limit?: number): Promise<ContentStat[]> {
    const stats = this.data.get('stats:content') || [];
    return limit ? stats.slice(0, limit) : stats;
  }
  async updatePlayStatistics(userName: string, source: string, id: string, watchTime: number): Promise<void> {
    // 简单实现，不做复杂统计
  }

  // 登入统计
  async updateUserLoginStats(userName: string, loginTime: number, isFirstLogin?: boolean): Promise<void> {
    // 简单实现
  }

  // 崩溃日志
  async saveCrashLog(crashLog: CrashLog): Promise<void> {
    const logs = this.data.get('crash:logs') || [];
    logs.unshift(crashLog);
    this.data.set('crash:logs', logs.slice(0, 100));
  }
  async getCrashLogs(limit?: number): Promise<CrashLog[]> {
    const logs = this.data.get('crash:logs') || [];
    return limit ? logs.slice(0, limit) : logs;
  }
  async deleteCrashLog(timestamp: string): Promise<void> {
    const logs = this.data.get('crash:logs') || [];
    this.data.set('crash:logs', logs.filter((l: any) => l.timestamp !== timestamp));
  }
  async clearCrashLogs(): Promise<void> {
    this.data.delete('crash:logs');
  }
}
