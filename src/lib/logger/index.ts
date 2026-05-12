import pino from "pino";

const isDev = process.env["NODE_ENV"] === "development";

export const logger = pino({
  level: isDev ? "debug" : "info",
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
});

export type Logger = typeof logger;
