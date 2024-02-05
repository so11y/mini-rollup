export default class Scope {
    parent: Scope;
    depth: number;
    names: Array<string>;
    isBlockScope: boolean;
    constructor(options?: any);
    add(name: any, isBlockDeclaration: any): void;
    contains(name: any): boolean;
    findDefiningScope(name: any): any;
}
