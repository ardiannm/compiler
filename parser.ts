import Lexer from "./lexer.ts";
import UnknownCharacter from "./unknown.character.ts";
import Binary from "./binary.ts";
import Operator from "./operator.ts";
import Expression from "./expression.ts";
import Multiplication from "./multiplication.ts";
import Division from "./division.ts";
import Unary from "./unary.ts";
import OpenParenthesis from "./open.parenthesis.ts";
import Quote from "./quote.ts";
import String from "./string.ts";
import ParserError from "./parser.error.ts";
import WarningError from "./warning.error.ts";
import Substraction from "./substraction.ts";
import Addition from "./addition.ts";
import Exponentiation from "./exponentiation.ts";
import Identifier from "./identifier.ts";
import ClosingParenthesis from "./closing.parenthesis.ts";
import Token from "./token.ts";
import LessThan from "./less.than.ts";
import Equals from "./equals.ts";
import OpenTag from "./open.tag.ts";
import Property from "./property.ts";
import ClosingTag from "./closing.tag.ts";
import GreaterThan from "./greater.than.ts";
import UniTag from "./uni.tag.ts";
import Program from "./program.ts";
import Parenthesis from "./parenthesis.ts";

// deno-lint-ignore no-explicit-any
export type Constructor<Class> = new (...args: any[]) => Class;

export default class Parser extends Lexer {
  //
  private colorize(str: string, code = 39) {
    return `\u001b[38;5;${code}m${str}\u001b[0m`;
  }

  private assert<T extends Token>(instance: Token, constructor: Constructor<T>): boolean {
    return instance instanceof constructor;
  }

  private expect<T extends Token, E extends ParserError>(token: Token, tokenConstructor: Constructor<T>, message: string): T {
    if (this.assert(token, tokenConstructor)) return token as T;
    const error = new ParserError(message, token);
    this.log(error as E);
    throw error;
  }

  private doNotExpect<T extends Token, E extends ParserError>(token: Token, tokenConstructor: Constructor<T>, message: string): T {
    if (this.assert(token, tokenConstructor)) {
      const error = new ParserError(message, token);
      this.log(error as E);
      throw error;
    }
    return token as T;
  }

  protected log(error: ParserError) {
    const left = this.input.substring(0, error.position.from);
    const right = this.input.substring(error.position.from);
    const textMessage = left + "" + right;

    error.message = this.colorize(error.message);

    const pointer = left.replace(/./g, " ") + this.colorize("^ ") + this.colorize(error.message) + right.replace(/./g, " ");

    error.message =
      this.colorize(`\n${error.constructor.name}:`) +
      "\n\n" +
      (textMessage + "\n" + pointer)
        .split("\n")
        .map((line) => `    ${line}`)
        .join("\n") +
      "\n\n";

    error.message = "\n" + error.message;
    console.log(error.message);
    return error;
  }

  public parse() {
    try {
      const tree = this.parseProgram();
      return tree;
    } catch (e) {
      return e;
    }
  }

  private parseProgram() {
    const expressions = new Array<Expression>(this.parseHTML());
    while (this.hasMoreTokens()) {
      expressions.push(this.parseHTML());
    }
    return new Program(expressions, 0, this.input.length);
  }

  private parseHTML() {
    if (this.peekToken() instanceof LessThan) {
      return this.parseTag();
    }
    return this.parseMath();
  }

  private parseTag() {
    const left = this.expect(this.parseToken(), LessThan, "expecting a open '<' token");
    const tag = this.parseUniTag();
    const right = this.expect(this.parseToken(), GreaterThan, "expecting a closing '>' token");
    tag.from = left.from;
    tag.to = right.to;
    return tag;
  }

  private parseUniTag() {
    const left = this.parseOpenTag();
    if (this.peekToken() instanceof Division) {
      const right = this.expect(left, OpenTag, "unexpected token '/' found for this tag");
      this.parseToken();
      return new UniTag(left.identifier, right.properties, right.from, this.position);
    }
    return left;
  }

  private parseOpenTag() {
    if (this.peekToken() instanceof Division) {
      return this.parseClosingTag();
    }
    const identifier = this.expect(this.parseToken(), Identifier, "expecting identifier for an open tag");
    const properties = this.parseProperties();
    return new OpenTag(identifier, properties, identifier.from, this.position);
  }

  private parseClosingTag() {
    const division = this.expect(this.parseToken(), Division, "expecting '/' for a closing tag");
    const identifier = this.expect(this.parseToken(), Identifier, "expecting an identifier for this closing tag");
    return new ClosingTag(identifier, division.from, this.position);
  }

  private parseProperties() {
    const props = new Array<Property>();
    while (this.peekToken() instanceof Identifier) {
      const identifier = this.getNextToken() as Identifier;
      let value = "";
      if (this.peekToken() instanceof Equals) {
        this.getNextToken();
        value = this.expect(this.parseString(), String, "expecting a string value after '=' token following a tag property").raw;
      }
      props.push(new Property(identifier, value, identifier.from, this.position));
    }
    return props;
  }

  private parseMath() {
    return this.parseAddition();
  }

  private parseAddition() {
    let left = this.parseMultiplication();
    while (this.peekToken() instanceof Addition || this.peekToken() instanceof Substraction) {
      this.expect(left, Expression, `invalid left hand side expression in ${this.peekToken().token} operation`);
      const operator = this.parseToken() as Operator;
      const right = this.expect(this.parseMultiplication(), Expression, `invalid right hand side expression in ${operator.token} operation`);
      left = new Binary(left, operator, right, left.from, right.to);
    }
    return left;
  }

  private parseMultiplication() {
    let left = this.parsePower();
    while (this.peekToken() instanceof Multiplication || this.peekToken() instanceof Division) {
      const operator = this.parseToken() as Operator;
      this.expect(left, Expression, `invalid left hand side expression in ${operator.token} operation`);
      const right = this.expect(this.parsePower(), Expression, `invalid right hand side expression in ${operator.token} operation`);
      left = new Binary(left, operator, right, left.from, right.to);
    }
    return left;
  }

  private parsePower() {
    let left = this.parseUnary();
    if (this.peekToken() instanceof Exponentiation) {
      const operator = this.parseToken() as Operator;
      this.expect(left, Expression, `invalid left hand side expression in ${operator.token} operation`);
      const right = this.expect(this.parsePower(), Expression, `invalid right hand side expression in ${operator.token} operation`);
      left = new Binary(left, operator, right, left.from, right.to);
    }
    return left;
  }

  private parseUnary(): Expression {
    if (this.peekToken() instanceof Addition || this.peekToken() instanceof Substraction) {
      const operator = this.parseToken() as Operator;
      const right = this.expect(this.parseUnary(), Expression, `invalid expression in unary ${operator.token} operation`);
      return new Unary(operator, right, this.position, right.to);
    }
    return this.parseParanthesis();
  }

  private parseParanthesis() {
    if (this.peekToken() instanceof OpenParenthesis) {
      const left = this.getNextToken();
      this.doNotExpect(this.peekToken(), ClosingParenthesis, "no expression provided within parenthesis statement");
      const expression = this.expect(this.parseAddition(), Expression, "expecting expression after an open parenthesis");
      const right = this.expect(this.getNextToken(), ClosingParenthesis, "expecting to close this parenthesis");
      return new Parenthesis(expression, left.from, right.to);
    }
    return this.parseString();
  }

  private parseString() {
    if (this.peekToken() instanceof Quote) {
      this.keepSpace();
      const left = this.getNextToken() as Quote;
      let raw = "";
      while (this.hasMoreTokens()) {
        const token = this.peekToken();
        if (token instanceof UnknownCharacter) {
          this.log(new WarningError(`unknown character '${token.raw}' found while parsing`, token));
        }
        if (token instanceof Quote) break;
        raw += this.getNext();
      }
      const right = this.expect(this.parseToken(), Quote, "expecting a closing quote for the string");
      this.ignoreSpace();
      return new String(raw, left.to, right.from);
    }
    return this.parseToken();
  }

  private parseToken() {
    const token = this.getNextToken();
    if (token instanceof UnknownCharacter) {
      this.log(new WarningError(`unknown character '${token.raw}' found while parsing`, token));
    }
    return token;
  }
}
