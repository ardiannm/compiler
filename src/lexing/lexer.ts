import { SyntaxBinaryOperatorKind } from "../analysis/parsing/kind/syntax.binary.operator.kind";
import { SyntaxCompositeTokenKind } from "../analysis/parsing/kind/syntax.composite.token.kind";
import { SyntaxKind } from "../analysis/parsing/kind/syntax.kind";
import { SyntaxNodeKind } from "../analysis/parsing/kind/syntax.node.kind";
import { SyntaxTriviaKind } from "../analysis/parsing/kind/syntax.trivia.kind";
import { SyntaxFacts } from "../analysis/parsing/syntax.facts";
import { SyntaxToken } from "../analysis/parsing/syntax.token";
import { SourceText } from "./source.text";
import { Span } from "./span";

export class Lexer {
  private kind: SyntaxKind;
  private start: number;
  private end: number;

  constructor(private readonly text: SourceText) {
    this.kind = SyntaxNodeKind.EndOfFileToken;
    this.start = 0;
    this.end = this.start;
  }

  // Generator function that calls lexNextToken and yields each token
  *lex(): Generator<SyntaxToken> {
    let token: SyntaxToken;
    do {
      token = this.lexNextToken();
      console.log(token);

      yield token;
    } while (token.kind !== SyntaxNodeKind.EndOfFileToken);
  }

  private lexNextToken() {
    this.start = this.end;
    this.kind = SyntaxFacts.getSyntaxKind(this.char());
    if (this.match(SyntaxNodeKind.SingleQuoteToken, SyntaxNodeKind.SingleQuoteToken, SyntaxNodeKind.SingleQuoteToken)) {
      return this.lexMultilineCommentToken();
    }
    if (this.match(SyntaxCompositeTokenKind.GreaterGreaterToken, SyntaxCompositeTokenKind.GreaterGreaterToken)) {
      return this.lexGreaterGreaterToken();
    }
    switch (this.kind) {
      case SyntaxNodeKind.BadToken:
        return this.lexBadToken();
      case SyntaxNodeKind.HashToken:
        return this.lexCommentToken();
      case SyntaxBinaryOperatorKind.MinusToken:
        return this.lexMinusToken();
      case SyntaxNodeKind.ColonToken:
        return this.lexColonColonToken();
    }
    this.next();
    return new SyntaxToken(this.kind, this.createSpan());
  }

  private lexBadToken(): SyntaxToken {
    if (this.isLetter()) {
      return this.lexIdentifier();
    }
    if (this.isDigit()) {
      return this.lexNumberToken();
    }
    if (this.isSpace()) {
      return this.lexSpaceToken();
    }
    const character = this.char();
    this.next();
    const span = this.createSpan();
    this.text.diagnostics.badCharacterFound(character, span);
    return new SyntaxToken(this.kind, span);
  }

  private lexMultilineCommentToken() {
    this.next(3);
    while (!(this.match(SyntaxNodeKind.EndOfFileToken) || this.match(SyntaxNodeKind.SingleQuoteToken, SyntaxNodeKind.SingleQuoteToken, SyntaxNodeKind.SingleQuoteToken))) {
      this.next();
    }
    if (this.match(SyntaxNodeKind.SingleQuoteToken, SyntaxNodeKind.SingleQuoteToken, SyntaxNodeKind.SingleQuoteToken)) {
      this.next(3);
    } else {
      this.text.diagnostics.missingTripleQuotes(this.createSpan());
    }
    return new SyntaxToken(SyntaxTriviaKind.MultilineCommentTrivia, this.createSpan());
  }

  private lexCommentToken(): SyntaxToken {
    do {
      this.next();
    } while (!(this.match(SyntaxTriviaKind.LineBreakTrivia) || this.match(SyntaxNodeKind.EndOfFileToken)));
    return new SyntaxToken(SyntaxTriviaKind.CommentTrivia, this.createSpan());
  }

  private lexMinusToken(): SyntaxToken {
    this.next();
    this.kind = SyntaxBinaryOperatorKind.MinusToken;
    if (this.match(SyntaxNodeKind.GreaterToken)) {
      this.next();
      this.kind = SyntaxCompositeTokenKind.PointerToken;
    }
    return new SyntaxToken(this.kind, this.createSpan());
  }

  private lexGreaterGreaterToken(): SyntaxToken {
    this.next(2);
    this.kind = SyntaxCompositeTokenKind.GreaterGreaterToken;
    return new SyntaxToken(this.kind, this.createSpan());
  }

  private lexColonColonToken(): SyntaxToken {
    this.next();
    this.kind = SyntaxNodeKind.ColonToken;
    if (this.match(SyntaxNodeKind.ColonToken)) {
      this.next();
      this.kind = SyntaxCompositeTokenKind.ColonColonToken;
    }
    return new SyntaxToken(this.kind, this.createSpan());
  }

  private lexIdentifier(): SyntaxToken {
    while (this.isLetter()) this.next();
    const span = this.createSpan();
    const text = this.text.text.substring(span.start, span.end);
    return new SyntaxToken(SyntaxToken.isKeywordOrIdentifer(text), span);
  }

  private lexSpaceToken(): SyntaxToken {
    while (this.isSpace()) this.next();
    return new SyntaxToken(SyntaxTriviaKind.SpaceTrivia, this.createSpan());
  }

  private lexNumberToken(): SyntaxToken {
    while (this.isDigit()) this.next();
    if (this.match(SyntaxNodeKind.DotToken)) {
      this.next();
      if (!this.isDigit()) {
        this.text.diagnostics.badFloatingPointNumber(this.createSpan());
      }
    }
    while (this.isDigit()) this.next();
    return new SyntaxToken(SyntaxNodeKind.NumberToken, this.createSpan());
  }

  private createSpan() {
    return Span.createFrom(this.start, this.end);
  }

  private isSpace(): boolean {
    const char = this.char();
    return char === " " || char === "\t" || char === "\r";
  }

  private isDigit(): boolean {
    const charCode = this.char().charCodeAt(0);
    return charCode >= 48 && charCode <= 57;
  }

  private isLetter(): boolean {
    const charCode = this.char().charCodeAt(0);
    return (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122);
  }

  private peek(offset: number): string {
    const start = this.end + offset;
    return this.text.text.substring(start, start + 1);
  }

  private char() {
    return this.peek(0);
  }

  private next(steps = 1) {
    this.end = this.end + steps;
  }

  private match(...kinds: SyntaxKind[]) {
    let offset = 0;
    for (const kind of kinds) {
      if (kind !== SyntaxFacts.getSyntaxKind(this.peek(offset))) return false;
      offset++;
    }
    return true;
  }
}
