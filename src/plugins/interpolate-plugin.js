import { compile } from 'es6-templates';

export default () =>
  function process(html, result) {
    try {
      // eslint-disable-next-line no-param-reassign
      html = compile(
        // Double escape quotes so that they are not unescaped completely in the template string
        `\`${html.replace(/\\"/g, '\\\\"').replace(/\\'/g, "\\\\\\'")}\``
      ).code;
    } catch (error) {
      // eslint-disable-next-line no-param-reassign
      html = JSON.stringify(html);

      result.errors.push(error);
    }

    return html;
  };
