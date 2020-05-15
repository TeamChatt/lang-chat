//TODO: how to write types for this
const match = (obj, cases) => cases[obj.kind](obj)

export default match
