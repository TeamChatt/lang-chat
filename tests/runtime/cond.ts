import test from 'ava'
import { testProgram } from '../helpers'
import { program, expectedOutput } from '../../src/programs/cond'

test('run cond', testProgram, program, expectedOutput)
