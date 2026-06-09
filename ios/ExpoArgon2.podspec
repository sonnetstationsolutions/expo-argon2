Pod::Spec.new do |s|
  s.name           = 'ExpoArgon2'
  s.version        = '0.1.0'
  s.summary        = 'Native Argon2id for Expo and React Native.'
  s.description    = 'Off-thread Argon2id/Argon2i/Argon2d key derivation for Expo, returning raw bytes. New Architecture compatible.'
  s.author         = 'Sonnet Station Solutions, LLC'
  s.homepage       = 'https://github.com/SonnetStationSolutions/expo-argon2'
  s.license        = { :type => 'MIT', :file => '../LICENSE' }
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: 'https://github.com/SonnetStationSolutions/expo-argon2.git', tag: "v#{s.version}" }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # Swift wrapper over the reference C Argon2.
  s.dependency 'Argon2Swift', '~> 1.0.4'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
