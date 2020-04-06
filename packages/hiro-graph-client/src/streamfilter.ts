export class StreamFilter {
  private value = '';

  constructor(value?: string) {
    if (value) {
      this.value = value;
    }
  }

  private reduce(text: (string | StreamFilter)[]) {
    return text.reduce((acc, t) => acc + `(${t.toString()})`, '');
  }

  or(...text: (string | StreamFilter)[]) {
    const v = this.reduce(text);

    this.value += `|${v}`;

    return this;
  }

  and(...text: (string | StreamFilter)[]) {
    const v = this.reduce(text);

    this.value += `&${v}`;

    return this;
  }

  toString() {
    return `${this.value}`;
  }
}
