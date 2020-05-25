import test from 'ava'
import { testProgram } from '../helpers'
import { program, expectedOutput } from '../../src/programs/dialogue'

test('run dialogue', testProgram, program, expectedOutput)
