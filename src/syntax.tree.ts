import { Binder } from "./analysis/binder/binder";
import { BoundCompilationUnit } from "./analysis/binder/bound.compilation.unit";
import { Parser } from "./analysis/parsing/parser";
import { SyntaxCompilationUnit } from "./analysis/parsing/syntax.compilation.unit";
import { SourceText } from "./lexing/source.text";

export class CompilerOptions {
  constructor(public explicitDeclarations: boolean) {}
}

export class SyntaxTree {
  root: SyntaxCompilationUnit;
  bound: BoundCompilationUnit;

  private constructor(public source: SourceText, public configuration: CompilerOptions) {
    this.root = Parser.parseCompilationUnit(source);
    this.bound = Binder.bindCompilationUnit(this.root, this.source.diagnostics, configuration);
  }

  static createFrom(text: string | SourceText = "", configuration: CompilerOptions = new CompilerOptions(true)) {
    const sourceText = text instanceof SourceText ? text : SourceText.createFrom(text);
    return new SyntaxTree(sourceText, configuration);
  }
}
