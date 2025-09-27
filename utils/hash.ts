import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';

export async function getTransactionHash(
  title: string,
  amount: string,
  date: Date,
  account: string
) {
  return await digestStringAsync(
    CryptoDigestAlgorithm.MD5,
    `${title}|${amount}|${date}|${account}`
  );
}
