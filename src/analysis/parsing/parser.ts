import { SourceText } from "../../lexing/source.text";
import { SyntaxBinaryOperatorKind } from "./kind/syntax.binary.operator.kind";
import { SyntaxCompositeTokenKind } from "./kind/syntax.composite.token.kind";
import { SyntaxKind } from "./kind/syntax.kind";
import { SyntaxNodeKind } from "./kind/syntax.node.kind";
import { SyntaxUnaryOperatorKind } from "./kind/syntax.unary.operator.kind";
import { SyntaxBinaryExpression } from "./syntax.binary.expression";
import { SyntaxBlock } from "./syntax.block";
import { SyntaxCellAssignment } from "./syntax.cell.assignment";
import { SyntaxCellReference } from "./syntax.cell.reference";
import { SyntaxCompilationUnit } from "./syntax.compilation.unit";
import { SyntaxFacts } from "./syntax.facts";
import { SyntaxNode } from "./syntax.node";
import { SyntaxParenthesis } from "./syntax.parenthesis";
import { SyntaxToken } from "./syntax.token";
import { Token } from "../../lexing/token";
import { SyntaxUnaryExpression } from "./syntax.unary.expression";

export class Parser {
  private index = 0;
  private recovering = false;
  private syntaxTokens = [] as SyntaxToken[];

  private constructor(public readonly sourceText: SourceText) {
    let trivias = [] as Token[];
    for (const token of this.sourceText.tokens) {
      if (Token.isTrivia(token.kind) || token.kind === SyntaxNodeKind.BadToken) {
        trivias.push(token);
      } else {
        const syntaxToken = SyntaxToken.createFrom(this.sourceText, token, trivias);
        this.syntaxTokens.push(syntaxToken);
        trivias = [];
      }
    }
  }

  static parseCompilationUnit(tree: SourceText) {
    return new Parser(tree).parseCompilationUnit();
  }

  private parseCompilationUnit() {
    const statements = new Array<SyntaxNode>(this.parseBlock());
    while (this.hasToken()) {
      const startToken = this.peekToken();
      statements.push(this.parseBlock());
      if (this.peekToken() === startToken) this.getNextToken();
    }
    const endOfFileToken = this.expect(SyntaxNodeKind.EndOfFileToken);
    return new SyntaxCompilationUnit(this.sourceText, statements, endOfFileToken);
  }

  private parseBlock() {
    if (this.match(SyntaxNodeKind.OpenBraceToken)) {
      const openBrace = this.expect(SyntaxNodeKind.OpenBraceToken);
      const statements = new Array<SyntaxNode>();
      while (this.hasToken() && !this.match(SyntaxNodeKind.CloseBraceToken)) {
        const startToken = this.peekToken();
        statements.push(this.parseBlock());
        if (this.peekToken() === startToken) this.getNextToken();
      }
      const closeBrace = this.expect(SyntaxNodeKind.CloseBraceToken);
      const node = new SyntaxBlock(this.sourceText, openBrace, statements, closeBrace);
      if (closeBrace.kind === SyntaxNodeKind.CloseBraceToken && !statements.length) {
        this.sourceText.diagnostics.emptyBlock(node.span);
      }
      return node;
    }
    return this.parseCellAssignment();
  }

  private parseCellAssignment() {
    const left = this.parseBinaryExpression();
    switch (this.peekToken().kind) {
      case SyntaxCompositeTokenKind.ColonColonToken:
        const keyword = this.getNextToken() as SyntaxToken<SyntaxCompositeTokenKind.ColonColonToken>;
        return new SyntaxCellAssignment(this.sourceText, left, keyword, this.parseBinaryExpression());
    }
    return left;
  }

  private parseBinaryExpression(parentPrecedence = 0): SyntaxNode {
    let left = this.parseUnaryExpression();
    while (true) {
      const precedence = SyntaxFacts.getBinaryPrecedence(this.peekToken().kind);
      if (precedence === 0 || precedence <= parentPrecedence) {
        break;
      }
      const operator = this.getNextToken() as SyntaxToken<SyntaxBinaryOperatorKind>;
      const right = this.parseBinaryExpression(precedence);
      left = new SyntaxBinaryExpression(this.sourceText, left, operator, right);
    }
    return left;
  }

  private parseUnaryExpression(): SyntaxNode {
    const precedence = SyntaxFacts.getUnaryPrecedence(this.peekToken().kind);
    if (precedence) {
      const operator = this.getNextToken() as SyntaxToken<SyntaxUnaryOperatorKind>;
      const right = this.parseUnaryExpression();
      return new SyntaxUnaryExpression(this.sourceText, operator, right);
    }
    return this.parseParenthesis();
  }

  private parseParenthesis() {
    if (this.match(SyntaxNodeKind.OpenParenthesisToken)) {
      const left = this.getNextToken();
      const expression = this.parseBinaryExpression();
      const right = this.expect(SyntaxNodeKind.CloseParenthesisToken);
      return new SyntaxParenthesis(this.sourceText, left as SyntaxToken<SyntaxNodeKind.OpenParenthesisToken>, expression, right);
    }
    return this.parseCellReference();
  }

  private parseCellReference() {
    if (this.match(SyntaxNodeKind.IdentifierToken, SyntaxNodeKind.NumberToken)) {
      const left = this.getNextToken() as SyntaxToken<SyntaxNodeKind.IdentifierToken>;
      const right = this.getNextToken() as SyntaxToken<SyntaxNodeKind.NumberToken>;
      const node = new SyntaxCellReference(this.sourceText, left, right);
      if (right.hasTrivia()) {
        const name = left.text + right.text;
        this.sourceText.diagnostics.requireCompactCellReference(name, node.span);
      }
      return node;
    }
    return this.parseLiteral();
  }

  private parseLiteral() {
    const token = this.peekToken();
    switch (token.kind) {
      case SyntaxNodeKind.IdentifierToken:
      case SyntaxNodeKind.NumberToken:
        return this.getNextToken();
    }
    return this.expect(SyntaxNodeKind.SyntaxExpression);
  }

  private hasToken() {
    return !this.match(SyntaxNodeKind.EndOfFileToken);
  }

  private peekToken(offset: number = 0) {
    const thisIndex = this.index + offset;
    const lastIndex = this.syntaxTokens.length - 1;
    if (thisIndex > lastIndex) return this.syntaxTokens[lastIndex];
    return this.syntaxTokens[thisIndex];
  }

  private getNextToken() {
    const token = this.peekToken();
    this.index++;
    return token;
  }

  private match(...kinds: Array<SyntaxKind>) {
    let offset = 0;
    for (const kind of kinds) {
      if (kind !== this.peekToken(offset).kind) return false;
      offset++;
    }
    this.recovering = false;
    return true;
  }

  private expect<Kind extends SyntaxKind>(kind: Kind): SyntaxToken<Kind> {
    if (this.match(kind)) {
      return this.getNextToken() as SyntaxToken<Kind>;
    }
    const token = this.peekToken() as SyntaxToken<Kind>;
    if (this.recovering) {
      return token;
    }
    this.recovering = true;
    this.sourceText.diagnostics.unexpectedTokenFound(token.kind, kind, token.span);
    return token as SyntaxToken<Kind>;
  }
}
