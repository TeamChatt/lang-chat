import { Cmd } from '../static/ast'

export type Choice = {
  label: string
  index: number
}

type ChoiceBranch = { label: string; cmds: Cmd[] } // TODO: import definitions instead of redeclaring?

export const fromBranch = (choices: ChoiceBranch[]) => (
  choiceBranch: ChoiceBranch
): Choice => ({
  index: choices.indexOf(choiceBranch),
  label: choiceBranch.label,
})

export const toBranch = (choices: ChoiceBranch[]) => ({ index }: Choice) =>
  choices[index]
