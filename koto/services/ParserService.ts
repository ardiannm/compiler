import SyntaxToken from "../ast/tokens/SyntaxToken";
import Constructor from "./Constructor";
import Lexer from "../Lexer";

enum ColorCode {
  Red = `\x1b[31m`,
  Blue = `\x1b[38;2;86;156;214m`,
  White = `\x1b[0m`,
  Green = `\x1b[38;2;78;201;176m`,
  Orange = `\x1b[38;2;215;186;125m`,
  Brown = `\x1b[38;2;206;145;120m`,
}

export default class ParserService extends Lexer {
  private storeLine?: number;
  private storeColumn?: number;
  constructor(public input: string, public path: string) {
    super(input);
  }

  protected assert<T extends SyntaxToken>(instance: SyntaxToken, tokenType: Constructor<T>): boolean {
    return instance instanceof tokenType;
  }

  protected expect<T extends SyntaxToken>(token: SyntaxToken, tokenType: Constructor<T>, message: string): T {
    if (this.assert(token, tokenType)) return token as T;
    throw this.report(message);
  }

  protected doNotExpect<T extends SyntaxToken>(token: SyntaxToken, tokenType: Constructor<T>, message: string): T {
    if (this.assert(token, tokenType)) {
      throw this.report(message);
    }
    return token as T;
  }

  protected throwError(message: string) {
    throw this.report(message);
  }

  protected trackPosition() {
    this.storeLine = this.line;
    this.storeColumn = this.column;
  }

  protected untrackPosition() {
    this.storeLine = undefined;
    this.storeColumn = undefined;
  }

  protected report(msg: string) {
    const input = this.input.split("\n");

    const line = this.storeLine || this.line;
    const column = this.storeColumn || this.column;

    const report = new Array<string>();

    report.push("");
    report.push("");

    report.push(this.colorize(`message: ${msg}`, ColorCode.Orange));
    report.push(this.displayLine(input, line, column));

    report.push("");

    this.storeColumn = undefined;
    return report.join("\n");
  }

  private displayLine(input: Array<string>, line: number, column: number) {
    let target = input[line - 1];
    let textContent1 = "";
    if (column > 70) textContent1 += target.substring(column - 1 - 70, column - 1);
    else textContent1 += target.substring(0, column - 1);
    let textContent2 = textContent1 + target.substring(column - 1, column - 1 + 30);
    const lineNumber = ` -- ${line} -- `;
    const adjustSpace = " ".repeat(textContent1.length + lineNumber.length + 1);
    textContent2 += "\n" + adjustSpace + this.colorize(`\`--- ${this.path}:${line}:${column}`, ColorCode.Orange);
    return this.colorize(lineNumber + textContent2, ColorCode.Blue);
  }

  private colorize(text: string, startColor: ColorCode, endColor = ColorCode.White) {
    return `${startColor}${text} ${endColor}`;
  }
}