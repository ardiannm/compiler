import { BoundKind } from "./BoundKind";
import { HasReference } from "./HasReference";

export class BoundCellReference extends HasReference {
  constructor(public Kind: BoundKind, public Name: string) {
    super(Kind, Name);
  }
}
