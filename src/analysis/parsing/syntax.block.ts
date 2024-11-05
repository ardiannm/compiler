import { SyntaxKind } from "./kind/syntax.kind";
import { SyntaxNodeKind } from "./kind/syntax.node.kind";
import { SyntaxNode } from "./syntax.node";
import { SyntaxToken } from "./syntax.token";

export class SyntaxBlock extends SyntaxNode {
  constructor(public openBrace: SyntaxToken<SyntaxNodeKind.OpenBraceToken>, public statements: Array<SyntaxNode>, public closeBrace: SyntaxToken<SyntaxNodeKind.CloseBraceToken>) {
    super(SyntaxNodeKind.SyntaxBlock);
  }

  override getFirstChild(): SyntaxToken<SyntaxKind> {
    return this.openBrace;
  }

  override getLastChild(): SyntaxToken<SyntaxKind> {
    return this.closeBrace;
  }
}
