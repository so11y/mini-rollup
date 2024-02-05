import { MagicString } from "../magic-string-zr";
import { Bundle } from "./bundle";
import { parse, Program } from "ledad/src/parse/parse";
import { tokenizer } from "ledad/src/parse/tokenizer";
import { Ast } from "ledad/src/share/types";
import {
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
} from "ledad/src/elements/ImportDeclaration";
import { ExportNamedDeclaration } from "ledad/src/elements/export";
import { VariableDeclaration } from "ledad/src/elements/VariableDeclaration";
import { analyser } from "./analyser";
import Scope from "./scope";

declare module "ledad/src/share/types" {
  interface Ast {
    _value: MagicString;
    _scope: Scope;
    _defines: Record<string, boolean>;
    _dependsOn: Record<string, boolean>;
    _modifies: Record<string, boolean>;
  }
}

interface ModuleImport {
  source: string;
  name: string;
  localName: string;
  module?: Module;
}
interface ModuleExport {
  node: Ast;
  localName: string;
  expression: Ast;
}

export class Module {
  code: MagicString;
  ast: Program;
  imports: Record<string, ModuleImport> = {};
  exports: Record<string, ModuleExport> = {};
  definedNames: Array<string> = [];
  definitions: Record<string, Ast> = {};
  modifications: Record<string, Array<Ast>> = {};
  constructor(public path: string, code: string, public bundle: Bundle) {
    this.code = new MagicString(code);
    try {
      this.ast = parse(tokenizer(code));
    } catch (err) {
      err.file = path;
      throw err;
    }
    this.analyser();
  }
  analyser() {
    this.ast.body.forEach((node) => {
      if (ImportDeclaration.isImportDeclaration(node)) {
        let source = node.getSource();
        node.specifiers.forEach((specifier) => {
          const isDefault =
            ImportDefaultSpecifier.isImportDefaultSpecifier(specifier);
          const isNamespace =
            ImportNamespaceSpecifier.isImportNamespaceSpecifier(specifier);
          const localName = specifier.local.name;
          const name = isDefault
            ? "default"
            : isNamespace
            ? "*"
            : (specifier as ImportSpecifier).imported.name;

          this.imports[localName] = {
            source,
            name,
            localName,
          };
        });
      } else if (ExportNamedDeclaration.isExportNamedDeclaration(node)) {
        let declaration = node.declaration;
        let name;
        if (VariableDeclaration.isVariableDeclaration(declaration)) {
          // export var foo = 42
          name = (declaration.declarations[0].id as any).name;
        } else {
          // export function foo () {}
          name = declaration.id.name;
        }
        this.exports[name] = {
          node,
          localName: name,
          expression: declaration as any,
        };
      }
    });
    analyser(this.ast as any, this.code);

    this.definedNames = (this.ast as any)._scope.names.slice();

    this.definitions = {};

    this.ast.body.forEach((statement) => {
      Object.keys(statement._defines).forEach((name) => {
        this.definitions[name] = statement;
      });
      Object.keys(statement._modifies).forEach((name) => {
        if (!Reflect.has(this.modifications, name)) {
          this.modifications[name] = [];
        }
        this.modifications[name].push(statement);
      });
    });
  }

  async expandAllStatements() {
    let allStatements = [];
    for (let i = 0; i < this.ast.body.length; i++) {
      const statement = this.ast.body[i];
      if (statement.type === "ImportDeclaration") {
        continue;
      }
      allStatements.push.apply(
        allStatements,
        await this.expandStatement(statement)
      );
    }
    return allStatements;
  }

  async expandStatement(statement: Ast) {
    const result = [];
    const dependencies = Object.keys(statement._dependsOn);
    const defines = Object.keys(statement._defines);
    //主要触发import语句和外部dependsOn检索

    for (let i = 0; i < dependencies.length; i++) {
      result.push.apply(result, await this.define(dependencies[i]));
    }
    //添加当前自身
    result.push(statement);

    //触发使用的变量 和修改的变量
    //比如函数调用的参数
    //赋值操作
    for (let i = 0; i < defines.length; i++) {
      const modifications = this.modifications[defines[i]];
      if (modifications) {
        for (let i = 0; i < modifications.length; i++) {
          result.push.apply(result, await this.expandStatement(statement));
        }
      }
    }
    return result;
  }

  async define(name: string) {
    if (Reflect.has(this.imports, name)) {
      const importDeclaration = this.imports[name];
      return this.bundle
        .fetchModule(importDeclaration.source, this.path)
        .then((module) => {
          importDeclaration.module = module;

          const exportDeclaration = module.exports[importDeclaration.name];

          if (!exportDeclaration) {
            throw new Error(
              `Module ${module.path} does not export ${importDeclaration.name} (imported by ${this.path})`
            );
          }
          return module.define(exportDeclaration.localName);
        });
    }
    const statement = this.definitions[name];
    if (statement) {
      return this.expandStatement(statement);
    }
    return [];
  }
}
