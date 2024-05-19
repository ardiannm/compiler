import { BoundKind } from "./kind/bound.kind";
import { BoundExpression } from "./expression";
import { BoundUnaryOperatorKind } from "./kind/unary.operator.kind";

export class BoundUnaryExpression extends BoundExpression {
  constructor(public override Kind: BoundKind.UnaryExpression, public OperatorKind: BoundUnaryOperatorKind, public Right: BoundExpression) {
    super(Kind);
  }
}