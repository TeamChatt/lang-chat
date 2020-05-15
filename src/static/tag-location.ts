import transform from './transform'

const tagLocation = (program) => {
  let index = 0
  const withLocation = (ast) => {
    index = index + 1
    return {
      ...ast,
      loc: `${index}`,
    }
  }
  return transform({
    Cmd: {
      'Cmd.Exec': withLocation,
      'Cmd.ChooseOne': withLocation,
      'Cmd.ChooseAll': withLocation,
    },
    Branch: {
      'Branch.Fork': withLocation,
    },
  })(program)
}

export default tagLocation
