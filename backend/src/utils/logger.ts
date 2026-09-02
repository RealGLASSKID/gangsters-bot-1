const ts = () => new Date().toLocaleTimeString();

export const logger = {
  level: "silent" as string,
  info: (o: unknown, m?: string) =>
    typeof o === "string" ? console.log(`[${ts()}] ${o}`) : console.log(`[${ts()}] ${m ?? ""}`, o),
  warn: (o: unknown, m?: string) =>
    typeof o === "string" ? console.warn(`[${ts()}] ${o}`) : console.warn(`[${ts()}] ${m ?? ""}`, o),
  error: (o: unknown, m?: string) =>
    typeof o === "string" ? console.error(`[${ts()}] ${o}`) : console.error(`[${ts()}] ${m ?? ""}`, o),
  trace: () => {},
  debug: () => {},
  fatal: (o: unknown, m?: string) => logger.error(o, m),
  child: () => logger,
};
