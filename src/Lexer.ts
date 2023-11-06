import { SyntaxKind } from "./SyntaxKind";
import { SyntaxToken } from "./SyntaxToken";

export class Lexer {
  constructor(public input: string) {}

  public pointer = 0;
  private space = false;

  isLetter(char: string): boolean {
    const charCode = char.charCodeAt(0);
    return (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122);
  }

  isDigit(char: string): boolean {
    const charCode = char.charCodeAt(0);
    return charCode >= 48 && charCode <= 57;
  }

  isSpace(char: string): boolean {
    return char === " " || char === "\t" || char === "\n" || char === "\r";
  }

  getChar(): string {
    return this.input.charAt(this.pointer);
  }

  advance(): void {
    this.pointer = this.pointer + 1;
  }

  considerSpace(): void {
    this.space = true;
  }

  ignoreSpace(): void {
    this.space = false;
  }

  hasMoreTokens(): boolean {
    return this.pointer < this.input.length;
  }

  peekToken() {
    const pointer = this.pointer;
    const token = this.getNextToken();
    this.pointer = pointer;
    return token;
  }

  getNextToken(): SyntaxToken {
    const char = this.getChar();

    if (this.isLetter(char)) {
      const start = this.pointer;
      while (this.isLetter(this.getChar())) {
        this.advance();
      }
      const view = this.input.substring(start, this.pointer);
      return new SyntaxToken(SyntaxKind.IndentifierToken, view);
    }

    if (this.isDigit(char)) {
      const start = this.pointer;
      while (this.isDigit(this.getChar())) {
        this.advance();
      }
      const view = this.input.substring(start, this.pointer);
      return new SyntaxToken(SyntaxKind.NumberToken, view);
    }

    if (this.isSpace(char)) {
      const start = this.pointer;
      while (this.isSpace(this.getChar())) {
        this.advance();
      }
      if (this.space) {
        const view = this.input.substring(start, this.pointer);
        return new SyntaxToken(SyntaxKind.SpaceToken, view);
      }
      return this.getNextToken();
    }

    this.advance();

    if (char === "+") return new SyntaxToken(SyntaxKind.PlusToken, "+");
    if (char === "-") return new SyntaxToken(SyntaxKind.MinusToken, "-");
    if (char === "/") return new SyntaxToken(SyntaxKind.SlashToken, "/");
    if (char === "*") return new SyntaxToken(SyntaxKind.StarToken, "*");
    if (char === ":") return new SyntaxToken(SyntaxKind.ColonToken, ":");

    return new SyntaxToken(SyntaxKind.BadToken, char);
  }
}
