import { match } from '../util/match'

const interleave = <T>(array: T[], sep: T): T[] => {
  if (array.length === 0) return []
  if (array.length === 1) return array
  const [hd, ...tail] = array
  return [hd, sep, ...interleave(tail, sep)]
}

export const Doc = {
  Empty: { kind: 'Doc.Empty' },
  Text: <T>({ text, doc }): Doc<T> => ({ kind: 'Doc.Text', text, doc }),
  Line: <T>({ depth, doc }): Doc<T> => ({ kind: 'Doc.Line', depth, doc }),
}

export type Doc<T> = DocEmpty | DocText<T> | DocLine<T>

interface DocEmpty {
  kind: 'Doc.Empty'
}
interface DocText<T> {
  kind: 'Doc.Text'
  text: T
  doc: Doc<T>
}
interface DocLine<T> {
  kind: 'Doc.Line'
  depth: number
  doc: Doc<T>
}

export const indent = <T>(doc: Doc<T>): Doc<T> =>
  match(doc, {
    'Doc.Empty': () => Doc.Empty as Doc<T>,
    'Doc.Text': ({ text, doc }) =>
      Doc.Text<T>({
        text,
        doc: indent(doc),
      }),
    'Doc.Line': ({ depth, doc }) =>
      Doc.Line<T>({
        depth: depth + 1,
        doc: indent(doc),
      }),
  })

export const concat = <T>(doc1: Doc<T>, doc2: Doc<T>): Doc<T> =>
  match(doc1, {
    'Doc.Empty': () => doc2,
    'Doc.Text': ({ text, doc }) =>
      Doc.Text<T>({
        text,
        doc: concat(doc, doc2),
      }),
    'Doc.Line': ({ depth, doc }) =>
      Doc.Line<T>({
        depth,
        doc: concat(doc, doc2),
      }),
  })

export const str = <T>(text: T): Doc<T> => Doc.Text({ text, doc: Doc.Empty })

export const seq = <T>(...arr: Doc<T>[]): Doc<T> =>
  arr.reduceRight((doc1, doc2) => concat(doc2, doc1), Doc.Empty as Doc<T>)

export const newline = Doc.Line({ depth: 0, doc: Doc.Empty })

export const intersperse = <T>(docs: Doc<T>[], sep: Doc<T>): Doc<T> =>
  seq(...interleave(docs, sep))

export const lines = <T>(docs: Doc<T>[]) => intersperse(docs, newline as Doc<T>)

// Recursive version
// export const layout = (doc) =>
//   match(doc, {
//     'Doc.Empty': () => '',
//     'Doc.Text': ({ text, doc }) => `${text}${layout(doc)}`,
//     'Doc.Line': ({ depth, doc }) => `\n${' '.repeat(depth)}${layout(doc)}`,
//   })

// Stacksafe version
export const layout = (document) => {
  const step = (document) =>
    match(document, {
      'Doc.Empty': () => ['', null],
      'Doc.Text': ({ text, doc }) => [`${text}`, doc],
      'Doc.Line': ({ depth, doc }) => [`\n${'  '.repeat(depth)}`, doc],
    })
  let doc = document
  let out = ''
  while (doc) {
    const [emit, next] = step(doc)
    out = `${out}${emit}`
    doc = next
  }
  return out
}
