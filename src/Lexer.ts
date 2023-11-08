import { Syntax } from "./Syntax";
import { SyntaxToken } from "./SyntaxToken";

export class Lexer {
  constructor(public input: string) {}

  public pointer = 0;
  private space = false;

  private isLetter(char: string): boolean {
    const charCode = char.charCodeAt(0);
    return (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122);
  }

  private isDigit(char: string): boolean {
    const charCode = char.charCodeAt(0);
    return charCode >= 48 && charCode <= 57;
  }

  private isSpace(char: string): boolean {
    return char === " " || char === "\t" || char === "\n" || char === "\r";
  }

  private getChar(): string {
    return this.input.charAt(this.pointer);
  }

  private advance(): void {
    this.pointer = this.pointer + 1;
  }

  public considerSpace(): void {
    this.space = true;
  }

  public ignoreSpace(): void {
    this.space = false;
  }

  public hasMoreTokens(): boolean {
    return this.pointer < this.input.length;
  }

  public getNextToken(): SyntaxToken {
    const char = this.getChar();

    if (this.isLetter(char)) {
      const start = this.pointer;
      while (this.isLetter(this.getChar())) {
        this.advance();
      }
      const view = this.input.substring(start, this.pointer);
      return new SyntaxToken(Syntax.IndentifierToken, view);
    }

    if (this.isDigit(char)) {
      const start = this.pointer;
      while (this.isDigit(this.getChar())) {
        this.advance();
      }
      const view = this.input.substring(start, this.pointer);
      return new SyntaxToken(Syntax.NumberToken, view);
    }

    if (this.isSpace(char)) {
      const start = this.pointer;
      while (this.isSpace(this.getChar())) {
        this.advance();
      }
      if (this.space) {
        const view = this.input.substring(start, this.pointer);
        return new SyntaxToken(Syntax.SpaceToken, view);
      }
      return this.getNextToken();
    }

    this.advance();

    if (char === "+") return new SyntaxToken(Syntax.PlusToken, "+");
    if (char === "-") return new SyntaxToken(Syntax.MinusToken, "-");
    if (char === "/") return new SyntaxToken(Syntax.SlashToken, "/");
    if (char === "*") return new SyntaxToken(Syntax.StarToken, "*");
    if (char === ":") return new SyntaxToken(Syntax.ColonToken, ":");
    if (char === "(") return new SyntaxToken(Syntax.OpenParenthesisToken, "(");
    if (char === ")") return new SyntaxToken(Syntax.CloseParenthesisToken, ")");
    if (char === ">") return new SyntaxToken(Syntax.GreaterToken, ">");

    return new SyntaxToken(Syntax.BadToken, char);
  }
}
