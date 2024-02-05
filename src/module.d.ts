import { MagicString } from "../magic-string-zr";
import { Bundle } from "./bundle";
import { Program } from "ledad/src/parse/parse";
import { Ast } from "ledad/src/share/types";
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
export declare class Module {
    path: string;
    bundle: Bundle;
    code: MagicString;
    ast: Program;
    imports: Record<string, ModuleImport>;
    exports: Record<string, ModuleExport>;
    definedNames: Array<string>;
    definitions: Record<string, Ast>;
    modifications: Record<string, Array<Ast>>;
    constructor(path: string, code: string, bundle: Bundle);
    analyser(): void;
    expandAllStatements(): Promise<any[]>;
    expandStatement(statement: Ast): Promise<any[]>;
    define(name: string): any;
}
export {};
