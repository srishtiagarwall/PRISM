export interface ModuleOwnership {
  module: string;
  files: string[];
  owners: string[];
}

export interface GitLogEntry {
  author: string;
  count: number;
}
