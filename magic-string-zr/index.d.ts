declare class Chunk {
    start: number;
    end: number;
    original: string;
    content: string;
    intro: string;
    outro: string;
    next?: Chunk;
    previous?: Chunk;
    edited: boolean;
    constructor(start: number, end: number, content: string);
    contain(index: number): boolean;
    split(index: number): Chunk;
    toString(): string;
    edit(content: string): void;
    remove(): void;
    clone(): Chunk;
}
export declare class MagicString {
    byteStart: Record<string, Chunk>;
    byteEnd: Record<string, Chunk>;
    prevChunk: Chunk;
    firstChunk: Chunk;
    intro: string;
    outro: string;
    original: string;
    constructor(original: string);
    overwrite(start: number, end: number, original: string): void;
    toString(): string;
    prepend(content: string): void;
    append(content: string): void;
    appendLeft(index: number, content: string): void;
    remove(start: number, end: number): void;
    snip(start: number, end: number): MagicString;
    clone(): MagicString;
}
export {};
