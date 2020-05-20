import test from 'ava'
import { testProgram } from './helpers'
import { program, expectedOutput } from '../src/programs/decl-run-local'

test('seq', testProgram, program, expectedOutput)
