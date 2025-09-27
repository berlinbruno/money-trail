/**
 * Crypto utilities with fallback support
 * Handles cases where expo-crypto native module might not be available
 */

let cryptoModule: any = null;
let CryptoDigestAlgorithm: any = null;
let digestStringAsync: any = null;

// Lazy load crypto module to prevent import errors
const initCrypto = async () => {
  if (cryptoModule === null) {
    try {
      cryptoModule = await import('expo-crypto');
      CryptoDigestAlgorithm = cryptoModule.CryptoDigestAlgorithm;
      digestStringAsync = cryptoModule.digestStringAsync;
    } catch (error) {
      console.warn('expo-crypto not available, using fallback hash function:', error);

      // Simple fallback hash function (not secure, but functional for deduplication)
      CryptoDigestAlgorithm = { MD5: 'MD5', SHA256: 'SHA256' };
      digestStringAsync = async (algorithm: string, data: string) => {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
          const char = data.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
      };
      // Mark that we're using fallback
      cryptoModule = false;
    }
  }
};

/**
 * Get hash for transaction data with automatic crypto initialization
 */
export async function getTransactionHash(
  title: string,
  amount: string,
  date: Date,
  account: string
): Promise<string> {
  await initCrypto();

  const data = `${title}|${amount}|${date}|${account}`;
  return await digestStringAsync(CryptoDigestAlgorithm.MD5, data);
}

/**
 * Get MD5 hash of SMS content for deduplication
 */
export async function getSmsHash(smsBody: string, smsDate: string): Promise<string> {
  await initCrypto();

  const data = `${smsBody}|${smsDate}`;
  return await digestStringAsync(CryptoDigestAlgorithm.MD5, data);
}

/**
 * Check if native crypto module is available
 */
export const isCryptoAvailable = async (): Promise<boolean> => {
  await initCrypto();
  return cryptoModule !== false && cryptoModule !== null;
};
