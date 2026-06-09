import { NativeModule, requireNativeModule } from 'expo';

import { type NativeArgon2Args } from './ExpoArgon2.types';

type ExpoArgon2ModuleEvents = Record<string, never>;

declare class ExpoArgon2Module extends NativeModule<ExpoArgon2ModuleEvents> {
  /** Resolves to the raw derived key as a standard base64 string. Runs off the JS thread. */
  hashRaw(args: NativeArgon2Args): Promise<string>;
}

export default requireNativeModule<ExpoArgon2Module>('ExpoArgon2');
