import { BoundKind } from "./BoundKind";
import { BoundStatement } from "./BoundStatement";

export class BoundProgram extends BoundStatement {
  constructor(public Kind: BoundKind, public Root: Array<BoundStatement>, public Map: Map<string, Set<string>>) {
    super(Kind);
  }
}
