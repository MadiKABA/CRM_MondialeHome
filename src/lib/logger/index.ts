import pino from "pino";

const isDev = process.env["NODE_ENV"] === "development";

export const logger = pino({
  level: isDev ? "debug" : "info",
  serializers: { err: pino.stdSerializers.err, error: pino.stdSerializers.err },
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
