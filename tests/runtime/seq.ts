import test from 'ava'
import { testProgram } from '../helpers'
import { program, expectedOutput } from '../../src/programs/seq'

test('seq', testProgram, program, expectedOutput)
