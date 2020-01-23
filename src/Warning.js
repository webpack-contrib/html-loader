export default class Warning extends Error {
  constructor(warning) {
    super(warning);
    const { text, line, column } = warning;
    this.name = 'Warning';
    this.message = `${this.name}\n\n`;

    if (typeof line !== 'undefined') {
      this.message += `(${line}:${column}) `;
    }

    this.message += `${text}`;

    this.stack = false;
  }
}
