export interface ModuleOwnership {
  module: string;
  files: string[];
  owners: string[];
  isNewModule: boolean;
}

export interface ModuleDependency {
  module: string;
  imports: string[];
  importedBy: string[];
}

export interface AgentInput {
  modules: ModuleOwnership[];
  dependencies: ModuleDependency[];
  prTitle: string;
  prAuthor: string;
}
