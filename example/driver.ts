import { Driver } from '../src'

export const driver: Driver = {
  exec: async (fn, args) => {
    console.log({ type: 'exec', fn, args })
  },
  eval: async (fn, args) => {
    console.log({ type: 'eval', fn, args })
    return fn
  },
  dialogue: async (character, line) => {
    console.log({ type: 'dialogue', character, line })
  },
  branch: async (branches) => {
    console.log({ type: 'branch', branches })
    return branches[0]
  },
  error: (err) => {
    console.error(err)
  },
}
