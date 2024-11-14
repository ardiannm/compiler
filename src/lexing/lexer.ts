import { SyntaxCompositeTokenKind } from "../analysis/parsing/kind/syntax.composite.token.kind";
import { SyntaxKind } from "../analysis/parsing/kind/syntax.kind";
import { SyntaxNodeKind } from "../analysis/parsing/kind/syntax.node.kind";
import { SyntaxTriviaKind } from "../analysis/parsing/kind/syntax.trivia.kind";
import { SyntaxFacts } from "../analysis/parsing/syntax.facts";
import { Token } from "./token";
import { SourceText } from "./source.text";
import { TextSpan } from "./text.span";

export class Lexer {
  private kind: SyntaxKind;
  private start: number;
  private end: number;

  private constructor(private readonly sourceText: SourceText) {
    this.kind = SyntaxNodeKind.EndOfFileToken;
    this.start = 0;
    this.end = this.start;
  }

  static createFrom(text: SourceText) {
    return new Lexer(text);
  }

  *lex(): Generator<Token> {
    let token: Token;
    do {
      token = this.lexNextToken();
      yield token;
    } while (token.kind !== SyntaxNodeKind.EndOfFileToken);
  }

  private lexNextToken() {
    this.start = this.end;
    this.kind = SyntaxFacts.getSyntaxKind(this.char());
    switch (this.kind) {
      case SyntaxNodeKind.BadToken:
        return this.lexBadToken();
      case SyntaxNodeKind.HashToken:
        return this.lexCommentToken();
      case SyntaxNodeKind.ColonToken:
        return this.lexColonColonToken();
    }
    this.next();
    return new Token(this.kind, this.createTextSpan());
  }

  private lexBadToken(): Token {
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
    const span = this.createTextSpan();
    this.sourceText.diagnostics.badCharacterFound(character, span);
    return new Token(this.kind, span);
  }

  private lexCommentToken(): Token {
    do {
      this.next();
    } while (!(this.match(SyntaxTriviaKind.LineBreakTrivia) || this.match(SyntaxNodeKind.EndOfFileToken)));
    return new Token(SyntaxTriviaKind.CommentTrivia, this.createTextSpan());
  }

  private lexColonColonToken(): Token {
    this.next();
    this.kind = SyntaxNodeKind.ColonToken;
    if (this.match(SyntaxNodeKind.ColonToken)) {
      this.next();
      this.kind = SyntaxCompositeTokenKind.ColonColonToken;
    }
    return new Token(this.kind, this.createTextSpan());
  }

  private lexIdentifier(): Token {
    while (this.isLetter()) this.next();
    const span = this.createTextSpan();
    const text = this.sourceText.text.substring(span.start, span.end);
    return new Token(Token.isKeywordOrIdentifer(text), span);
  }

  private lexSpaceToken(): Token {
    while (this.isSpace()) this.next();
    return new Token(SyntaxTriviaKind.SpaceTrivia, this.createTextSpan());
  }

  private lexNumberToken(): Token {
    while (this.isDigit()) this.next();
    if (this.match(SyntaxNodeKind.DotToken)) {
      this.next();
      if (!this.isDigit()) {
        this.sourceText.diagnostics.badFloatingPointNumber(this.createTextSpan());
      }
    }
    while (this.isDigit()) this.next();
    return new Token(SyntaxNodeKind.NumberToken, this.createTextSpan());
  }

  private createTextSpan() {
    return TextSpan.createFrom(this.sourceText, this.start, this.end, 0);
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
    return this.sourceText.text.substring(start, start + 1);
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
