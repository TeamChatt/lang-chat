import { ChoiceBranch } from '../static/ast'

export type Choice = {
  label: string
  index: number
}

export const fromBranch = (choices: ChoiceBranch[]) => (
  choiceBranch: ChoiceBranch
): Choice => ({
  index: choices.indexOf(choiceBranch),
  label: choiceBranch.label,
})

export const toBranch = (choices: ChoiceBranch[]) => ({ index }: Choice) =>
  choices[index]
