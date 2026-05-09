export interface ModuleOwnership {
  module: string;
  files: string[];
  owners: string[];
  /** True when every file in this module has no git history (all new/untracked). */
  isNewModule: boolean;
}

export interface GitLogEntry {
  author: string;
  count: number;
}
