import CloseParenthesis from "./close.parenthesis.ts";
import ExclamationMark from "./exclamation.mark.ts";
import Number from "./number.ts";
import Identifier from "./identifier.ts";
import OpenParenthesis from "./open.parenthesis.ts";
import QuestionMark from "./question.mark.ts";
import Division from "./division.ts";
import Multiplication from "./multiplication.ts";
import Space from "./space.ts";
import Token from "./token.ts";
import Quote from "./quote.ts";
import LogError from "./log.error.ts";
import LessThan from "./less.than.ts";
import GreaterThan from "./graeter.than.ts";
import UnknownCharacter from "./unknown.character.ts";
import Exponentiation from "./exponentiation.ts";
import Addition from "./addition.ts";
import Substraction from "./substraction.ts";
import EOF from "./eof.ts";
import WarningError from "./warning.error.ts";
import ParserError from "./parser.error.ts";

export default class Lexer {
  public logger = { errors: new Array<LogError>(), warnings: new Array<WarningError>() };
  public position = 0;
  private space = false;

  constructor(public input: string) {}

  public hasMoreTokens(): boolean {
    return !(this.getNextToken() instanceof EOF);
  }

  private character() {
    return this.input.charAt(this.position);
  }

  public getNextCharacter() {
    const character = this.character();
    this.position++;
    return character;
  }

  public keepSpace() {
    this.space = true;
  }

  public ignoreSpace() {
    this.space = false;
  }

  private getIdentifier() {
    let raw = "";
    while (/[a-zA-Z]/.test(this.character())) raw += this.getNextCharacter();
    return new Identifier(raw);
  }

  private getNumber() {
    let raw = "";
    while (/[0-9]/.test(this.character())) raw += this.getNextCharacter();
    return new Number(raw);
  }

  public peekToken() {
    const start = this.position;
    const token = this.getNextToken();
    this.position = start;
    return token;
  }

  public logError(error: LogError) {
    switch (true) {
      case error instanceof WarningError: {
        this.logger.warnings.push(error);
        break;
      }
      case error instanceof ParserError: {
        this.logger.errors.push(error);
        break;
      }
    }
    return error;
  }

  public getNextToken(): Token {
    const char = this.character();

    if (/[a-zA-Z]/.test(char)) {
      return this.getIdentifier();
    }

    if (/[0-9]/.test(char)) {
      return this.getNumber();
    }

    if (/\s/.test(char)) {
      let source = "";
      while (/\s/.test(this.character())) source += this.getNextCharacter();
      if (this.space) return new Space(source);
      return this.getNextToken();
    }

    const next = this.getNextCharacter();

    if (char == "(") return new OpenParenthesis(next);
    if (char == ")") return new CloseParenthesis(next);
    if (char == "!") return new ExclamationMark(next);
    if (char == "?") return new QuestionMark(next);
    if (char == '"') return new Quote(next);
    if (char == "<") return new LessThan(next);
    if (char == ">") return new GreaterThan(next);

    if (char == "+") return new Addition(next);
    if (char == "-") return new Substraction(next);
    if (char == "*") return new Multiplication(next);
    if (char == "/") return new Division(next);
    if (char == "^") return new Exponentiation(next);

    if (next) return new UnknownCharacter(next);

    return new EOF();
  }
}
