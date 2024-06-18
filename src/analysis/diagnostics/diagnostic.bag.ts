import { Cell } from "../../cell";
import { BoundKind } from "../binder/kind/bound.kind";
import { SyntaxKind } from "../parser/kind/syntax.kind";
import { Diagnostic } from "./diagnostic";
import { DiagnosticSeverity } from "./diagnostic.severity";

export class DiagnosticBag {
  private diagnostics = new Array<Diagnostic>();

  none() {
    return !(this.diagnostics.length > 0);
  }

  merge(bag: DiagnosticBag) {
    for (const d of bag.diagnostics) this.add(d);
  }

  private add(d: Diagnostic) {
    this.diagnostics.push(d);
  }

  badTokenFound(text: string) {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `Bad character '${text}' found`));
  }

  tokenMissmatch(matched: SyntaxKind, expectedKind: SyntaxKind) {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `Unexpected '${matched}' found, expecting '${expectedKind}'`));
  }

  emptyProgram() {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `Program contains no code`));
  }

  cantDivideByZero() {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `Can't divide by zero`));
  }

  circularDependency(observer: Cell) {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `Circular dependency detected in '${observer.name}'`));
  }

  cantUseAsAReference(unexpected: SyntaxKind) {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `'${unexpected}' is not assignable to a cell reference`));
  }

  undeclaredCell(cellName: string) {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `Cell reference '${cellName}' is undeclared`));
  }

  badFloatingPointNumber() {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `Wrong floating number format`));
  }

  invalidCellState(subject: Cell) {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `Reference '${subject.name}' is in an invalid state`));
  }

  autoDeclaredCell(subject: Cell, cell: Cell) {
    return this.add(new Diagnostic(DiagnosticSeverity.Informative, `Reference '${subject.name}' has been declared automatically after being referenced by '${cell.name}'`));
  }

  wrongCellNameFormat(didYouMean: string) {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `Did you mean '${didYouMean}'?`));
  }

  binderMethod(kind: SyntaxKind) {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `Binder: Method for '${kind}' is not implemented`));
  }

  evaluatorMethod(kind: BoundKind) {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `Evaluator: Method for '${kind}' is not implemented`));
  }

  functionAlreadyDefined(functionName: string) {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `Function '${functionName}' has already been declared`));
  }

  globalFunctionDeclarationsOnly(functionName: string) {
    return this.add(new Diagnostic(DiagnosticSeverity.Error, `Function '${functionName}' can only be defined within the global scope`));
  }
}
