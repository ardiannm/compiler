import { BoundBlockStatements } from "./bound.block.statements";
import { BoundKind } from "./kind/bound.kind";
import { BoundStatement } from "./statement";

export class BoundCompilationUnit extends BoundStatement {
  constructor(public statements: BoundBlockStatements) {
    super(BoundKind.CompilationUnit);
  }
}
