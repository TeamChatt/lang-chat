import match from '../util/match'

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

export function indent<T>(doc: Doc<T>): Doc<T> {
  return match(doc, {
    'Doc.Empty': () => Doc.Empty as Doc<T>,
    'Doc.Text': ({ text, doc }) =>
      Doc.Text({
        text,
        doc: indent(doc),
      }),
    'Doc.Line': ({ depth, doc }) =>
      Doc.Line({
        depth: depth + 1,
        doc: indent(doc),
      }),
  })
}

export const concat = <T>(doc1: Doc<T>, doc2: Doc<T>): Doc<T> =>
  match(doc1, {
    'Doc.Empty': () => doc2,
    'Doc.Text': ({ text, doc }) =>
      Doc.Text({
        text,
        doc: concat(doc, doc2),
      }),
    'Doc.Line': ({ depth, doc }) =>
      Doc.Line({
        depth,
        doc: concat(doc, doc2),
      }),
  })

export const str = <T>(text: T): Doc<T> => Doc.Text({ text, doc: Doc.Empty })

export const seq = <T>(...arr: Doc<T>[]): Doc<T> =>
  arr.reduce(concat, Doc.Empty as Doc<T>)

export const newline = Doc.Line({ depth: 0, doc: Doc.Empty })

export const intersperse = <T>(docs: Doc<T>[], sep: Doc<T>): Doc<T> =>
  docs.reduce(
    (acc, doc) => (doc === docs[0] ? doc : seq(acc, sep, doc)),
    Doc.Empty as Doc<T>
  )

export const lines = <T>(docs: Doc<T>[]) => intersperse(docs, newline as Doc<T>)

export const layout = (doc: Doc<string>): string =>
  match(doc, {
    'Doc.Empty': () => '',
    'Doc.Text': ({ text, doc }) => `${text}${layout(doc)}`,
    'Doc.Line': ({ depth, doc }) => `\n${' '.repeat(depth)}${layout(doc)}`,
  })
