import dotenv from 'dotenv';
dotenv.config();

export const debug = (...args) => {
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG]', ...args);
  }
};
