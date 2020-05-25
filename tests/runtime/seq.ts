import test from 'ava'
import { testProgram } from '../helpers'
import { program, expectedOutput } from '../../src/programs/seq'

test('run seq', testProgram, program, expectedOutput)
