import Argon2Swift
import ExpoModulesCore
import Foundation

struct Argon2Args: Record {
  @Field var passwordBase64: String = ""
  @Field var saltBase64: String = ""
  @Field var memory: Int = 0
  @Field var iterations: Int = 0
  @Field var parallelism: Int = 0
  @Field var hashLength: Int = 0
  @Field var type: Int = 2
  @Field var version: Int = 0x13
}

private final class InvalidParamsException: GenericException<String> {
  override var code: String { "ERR_ARGON2_INVALID_PARAMS" }
  override var reason: String { param }
}

private final class UnsupportedTypeException: GenericException<Int> {
  override var code: String { "ERR_ARGON2_UNSUPPORTED_TYPE" }
  override var reason: String { "unsupported Argon2 type: \(param)" }
}

private final class UnsupportedVersionException: GenericException<Int> {
  override var code: String { "ERR_ARGON2_UNSUPPORTED_VERSION" }
  override var reason: String { "unsupported Argon2 version: \(param) (expected 0x10 or 0x13)" }
}

private final class HashFailedException: GenericException<String> {
  override var code: String { "ERR_ARGON2_HASH_FAILED" }
  override var reason: String { "Argon2 hashing failed: \(param)" }
}

public class ExpoArgon2Module: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoArgon2")

    // AsyncFunction runs on a module queue off the JS thread, so the
    // memory-hard hash never blocks the UI or the JS interpreter.
    AsyncFunction("hashRaw") { (args: Argon2Args) -> String in
      try ExpoArgon2Module.hashRaw(args)
    }
  }

  private static func hashRaw(_ args: Argon2Args) throws -> String {
    let type: Argon2Type
    switch args.type {
    case 0: type = .d
    case 1: type = .i
    case 2: type = .id
    default: throw UnsupportedTypeException(args.type)
    }

    let version: Argon2Version
    switch args.version {
    case 0x10: version = .V10
    case 0x13: version = .V13
    default: throw UnsupportedVersionException(args.version)
    }

    guard let passwordData = Data(base64Encoded: args.passwordBase64) else {
      throw InvalidParamsException("password is not valid base64")
    }
    guard let saltData = Data(base64Encoded: args.saltBase64) else {
      throw InvalidParamsException("salt is not valid base64")
    }

    if saltData.count < 8 { throw InvalidParamsException("salt must be at least 8 bytes") }
    if args.hashLength < 4 { throw InvalidParamsException("hashLength must be >= 4") }
    if args.memory <= 0 { throw InvalidParamsException("memory must be > 0") }
    if args.iterations <= 0 { throw InvalidParamsException("iterations must be > 0") }
    if args.parallelism <= 0 { throw InvalidParamsException("parallelism must be > 0") }

    do {
      let result = try Argon2Swift.hashPasswordBytes(
        password: passwordData,
        salt: Salt(bytes: saltData),
        iterations: args.iterations,
        memory: args.memory,
        parallelism: args.parallelism,
        length: args.hashLength,
        type: type,
        version: version
      )
      return result.hashData().base64EncodedString()
    } catch {
      throw HashFailedException(error.localizedDescription)
    }
  }
}
