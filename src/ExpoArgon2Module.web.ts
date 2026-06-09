import { registerWebModule, NativeModule } from 'expo';

import { Argon2Error, type NativeArgon2Args } from './ExpoArgon2.types';

type ExpoArgon2ModuleEvents = Record<string, never>;

// Web is intentionally out of scope: the browser already has a good WASM path.
// Use hash-wasm (https://github.com/Daninet/hash-wasm) directly in web code.
class ExpoArgon2Module extends NativeModule<ExpoArgon2ModuleEvents> {
  async hashRaw(_args: NativeArgon2Args): Promise<string> {
    throw new Argon2Error(
      'ERR_ARGON2_UNSUPPORTED_PLATFORM',
      'expo-argon2 has no web implementation. Derive the key with hash-wasm in the browser instead.'
    );
  }
}

export default registerWebModule(ExpoArgon2Module, 'ExpoArgon2Module');
