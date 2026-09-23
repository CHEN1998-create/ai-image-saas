// 鉴权类型 — server-only mock 层
// 对齐 lib/mock-data.ts 的 currentUser，新增 role 字段

export type Role = "user" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: Role;
  plan: string;
  points: number;
  totalGenerated: number;
  joinedAt: string;
  bio: string;
  links: string[];
}

// 内部存储记录（含密码哈希，永不返回给客户端）
export interface StoredUser extends AuthUser {
  passwordHash: string;
}

export type SessionPayload = {
  uid: string;
  role: Role;
  exp: number; // epoch ms
};
