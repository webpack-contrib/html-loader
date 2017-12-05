class LoaderError extends Error {
  constructor(err) {
    super(err);

    this.name = 'HTML Loader';
    this.message = `\n\n${this.name}\n\n`;

    if (err.name === 'AttributesError') {
      this.message += `[option.attrs] ${err.message}\n`;
    } else {
      this.message += `${err.message}\n`;
    }

    this.stack = false;
  }
}

export default LoaderError;
