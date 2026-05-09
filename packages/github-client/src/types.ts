export interface PRFile {
  filename: string;
  patch: string | undefined;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
}
