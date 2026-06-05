const DEBUG = process.env['DEBUG'] === '1';

export const logger = {
  debug: (msg: string): void => {
    if (DEBUG) process.stderr.write(`[debug] ${msg}\n`);
  },
  info: (msg: string): void => {
    process.stderr.write(`[info] ${msg}\n`);
  },
  error: (msg: string): void => {
    process.stderr.write(`[error] ${msg}\n`);
  },
};
