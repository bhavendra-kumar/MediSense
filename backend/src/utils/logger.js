/**
 * Simple logger utility for MediSense AI
 */

const levels = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
};

const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

module.exports = {
  info: (message, data) => log(levels.INFO, message, data),
  warn: (message, data) => log(levels.WARN, message, data),
  error: (message, data) => log(levels.ERROR, message, data),
  debug: (message, data) => log(levels.DEBUG, message, data),
};
