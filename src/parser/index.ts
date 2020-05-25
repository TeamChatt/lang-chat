import { programParser } from './parser'

export const parse = (source: string) => programParser.tryParse(source)
