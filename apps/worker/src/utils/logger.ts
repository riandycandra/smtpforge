const formatError = (error: any) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
  return error;
};

const formatMeta = (meta: any[]) => {
  if (meta.length === 0) return {};
  if (meta.length === 1 && typeof meta[0] === 'object' && meta[0] !== null && !Array.isArray(meta[0])) {
    return meta[0];
  }
  return { meta };
};

export const logger = {
  info: (message: string, ...meta: any[]) => {
    console.log(JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...formatMeta(meta) }));
  },
  error: (message: string, error?: any, ...meta: any[]) => {
    const errorObj = error ? { error: formatError(error) } : {};
    console.error(JSON.stringify({ level: 'error', message, ...errorObj, timestamp: new Date().toISOString(), ...formatMeta(meta) }));
  },
  warn: (message: string, ...meta: any[]) => {
    console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...formatMeta(meta) }));
  },
  debug: (message: string, ...meta: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify({ level: 'debug', message, timestamp: new Date().toISOString(), ...formatMeta(meta) }));
    }
  },
};
