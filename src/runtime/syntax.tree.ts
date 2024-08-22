import { SourceText } from "../analysis/text/source.text";
import { Parser } from "../analysis/parser";
import { SyntaxCompilationUnit } from "../analysis/parser/syntax.compilation.unit";
import { DiagnosticsBag } from "../analysis/diagnostics/diagnostics.bag";
import { CompilerOptions } from "../compiler.options";
import { Evaluator } from "./evaluator";
import { BoundCompilationUnit } from "../analysis/binder/bound.compilation.unit";
import { Binder } from "../analysis/binder";
import { BoundNode } from "../analysis/binder/bound.node";

export class SyntaxTree {
  protected root: SyntaxCompilationUnit;
  public readonly diagnostics = new DiagnosticsBag();
  public bound: BoundNode | null = null;

  private constructor(public text: SourceText, public configuration: CompilerOptions) {
    const parser = new Parser(this);
    this.root = parser.parseCompilationUnit();
  }

  public static createFrom(text: string, configuration: CompilerOptions) {
    return new SyntaxTree(SourceText.createFrom(text), configuration);
  }

  bind() {
    if (this.diagnostics.canBind()) {
      const bound = new Binder().bind(this.root);
      this.bound = bound;
      return bound;
    }
    return this;
  }

  evaluate() {
    const tree = this.bind();
    if (this.diagnostics.canEvaluate()) {
      return new Evaluator(this.diagnostics).evaluate(tree as BoundCompilationUnit);
    }
    return this;
  }
}
