import test from 'ava'
import { testProgram } from './helpers'
import { program, expectedOutput } from '../src/programs/decl-run-local'

test('decl-run-local', testProgram, program, expectedOutput)
