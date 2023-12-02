import { SyntaxKind } from "./SyntaxKind";
import { SyntaxNode } from "./SyntaxNode";
import { Expression } from "./Expression";

export class BindReferenceAssignment extends Expression {
  constructor(public Kind: SyntaxKind, public Left: Expression, public Expression: SyntaxNode) {
    super(Kind);
  }
}
