import test from 'ava'
import { testProgram } from './helpers'
import { program, expectedOutput } from '../src/programs/decl-run'

test('run-seq', testProgram, program, expectedOutput)
