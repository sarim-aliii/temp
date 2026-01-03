const getTimestamp = (): string => {
  return new Date().toISOString();
};

const Logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[${getTimestamp()}] [INFO] ${message}`, ...args);
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`[${getTimestamp()}] [WARN] ${message}`, ...args);
  },

  error: (message: string, error?: any, ...args: any[]) => {
    if (error) {
      console.error(`[${getTimestamp()}] [ERROR] ${message}`, error, ...args);
    } else {
      console.error(`[${getTimestamp()}] [ERROR] ${message}`, ...args);
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    console.debug(`[${getTimestamp()}] [DEBUG] ${message}`, ...args);
  }
};

export default Logger;