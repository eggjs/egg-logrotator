interface LoggerTransport {
  options: {
    file: string;
  };
}

/**
 * Walk all logger files from loggers
 * @param loggers - The loggers to walk
 */
export function walkLoggerFile(loggers: Record<string, Map<string, LoggerTransport>>) {
  const files: string[] = [];
  for (const key in loggers) {
    if (!loggers.hasOwnProperty(key)) {
      continue;
    }
    const registeredLogger = loggers[key];
    for (const transport of registeredLogger.values()) {
      const file = transport.options.file;
      if (file) {
        files.push(file);
      }
    }
  }
  return files;
}
