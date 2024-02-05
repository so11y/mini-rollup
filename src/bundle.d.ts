import { Module } from "./module";
import { Ast } from "ledad/src/share/types";
import { defaultResolver } from "./resolvePath";
export interface BundleConfig {
    entry: string;
}
export declare class Bundle {
    entry: string;
    base: string;
    entryModule: any;
    modulePromises: Record<string, Promise<Module>>;
    statements: Array<Ast>;
    resolvePath: typeof defaultResolver;
    constructor(options: Partial<BundleConfig>);
    fetchModule(importee: string, importer: string): Promise<Module>;
    build(): Promise<void>;
    generate(): {
        code: string;
    };
}
