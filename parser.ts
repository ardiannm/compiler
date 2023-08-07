import Lexer from "./lexer.ts";
import UnknownCharacter from "./unknown.character.ts";
import Binary from "./binary.ts";
import Operator from "./operator.ts";
import Expression from "./expression.ts";
import Multiplication from "./multiplication.ts";
import Division from "./division.ts";
import Unary from "./unary.ts";
import OpenParenthesis from "./open.parenthesis.ts";
import Parenthesis from "./parenthesis.ts";
import Quote from "./quote.ts";
import String from "./string.ts";
import ParserError from "./parser.error.ts";
import WarningError from "./warning.error.ts";
import LogError from "./log.error.ts";
import Substraction from "./substraction.ts";
import Addition from "./addition.ts";
import Exponentiation from "./exponentiation.ts";
import LessThan from "./less.than.ts";
import Identifier from "./identifier.ts";
import GreaterThan from "./greater.than.ts";
import TokenInfo from "./token.info.ts";
import Properties from "./properties.ts";
import UnaryTag from "./unary.tag.ts";
import ClosingTag from "./closing.tag.ts";
import OpenTag from "./open.tag.ts";
import ClosingParenthesis from "./closing.parenthesis.ts";
import Token from "./token.ts";
import PlainText from "./plain.text.ts";
import HTML from "./html.ts";
import Component from "./component.ts";
import Program from "./program.ts";
import EOF from "./eof.ts";

// deno-lint-ignore no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

export default class Parser extends Lexer {
  public tree = new EOF(new TokenInfo(0, 0));

  private assert<T extends Token>(instance: Token, constructor: Constructor<T>): boolean {
    return instance instanceof constructor;
  }

  private expect<T extends Token>(token: Token, constructor: Constructor<T>, error: LogError): T {
    if (this.assert(token, constructor)) return token as T;
    this.logError(error, token);
    return token as T;
  }

  public parse() {
    return this.parseProgram();
  }

  private parseProgram() {
    const expressions = new Array<Expression>(this.parseComponent());
    while (this.hasMoreTokens()) {
      expressions.push(this.parseComponent());
    }
    return new Program(expressions, new TokenInfo(0, this.input.length));
  }

  private parseComponent(): HTML {
    const left = this.parseTag();
    if (left instanceof OpenTag) {
      const tagName = left.identifier.raw;
      const components = new Array<HTML>();
      while (this.hasMoreTokens()) {
        const right = this.parseComponent();
        if (right instanceof ClosingTag) {
          if (right.identifier.raw !== left.identifier.raw) {
            this.logError(new ParserError(`Name tag '${right.identifier.raw}' for '${left.identifier.raw}' tag is not a match`), right);
          }
          return new Component(tagName, components, new TokenInfo(left.info.from, this.position));
        }
        components.push(right);
      }
      this.expect(this.parseTag(), ClosingTag, new ParserError("Expecting a closing tag for this component"));
      return new Component(tagName, components, new TokenInfo(left.info.from, this.position));
    }
    return left;
  }

  private parseTag() {
    if (this.peekToken() instanceof LessThan) {
      const division = this.parseToken();
      let hasDivision = false;
      let tagName = new Identifier("", new TokenInfo(division.info.from, division.info.from));
      if (this.peekToken() instanceof Division) {
        this.parseToken();
        hasDivision = true;
      }
      if (this.peekToken() instanceof Identifier) {
        tagName = this.parseToken() as Identifier;
      }
      this.parseProperties();
      if (this.peekToken() instanceof Division) {
        const otherDivision = this.parseToken();
        if (hasDivision) {
          this.logError(new ParserError("Unexpected token '/' for this tag"), otherDivision);
        }
        const token = this.expect(this.parseToken(), GreaterThan, new ParserError(`Expecting a closing '>' token for the tag`));
        return new UnaryTag(tagName, new TokenInfo(division.info.from, token.info.to));
      }
      const token = this.expect(this.parseToken(), GreaterThan, new ParserError(`Expecting a closing '>' token for the tag`));
      if (hasDivision) {
        return new ClosingTag(tagName, new TokenInfo(division.info.from, token.info.to));
      }
      return new OpenTag(tagName, new TokenInfo(division.info.from, token.info.to));
    }
    return this.parseContent();
  }

  private parseProperties() {
    const from = this.position;
    while (this.hasMoreTokens()) {
      const token = this.getNextToken();
      if (token instanceof Division && this.peekToken() instanceof GreaterThan) {
        this.peekBack(token);
        break;
      }
      if (token instanceof GreaterThan) {
        this.peekBack(token);
        break;
      }
    }
    const properties = this.input.substring(from, this.position);
    return new Properties(properties, new TokenInfo(from, this.position));
  }

  private parseContent() {
    const from = this.position;
    while (this.hasMoreTokens()) {
      if (this.peekToken() instanceof LessThan) break;
      this.getNextCharacter();
    }
    const properties = this.input.substring(from, this.position);
    return new PlainText(properties, new TokenInfo(from, this.position));
  }

  private parseAddition() {
    let left = this.parseMultiplication();
    while (this.peekToken() instanceof Addition || this.peekToken() instanceof Substraction) {
      const operator = this.parseToken() as Operator;
      this.expect(left, Expression, new ParserError(`Invalid left hand side expression in ${operator.token} operation`));
      const right = this.expect(this.parseMultiplication(), Expression, new ParserError(`Invalid right hand side expression in ${operator.token} operation`));
      left = new Binary(left, operator, right, new TokenInfo(left.info.from, right.info.to));
    }
    return left;
  }

  private parseMultiplication() {
    let left = this.parsePower();
    while (this.peekToken() instanceof Multiplication || this.peekToken() instanceof Division) {
      const operator = this.parseToken() as Operator;
      this.expect(left, Expression, new ParserError(`Invalid left hand side expression in ${operator.token} operation`));
      const right = this.expect(this.parsePower(), Expression, new ParserError(`Invalid right hand side expression in ${operator.token} operation`));
      left = new Binary(left, operator, right, new TokenInfo(left.info.from, right.info.to));
    }
    return left;
  }

  private parsePower() {
    let left = this.parseUnary();
    if (this.peekToken() instanceof Exponentiation) {
      const operator = this.parseToken() as Operator;
      this.expect(left, Expression, new ParserError(`Invalid left hand side expression in ${operator.token} operation`));
      const right = this.expect(this.parsePower(), Expression, new ParserError(`Invalid right hand side expression in ${operator.token} operation`));
      left = new Binary(left, operator, right, new TokenInfo(left.info.from, right.info.to));
    }
    return left;
  }

  private parseUnary(): Expression {
    if (this.peekToken() instanceof Addition || this.peekToken() instanceof Substraction) {
      const operator = this.parseToken() as Operator;
      const right = this.expect(this.parseUnary(), Expression, new ParserError(`Invalid expression in unary ${operator.token} operation`));
      return new Unary(operator, right, new TokenInfo(operator.info.from, right.info.to));
    }
    return this.parseParanthesis();
  }

  private parseParanthesis() {
    if (this.peekToken() instanceof OpenParenthesis) {
      const left = this.parseToken();
      const expression = this.expect(this.parseAddition(), Expression, new ParserError("No expression has been provided within parenthesis"));
      const right = this.parseToken();
      if (expression instanceof Expression && !(expression instanceof ClosingParenthesis)) {
        this.expect(right, ClosingParenthesis, new ParserError("Expecting a closing parenthesis"));
      }
      return new Parenthesis(left as OpenParenthesis, expression, right as ClosingParenthesis, new TokenInfo(left.info.from, right.info.to));
    }
    return this.parseString();
  }

  private parseString() {
    if (this.peekToken() instanceof Quote) {
      this.keepSpace();
      const begin = this.parseToken() as Quote;
      let raw = "";
      while (this.hasMoreTokens()) {
        const token = this.peekToken();
        if (token instanceof UnknownCharacter) {
          this.logError(new WarningError(`Unknown character '${token.raw}' found while parsing`), token);
        }
        if (token instanceof Quote) break;
        raw += this.getNextCharacter();
      }
      const end = this.expect(this.parseToken(), Quote, new ParserError("Expecing a closing quote for the string"));
      this.ignoreSpace();
      return new String(begin, raw, end, new TokenInfo(begin.info.to, end.info.from));
    }
    return this.parseToken();
  }

  private parseToken() {
    const token = this.getNextToken();
    if (token instanceof UnknownCharacter) {
      this.logError(new WarningError(`Unknown character '${token.raw}' found while parsing`), token);
    }
    return token;
  }
}
