package expo.modules.argon2

import android.util.Base64
import com.lambdapioneer.argon2kt.Argon2Kt
import com.lambdapioneer.argon2kt.Argon2Mode
import com.lambdapioneer.argon2kt.Argon2Version
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class Argon2Args : Record {
  @Field var passwordBase64: String = ""
  @Field var saltBase64: String = ""
  @Field var memory: Int = 0
  @Field var iterations: Int = 0
  @Field var parallelism: Int = 0
  @Field var hashLength: Int = 0
  @Field var type: Int = 2
  @Field var version: Int = 0x13
}

private class InvalidParamsException(message: String) :
  CodedException("ERR_ARGON2_INVALID_PARAMS", message, null)

private class UnsupportedTypeException(message: String) :
  CodedException("ERR_ARGON2_UNSUPPORTED_TYPE", message, null)

private class UnsupportedVersionException(message: String) :
  CodedException("ERR_ARGON2_UNSUPPORTED_VERSION", message, null)

private class HashFailedException(message: String, cause: Throwable?) :
  CodedException("ERR_ARGON2_HASH_FAILED", message, cause)

class ExpoArgon2Module : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoArgon2")

    // AsyncFunction dispatches off the JS thread on a module coroutine, so the
    // memory-hard hash never blocks the UI or the JS interpreter.
    AsyncFunction("hashRaw") { args: Argon2Args ->
      hashRaw(args)
    }
  }

  private fun hashRaw(args: Argon2Args): String {
    val mode = when (args.type) {
      0 -> Argon2Mode.ARGON2_D
      1 -> Argon2Mode.ARGON2_I
      2 -> Argon2Mode.ARGON2_ID
      else -> throw UnsupportedTypeException("unsupported Argon2 type: ${args.type}")
    }

    val version = when (args.version) {
      0x10 -> Argon2Version.V10
      0x13 -> Argon2Version.V13
      else -> throw UnsupportedVersionException(
        "unsupported Argon2 version: ${args.version} (expected 0x10 or 0x13)",
      )
    }

    val password = decodeBase64(args.passwordBase64, "password")
    val salt = decodeBase64(args.saltBase64, "salt")

    if (salt.size < 8) throw InvalidParamsException("salt must be at least 8 bytes")
    if (args.hashLength < 4) throw InvalidParamsException("hashLength must be >= 4")
    if (args.memory <= 0) throw InvalidParamsException("memory must be > 0")
    if (args.iterations <= 0) throw InvalidParamsException("iterations must be > 0")
    if (args.parallelism <= 0) throw InvalidParamsException("parallelism must be > 0")

    try {
      val result = Argon2Kt().hash(
        mode = mode,
        password = password,
        salt = salt,
        tCostInIterations = args.iterations,
        mCostInKibibyte = args.memory,
        parallelism = args.parallelism,
        hashLengthInBytes = args.hashLength,
        version = version,
      )
      val raw = result.rawHashAsByteArray()
      val encoded = Base64.encodeToString(raw, Base64.NO_WRAP)
      raw.fill(0)
      return encoded
    } catch (e: CodedException) {
      throw e
    } catch (e: Throwable) {
      throw HashFailedException("Argon2 hashing failed: ${e.message}", e)
    } finally {
      password.fill(0)
      salt.fill(0)
    }
  }

  private fun decodeBase64(value: String, field: String): ByteArray {
    return try {
      Base64.decode(value, Base64.NO_WRAP)
    } catch (e: IllegalArgumentException) {
      throw InvalidParamsException("$field is not valid base64")
    }
  }
}
