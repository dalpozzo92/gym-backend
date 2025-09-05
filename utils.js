import dotenv from 'dotenv';
dotenv.config();

export const debug = (...args) => {
  if (process.env.DEBUG === 'true') {
    const now = new Date();
    const dateTime = now.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(',', '');
    console.log(`[DEBUG ${dateTime}]`, ...args);
  }
};