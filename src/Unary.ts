import Expression from "./Expression";
import Operator from "./Operator";

export default class Unary extends Expression {
  constructor(public operator: Operator, public right: Expression) {
    super();
  }
}