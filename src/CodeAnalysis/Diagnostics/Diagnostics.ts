import { SyntaxKind } from "../SyntaxKind";
import { SyntaxToken } from "../SyntaxToken";
import { ErrorKind } from "./ErrorKind";
import { Diagnostic } from "./Diagnostic";

export class Diagnostics {
  private Bag = new Array<Diagnostic>();

  Any() {
    return this.Bag.length > 0;
  }

  Show() {
    console.log();
    for (const d of this.Bag) console.log(d.Message);
    console.log();
  }

  Clear() {
    this.Bag = new Array<Diagnostic>();
  }

  Log(tree: Object = "") {
    console.log("\n" + `${typeof tree === "string" ? tree : JSON.stringify(tree, undefined, 2)}` + "\n");
  }

  private ReportError(Err: Diagnostic) {
    this.Bag.push(Err);
    return Err;
  }

  BadTokenFound(Token: SyntaxToken) {
    return this.ReportError(new Diagnostic(ErrorKind.Parser, `Bad Character '${Token.Text}' Found.`));
  }

  TokenNotAMatch(Expected: SyntaxKind, Matched: SyntaxKind) {
    return this.ReportError(new Diagnostic(ErrorKind.Parser, `Expected <${Expected}>; Found <${Matched}>.`));
  }

  UndeclaredVariable(Reference: string) {
    throw this.ReportError(new Diagnostic(ErrorKind.Environment, `Reference '${Reference}' Has Not Been Declared.`));
  }

  MethodNotImplemented(Kind: SyntaxKind) {
    throw this.ReportError(new Diagnostic(ErrorKind.Evaluator, `Method For Evaluating <${Kind}> Is Missing.`));
  }

  NotAnOperator(Kind: SyntaxKind) {
    return this.ReportError(new Diagnostic(ErrorKind.Evaluator, `Node <${Kind}> Is Not An Operator Token.`));
  }

  CircularDependency(Reference: string) {
    throw this.ReportError(new Diagnostic(ErrorKind.Environment, `Circular Dependency For '${Reference}' Detected.`));
  }

  TrailingGarbageFound() {
    return this.ReportError(new Diagnostic(ErrorKind.Parser, `Trailing Garbage Found For The Syntax Tree.`));
  }
}
