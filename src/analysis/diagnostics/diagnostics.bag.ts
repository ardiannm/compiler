import { BoundCellAssignment, BoundCellReference } from "../binder";
import { BoundKind } from "../binder/kind/bound.kind";
import { SyntaxKind } from "../parser/kind/syntax.kind";
import { Span } from "../text/span";
import { Diagnostic } from "./diagnostic";
import { Severity } from "./severity";

export class DiagnosticsBag {
  private diagnostics = new Array<Diagnostic>();
  private severity = new Set<Severity>();

  private report(message: string, severity: Severity, span: Span) {
    this.severity.add(severity);
    this.diagnostics.push(Diagnostic.createFrom(message, severity, span));
  }

  getDiagnostics(limit: number) {
    return this.diagnostics.slice(0, limit);
  }

  canParse() {
    return !this.severity.has(Severity.CantParse);
  }

  canBind() {
    return this.canParse() && !this.severity.has(Severity.CantBind);
  }

  canEvaluate() {
    return this.canBind() && !this.severity.has(Severity.CantEvaluate);
  }

  badCharacterFound(text: string, span: Span) {
    this.report(`Illegal character '${text}' found.`, Severity.Warning, span);
  }

  unexpectedTokenFound(matched: SyntaxKind, expecting: SyntaxKind, span: Span) {
    this.report(`Unexpected token found: '${matched}' expecting '${expecting}'.`, Severity.CantBind, span);
  }

  cantDivideByZero(span: Span) {
    this.report(`Can't divide by zero.`, Severity.Warning, span);
  }

  circularDependency(assignee: BoundCellAssignment, dependency: BoundCellReference) {
    this.report(`Circular dependency '${dependency.assignment.target}' detected while binding '${assignee.target.name}'.`, Severity.CantEvaluate, dependency.span);
  }

  cantUseAsAReference(unexpected: SyntaxKind, span: Span) {
    this.report(`'${unexpected}' is not assignable.`, Severity.CantEvaluate, span);
  }

  missingTripleQuotes(span: Span) {
    this.report(
      `Missing closing triple quotes ('''). It looks like the multi-line string was not properly closed. Please ensure you close the string after your intended text.`,
      Severity.CantEvaluate,
      span
    );
  }

  undeclaredCell(name: string, span: Span) {
    this.report(`Cell reference '${name}' is undeclared.`, Severity.CantEvaluate, span);
  }

  badFloatingPointNumber(span: Span) {
    this.report(`Wrong floating number format.`, Severity.CantBind, span);
  }

  usginBeforeDeclaration(name: string, span: Span) {
    this.report(`Using '${name}' before its declaration.`, Severity.CantBind, span);
  }

  requireCompactCellReference(correctName: string, span: Span) {
    this.report(`Did you mean \`${correctName}\`?`, Severity.CantEvaluate, span);
  }

  emptyBlock(span: Span) {
    this.report(`Expecting statements in the block.`, Severity.CantBind, span);
  }

  binderMethod(kind: SyntaxKind, span: Span) {
    this.report(`Method for binding '${kind}' is not implemented.`, Severity.CantBind, span);
  }

  evaluatorMethod(kind: BoundKind, span: Span) {
    this.report(`Method for evaluating '${kind}' is not implemented.`, Severity.CantEvaluate, span);
  }
}
