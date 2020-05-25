import test from 'ava'
import { testProgram } from '../helpers'
import { program, expectedOutput } from '../../src/programs/seq'

test('decl-run', testProgram, program, expectedOutput)
