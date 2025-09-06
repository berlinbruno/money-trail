import { MD5 } from 'crypto-js';

export function getTransactionHash(title: string, amount: string, date: Date, account: string) {
  return MD5(`${title}|${amount}|${date}|${account}`);
}
