import { Prog } from './ast'
import { normalize } from './normalize'
import { tagLocation } from './tag-location'

export const prepare = (prog: Prog): Prog => {
  const normalized = normalize(prog)
  const tagged = tagLocation(normalized)
  return tagged
}
