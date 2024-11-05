import { SyntaxKind } from "./kind/syntax.kind";
import { SyntaxNodeKind } from "./kind/syntax.node.kind";
import { SyntaxNode } from "./syntax.node";
import { SyntaxToken } from "./syntax.token";

export class SyntaxCompilationUnit extends SyntaxNode {
  constructor(public root: Array<SyntaxNode>, public eof: SyntaxToken<SyntaxNodeKind.EndOfFileToken>) {
    super(SyntaxNodeKind.SyntaxCompilationUnit);
  }

  override getFirstChild(): SyntaxToken<SyntaxKind> {
    return this.root.length > 0 ? this.root[0].getFirstChild() : this.getLastChild();
  }

  override getLastChild(): SyntaxToken<SyntaxKind> {
    return this.eof;
  }
}
