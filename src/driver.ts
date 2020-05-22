import { Driver } from './runtime'

export const driver: Driver = {
  exec: async (fn, args) => {
    console.log({ fn, args })
  },
  branch: async (branches) => {
    console.log({ branches })
    return branches[0]
  },
  error: (err) => {
    console.error(err)
  },
}
