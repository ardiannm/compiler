import { DiagnosticKind } from "./DiagnosticKind";
import { Diagnostic } from "./Diagnostic";
import { SyntaxKind } from "../Parser/SyntaxKind";
import { BoundKind } from "../Binder/BoundKind";
import { DiagnosticCode } from "./DiagnosticCode";
import { BoundUnaryOperatorKind } from "../Binder/BoundUnaryOperatorKind";

export class DiagnosticBag {
  private Diagnostics = new Array<Diagnostic>();

  constructor(public Kind: DiagnosticKind) {}

  private ReportError(Diagnostic: Diagnostic) {
    this.Diagnostics.push(Diagnostic);
    return Diagnostic;
  }

  Any() {
    return this.Diagnostics.length > 0;
  }

  Clear() {
    this.Diagnostics = new Array<Diagnostic>();
  }

  BadTokenFound(Text: string) {
    const Message = `Bad character '${Text}' found.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.BadTokenFound, Message));
  }

  TokenNotAMatch(Matched: SyntaxKind) {
    const Message = `Unexpected token found <${Matched}>.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.TokenNotAMatch, Message));
  }

  ProgramIsEmpty() {
    const Message = `Source code is empty.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.ProgramIsEmpty, Message));
  }

  MissingMethod(Kind: SyntaxKind | BoundKind) {
    const Message = `Method for <${Kind}> is missing.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.MissingMethod, Message));
  }

  MissingSwitchMethod(Kind: SyntaxKind) {
    const Message = `Method for switching operators within <${Kind}> is missing.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.MissingSwitchMethod, Message));
  }

  CantDivideByZero() {
    const Message = `Can't divide by zero.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.CantDivideByZero, Message));
  }

  MissingOperatorKind(Kind: SyntaxKind) {
    const Message = `Unexpected operator kind <${Kind}>.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.MissingOperatorKind, Message));
  }

  MissingUnaryOperatorMethod(Operator: BoundUnaryOperatorKind, Kind: SyntaxKind) {
    const Message = `Missing operator kind <${Operator}> for <${Kind}>.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.MissingUnaryOperatorMethod, Message));
  }

  CircularDependency(Name: string) {
    const Message = `Circular dependency found in '${Name}'.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.CircularDependency, Message));
  }

  CantUseAsAReference(Unexpected: string) {
    const Message = `<${Unexpected}> can't be used as a reference.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.CantUseAsAReference, Message));
  }

  NameNotFound(Name: string) {
    const Message = `Can't find name '${Name}'.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.NameNotFound, Message));
  }

  UsedBeforeItsDeclaration(Name: string) {
    const Message = `Using '${Name}' before its declaration.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.UsedBeforeItsDeclaration, Message));
  }

  WrongFloatingNumberFormat() {
    const Message = `Wrong floating number format.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.WrongFloatingNumberFormat, Message));
  }

  NotARangeMember(Kind: SyntaxKind) {
    const Message = `<${Kind}> is not a range member and it can't be bound.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.NotARangeMember, Message));
  }

  CantWriteExpression(Kind: SyntaxKind) {
    const Message = `<${Kind}> can't be written directly outside in the global scope.`;
    return this.ReportError(new Diagnostic(this.Kind, DiagnosticCode.CantWriteExpression, Message));
  }
}
