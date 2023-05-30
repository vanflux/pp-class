import { LadConnectOptions } from './lad';

export class LadConfigHelper {
  static fromEnv(): LadConnectOptions {
    const registry = process.env.REGISTRY;
    const groupNumStr = process.env.GROUP;
    const spartaPass = process.env.SPARTA_PASS;
    const userPrefix = process.env.USER_PREFIX;
    const gradPass = process.env.GRAD_PASS;
    if (!registry) throw new Error('REGISTRY must be present on environment variables');
    if (!groupNumStr) throw new Error('GROUP must be present on environment variables');
    if (!spartaPass) throw new Error('SPARTA_PASS must be present on environment variables');
    if (!userPrefix) throw new Error('USER_PREFIX must be present on environment variables');
    if (!gradPass) throw new Error('GRAD_PASS must be present on environment variables');
    if (registry.length !== 8) throw new Error('REGISTRY must have 8 length');
    const groupNum = parseInt(groupNumStr);
    if (isNaN(groupNum)) throw new Error('GROUP is not a valid number');

    return {
      registry,
      groupNum,
      userPrefix,
      spartaPass,
      gradPass,
    };
  }
}
