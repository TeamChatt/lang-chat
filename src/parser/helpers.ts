import { string, regexp, fail, seq, of, Parser } from 'parsimmon'

const interleave = (arr1, arr2) => {
  if (arr1.length === 0) {
    return arr2
  }
  const [head, ...tail] = arr1
  return [head, ...interleave(arr2, tail)]
}

const interpretEscapes = (str: string) => {
  const escapes = {
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t',
  }
  return str.replace(/\\(u[0-9a-fA-F]{4}|[^u])/, (_, escape) => {
    let type = escape.charAt(0)
    let hex = escape.slice(1)
    if (type === 'u') {
      return String.fromCharCode(parseInt(hex, 16))
    }
    if (escapes.hasOwnProperty(type)) {
      return escapes[type]
    }
    return type
  })
}

const countSpaces = regexp(/[ ]*/).map((s) => s.length)
const indentBy = (n) =>
  countSpaces.chain((x) => (x === n ? of(n) : fail(`exactly ${n} spaces`)))

export const indentLine = (indent) => <T>(parser: Parser<T>) =>
  indentBy(indent).then(parser)

export const space = string(' ')

export const strLit = regexp(/"((?:\\.|.)*?)"/, 1)
  .map(interpretEscapes)
  .desc('string')

export const templateParser = <T>(
  strings: string[],
  ...keys: Parser<T>[]
): Parser<T[]> => {
  const sentinel = {}
  const ignore = (str: string) => string(str).map(() => sentinel)
  const arr = interleave(strings.map(ignore), keys)
  return seq<T | {}>(...arr).map(
    (results) => results.filter((r) => r !== sentinel) as T[]
  )
}
