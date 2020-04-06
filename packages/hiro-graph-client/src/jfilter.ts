export class JFilter {
  private value = '';

  constructor(value?: string) {
    if (value) {
      this.value = value;
    }
  }

  private reduce(text: (string | JFilter)[]) {
    return text.reduce((acc, t) => acc + `(${t.toString()})`, '');
  }

  or(...text: (string | JFilter)[]) {
    const v = this.reduce(text);

    this.value += `|${v}`;

    return this;
  }

  and(...text: (string | JFilter)[]) {
    const v = this.reduce(text);

    this.value += `&${v}`;

    return this;
  }

  toString() {
    return `${this.value}`;
  }
}
