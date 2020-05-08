Program := Seq [Command]

Command :=
  NewRef?
  SetRef?
  GetRef?
  Declare Var Expr
  Exec <CUSTOM_DIRECTIVE>
  
  Run Expr
  ChooseOne [ChoiceBranch]
  ChooseAll [ChoiceBranch]
  ForkFirst [ForkBranch]
  ForkAll [ForkBranch]

ChoiceBranch := Choice [Command]
ForkBranch   := Fork [Command]
CaseBranch   := Case Expr Expr

Expr :=
  Var
  Literal
  Cond [CaseBranch]
  Cmd Command
  Cmds [Command]

CUSTOM_DIRECTIVE: [Expr]