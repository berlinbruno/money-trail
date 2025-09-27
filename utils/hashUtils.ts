import { getTransactionHash as getHash } from './cryptoUtils';

export async function getTransactionHash(
  title: string,
  amount: string,
  date: Date,
  account: string
) {
  return await getHash(title, amount, date, account);
}
