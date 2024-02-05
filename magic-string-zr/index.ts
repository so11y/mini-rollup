class Chunk {
  start: number;
  end: number;
  original: string = "";
  content: string = "";
  intro: string = "";
  outro: string = "";
  next?: Chunk;
  previous?: Chunk;
  edited: boolean = false;
  constructor(start: number, end: number, content: string) {
    this.original = content;
    this.start = start;
    this.content = content;
    this.end = end;
  }

  contain(index: number) {
    return index >= this.start && index <= this.end;
  }
  split(index: number) {
    const sliceIndex = index - this.start;
    const originalBefore = this.original.slice(0, sliceIndex);
    const originalAfter = this.original.slice(sliceIndex);
    this.original = originalBefore;
    const newChunk = new Chunk(index, this.end, originalAfter);
    this.end = index;
    this.content = originalBefore;
    newChunk.next = this.next;
    newChunk.previous = this;
    this.next = newChunk;
    return newChunk;
  }

  toString() {
    return this.intro + this.content + this.outro;
  }
  edit(content: string) {
    this.content = content;
    this.edited = true;
  }
  remove() {
    this.content = "";
    this.intro = "";
    this.outro = "";
  }
  clone() {
    const chunk = new Chunk(this.start, this.end, this.original);
    chunk.intro = this.intro;
    chunk.outro = this.outro;
    chunk.content = this.content;
    chunk.edited = this.edited;
    return chunk;
  }
}

const splitChunk = (m: MagicString, index: number) => {
  if (m.byteStart[index] || m.byteEnd[index]) {
    return;
  }
  let pervChunk = m.firstChunk;
  while (pervChunk) {
    if (pervChunk.contain(index)) {
      chunkLink(m, pervChunk, index);
      return;
    }
    pervChunk = pervChunk.next!;
  }
};

const chunkLink = (m: MagicString, chunk: Chunk, index: number) => {
  if (chunk.edited && chunk.content.length) {
    throw new Error(`Cannot split a chunk that has already been edited`);
  }
  const newChunk = chunk.split(index);
  m.byteEnd[index] = chunk;
  m.byteStart[index] = newChunk;
  m.byteEnd[newChunk.end] = newChunk;
  m.prevChunk = chunk;
};

export class MagicString {
  byteStart: Record<string, Chunk> = {};
  byteEnd: Record<string, Chunk> = {};
  prevChunk: Chunk;
  firstChunk: Chunk;
  intro: string = "";
  outro: string = "";
  original: string = "";
  constructor(original: string) {
    const chunk = new Chunk(0, original.length - 1, original);
    this.byteStart[0] = chunk;
    this.byteEnd[original.length] = chunk;
    this.prevChunk = chunk;
    this.firstChunk = chunk;
    this.original = original;
  }

  overwrite(start: number, end: number, original: string) {
    splitChunk(this, start);
    splitChunk(this, end);
    const first = this.byteStart[start];
    if (first) {
      first.edit(original);
    }
  }

  toString() {
    let str = this.intro;
    let chunk = this.firstChunk;
    while (chunk) {
      str += chunk.toString();
      chunk = chunk.next!;
    }
    return str + this.outro;
  }

  prepend(content: string) {
    this.intro += content;
  }
  append(content: string) {
    this.outro += content;
  }
  appendLeft(index: number, content: string) {
    if (!this.byteStart[index]) {
      splitChunk(this, index);
    }
    if (!this.byteEnd[index]) {
      splitChunk(this, index);
    }
    const chunk = this.byteStart[index] || this.byteEnd[index];
    chunk.intro += content;
  }
  remove(start: number, end: number) {
    if (start === end) return;
    if (!this.byteStart[start]) splitChunk(this, start);
    if (!this.byteEnd[end]) splitChunk(this, end);

    [this.byteStart[start], this.byteEnd[end]]
      .filter(Boolean)
      .forEach((chunk) => chunk.remove());
  }
  snip(start: number, end: number) {
    const clone = this.clone();
    clone.remove(0, start);
    clone.remove(end, clone.original.length);

    return clone;
  }
  clone() {
    const cloned = new MagicString(this.original);

    let originalChunk = this.firstChunk;
    let clonedChunk = (cloned.firstChunk = originalChunk.clone());

    while (originalChunk) {
      cloned.byteStart[clonedChunk.start] = clonedChunk;
      cloned.byteEnd[clonedChunk.end] = clonedChunk;

      const nextOriginalChunk = originalChunk.next;
      const nextClonedChunk = nextOriginalChunk && nextOriginalChunk.clone();

      if (nextClonedChunk) {
        clonedChunk.next = nextClonedChunk;
        nextClonedChunk.previous = clonedChunk;

        clonedChunk = nextClonedChunk;
      }

      originalChunk = nextOriginalChunk!;
    }

    cloned.intro = this.intro;
    cloned.outro = this.outro;

    return cloned;
  }
}

let ms = new MagicString(`let a = 10;let b = 20;`);
//chunk()
//start 0 end 3 source 'let' const
//start 9   end 11  source 'a = 10;'
//start 11   end 14  source 'let' const
//start 14   end 20  source 'b = 20;'







ms.overwrite(0, 3, "const");
console.log(ms.toString());
ms.overwrite(11, 14, "const");
console.log(ms.toString());
