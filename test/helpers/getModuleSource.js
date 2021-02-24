export default (id, stats) => {
  const { modules } = stats.toJson({ source: true });
  const module = modules.find((m) => m.name === id);
  let { source } = module;

  source = source.replace(new RegExp(`${process.cwd()}/`, 'g'), '/<cwd>/');

  return source;
};
