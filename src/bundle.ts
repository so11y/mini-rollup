import { Module } from "./module";
import { resolve, dirname } from "path";
import { Ast } from "ledad/src/share/types";
import { defaultResolver } from "./resolvePath";
import { readFile } from "fs/promises";
import { ExportNamedDeclaration } from "ledad/src/elements/export";

export interface BundleConfig {
  entry: string;
}

export class Bundle {
  entry: string;
  base: string;
  entryModule = null;
  modulePromises: Record<string, Promise<Module>> = {};
  statements: Array<Ast> = [];
  resolvePath = defaultResolver;
  constructor(options: Partial<BundleConfig>) {
    this.entry = resolve(options.entry).replace(/\.js$/, "") + ".js";
    this.base = dirname(this.entry);
    // this.externalModules = [];
    // this.defaultExportName = null;
    // this.internalNamespaceModules = [];
  }
  fetchModule(importee: string, importer: string) {
    return Promise.resolve(this.resolvePath(importee, importer)).then(
      (path) => {
        if (!Reflect.has(this.modulePromises, path)) {
          this.modulePromises[path] = readFile(path, {
            encoding: "utf-8",
          }).then((code) => {
            const module = new Module(path, code, this);
            return module;
          });
        }
        return this.modulePromises[path];
      }
    );
  }

  build() {
    return this.fetchModule(this.entry, null)
      .then((entryModule) => {
        this.entryModule = entryModule;
        return entryModule.expandAllStatements();
      })
      .then((statements) => {
        this.statements = statements;
      });
  }
  generate() {
    const magics = this.statements.map((statement) => {
      if (ExportNamedDeclaration.isExportNamedDeclaration(statement)) {
        statement._value.remove(statement.start, statement.declaration.start);
      }
      return statement._value;
    });
    return {
      code: magics.map((v) => v.toString()).join("\n"),
    };
  }
}
