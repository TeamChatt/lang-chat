export interface Driver {
  exec: (fn: string, args: any[]) => any
  branch: (branches: any[]) => any
}
