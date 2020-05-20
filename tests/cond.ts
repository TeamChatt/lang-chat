import test from 'ava'
import { testProgram } from './helpers'
import { program, expectedOutput } from '../src/programs/cond'

test('cond', testProgram, program, expectedOutput)
