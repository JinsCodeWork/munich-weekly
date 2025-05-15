/**
 * API模块索引文件
 * 统一导出所有API功能，方便在组件中引用
 */

// 导出基础HTTP工具
export * from "./http";

// 导出按模块组织的API
export * as authApi from "./auth";
export * as usersApi from "./users";
export * as issuesApi from "./issues";
export * as submissionsApi from "./submissions";
export * as votesApi from "./votes";

// 导出常用类型
export type { default as ApiError } from "./types.ts";