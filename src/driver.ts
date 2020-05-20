import { Driver } from './runtime'

export const driver: Driver = {
  exec: async (fn, args) => {
    console.log({ fn, args })
  },
  branch: async (branches) => {
    return branches[0]
  },
}
