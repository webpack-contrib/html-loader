import { compile } from 'es6-templates';

export default (content) => {
  // Double escape quotes so that they are not unescaped completely in the template string

  return compile(
    `\`${content.replace(/\\"/g, '\\\\"').replace(/\\'/g, "\\\\\\'")}\``
  ).code;
};
