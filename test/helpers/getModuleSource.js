import { pathToFileURL } from "url";

export default (id, stats) => {
  const { modules } = stats.toJson({ source: true });
  const module = modules.find((m) => m.name === id);
  let { source } = module;

  source = source.replace(pathToFileURL(process.cwd()), "file:///<cwd>/");

  return source;
};
