import { SyntaxKind } from "./parser/kind/syntax.kind";
import { SyntaxNodeKind } from "./parser/kind/syntax.node.kind";
import { CompositeTokenKind } from "./parser/kind/composite.token.kind";
import { BinaryOperatorKind } from "./parser/kind/binary.operator.kind";
import { UnaryOperatorKind } from "./parser/kind/unary.operator.kind";
import { SyntaxToken, TokenText } from "./parser/syntax.token";
import { BinaryExpression } from "./parser/binary.expression";
import { UnaryExpression } from "./parser/unary.expression";
import { ParenthesizedExpression } from "./parser/parenthesized.expression";
import { RangeReference } from "./parser/range.reference";
import { CellReference } from "./parser/cell.reference";
import { SyntaxFacts } from "./parser/syntax.facts";
import { ExpressionSyntax } from "./parser/expression.syntax";
import { Program } from "./parser/program";
import { StatementSyntax } from "./parser/statement.syntax";
import { CellAssignment } from "./parser/cell.assignment";
import { FunctionExpression } from "./parser/function.expression";
import { Submission } from "./input/submission";
import { DiagnosticBag } from "./diagnostics/diagnostic.bag";

export class Parser {
  private Index = 0;

  private Tokens = new Array<SyntaxToken<SyntaxKind>>();
  private Trivia = new Array<SyntaxToken<SyntaxKind>>();

  constructor(public readonly Input: Submission, public Diagnostics: DiagnosticBag) {
    for (const Token of this.Input.Tokens) {
      if (SyntaxFacts.IsTrivia(Token.Kind)) {
        this.Trivia.push(Token);
      } else {
        this.Tokens.push(Token.EatTrivia(this.Trivia));
      }
    }
  }

  public Parse() {
    if (this.None()) {
      this.Diagnostics.EmptyProgram();
    }
    return this.ParseProgram();
  }

  public ParseProgram() {
    const Statements = new Array<StatementSyntax>();
    while (this.Any()) {
      const Token = this.Token;
      Statements.push(this.ParseFunction());
      if (this.Token === Token) this.NextToken();
    }
    return new Program(SyntaxNodeKind.Program, Statements, this.ExpectToken(SyntaxNodeKind.EndOfFileToken));
  }

  private ParseFunction() {
    if (this.MatchToken(SyntaxNodeKind.IdentifierToken, SyntaxNodeKind.OpenParenthesisToken)) {
      const FunctionName = this.NextToken() as SyntaxToken<SyntaxNodeKind.IdentifierToken>;
      this.ExpectToken(SyntaxNodeKind.OpenParenthesisToken);
      this.ExpectToken(SyntaxNodeKind.CloseParenthesisToken);
      this.ExpectToken(SyntaxNodeKind.OpenBraceToken);
      const Statements = new Array<StatementSyntax>();
      while (this.Any()) {
        if (this.MatchToken(SyntaxNodeKind.CloseBraceToken)) break;
        const Token = this.Token;
        Statements.push(this.ParseFunction());
        if (this.Token === Token) this.NextToken();
      }
      this.ExpectToken(SyntaxNodeKind.CloseBraceToken);
      return new FunctionExpression(SyntaxNodeKind.FunctionExpression, FunctionName, Statements);
    }
    return this.ParseStatement();
  }

  private ParseStatement() {
    const Left = this.ParseBinaryExpression();
    switch (this.Token.Kind) {
      case CompositeTokenKind.ColonColonToken:
        const Keyword = this.NextToken() as SyntaxToken<CompositeTokenKind.GreaterGreaterToken>;
        return new CellAssignment(SyntaxNodeKind.CellAssignment, Left, Keyword, this.ParseBinaryExpression());
    }
    return Left;
  }

  private ParseBinaryExpression(ParentPrecedence = 0): ExpressionSyntax {
    let Left = this.ParseUnaryExpression();
    while (true) {
      const BinaryPrecedence = SyntaxFacts.BinaryPrecedence(this.Token.Kind);
      if (BinaryPrecedence === 0 || BinaryPrecedence <= ParentPrecedence) {
        break;
      }
      const Operator = this.NextToken() as SyntaxToken<BinaryOperatorKind>;
      const Right = this.ParseBinaryExpression(BinaryPrecedence);
      Left = new BinaryExpression(SyntaxNodeKind.BinaryExpression, Left, Operator, Right);
    }
    return Left;
  }

  private ParseUnaryExpression(): ExpressionSyntax {
    const BinaryPrecedence = SyntaxFacts.UnaryPrecedence(this.Token.Kind);
    if (BinaryPrecedence !== 0) {
      const Operator = this.NextToken() as SyntaxToken<UnaryOperatorKind>;
      const Right = this.ParseUnaryExpression();
      return new UnaryExpression(SyntaxNodeKind.UnaryExpression, Operator, Right);
    }
    return this.ParseParenthesis();
  }

  private ParseParenthesis() {
    if (this.MatchToken(SyntaxNodeKind.OpenParenthesisToken)) {
      const Left = this.NextToken();
      const Expression = this.ParseBinaryExpression();
      const Right = this.ExpectToken(SyntaxNodeKind.CloseParenthesisToken);
      return new ParenthesizedExpression(SyntaxNodeKind.ParenthesizedExpression, Left, Expression, Right);
    }
    return this.ParseRangeReference();
  }

  private ParseRangeReference() {
    const Left = this.ParseCellReference();
    if (this.MatchToken(SyntaxNodeKind.ColonToken)) {
      this.NextToken();
      const Right = this.ParseCellReference();
      return new RangeReference(SyntaxNodeKind.RangeReference, Left, Right);
    }
    return Left;
  }

  private ParseCellReference() {
    if (this.MatchToken(SyntaxNodeKind.IdentifierToken, SyntaxNodeKind.NumberToken)) {
      const Left = this.NextToken() as SyntaxToken<SyntaxNodeKind.IdentifierToken>;
      const Right = this.NextToken() as SyntaxToken<SyntaxNodeKind.NumberToken>;
      return new CellReference(SyntaxNodeKind.CellReference, Left, Right);
    }
    return this.ParseLiteral();
  }

  private ParseLiteral() {
    const Kind = this.Token.Kind;
    switch (Kind) {
      // case TokenKind.TrueToken:
      // case TokenKind.FalseToken:
      case SyntaxNodeKind.IdentifierToken:
      case SyntaxNodeKind.NumberToken:
        return this.NextToken();
      default:
        return this.ExpectToken(SyntaxNodeKind.Expression);
    }
  }

  private PeekToken(Offset: number) {
    const ThisIndex = this.Index + Offset;
    const PrevIndex = this.Tokens.length - 1;
    if (ThisIndex > PrevIndex) return this.Tokens[PrevIndex];
    return this.Tokens[ThisIndex];
  }

  private get Token() {
    return this.PeekToken(0);
  }

  private NextToken() {
    const Token = this.Token;
    this.Index++;
    return Token;
  }

  private MatchToken(...Kinds: Array<SyntaxKind>) {
    let Offset = 0;
    for (const Kind of Kinds) {
      if (Kind !== this.PeekToken(Offset).Kind) return false;
      Offset++;
    }
    return true;
  }

  private ExpectToken<Kind extends SyntaxKind>(Kind: Kind): SyntaxToken<Kind> {
    if (this.MatchToken(Kind)) {
      return this.NextToken() as SyntaxToken<Kind>;
    }
    this.Diagnostics.TokenMissmatch(this.Token.Kind, Kind);
    return new SyntaxToken(this.Token.Kind as Kind, this.Token.Text as TokenText<Kind>, this.Token.Span);
  }

  private Any() {
    return !this.MatchToken(SyntaxNodeKind.EndOfFileToken);
  }

  private None() {
    return !this.Any();
  }
}