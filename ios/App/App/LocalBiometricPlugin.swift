import Foundation
import Capacitor
import LocalAuthentication
import os.log

private let logger = OSLog(subsystem: "com.miden.wallet", category: "LocalBiometric")

@objc(LocalBiometricPlugin)
public class LocalBiometricPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LocalBiometricPlugin"
    public let jsName = "LocalBiometric"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "verifyIdentity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setCredentials", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCredentials", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteCredentials", returnType: CAPPluginReturnPromise)
    ]

    @objc func isAvailable(_ call: CAPPluginCall) {
        os_log("[LocalBiometric] isAvailable called", log: logger, type: .debug)
        let context = LAContext()
        var error: NSError?
        var result: [String: Any] = [
            "isAvailable": false,
            "biometryType": 0
        ]

        let policy = LAPolicy.deviceOwnerAuthenticationWithBiometrics

        if context.canEvaluatePolicy(policy, error: &error) {
            result["isAvailable"] = true
            switch context.biometryType {
            case .touchID:
                result["biometryType"] = 1
            case .faceID:
                result["biometryType"] = 2
                os_log("[LocalBiometric] FaceID available", log: logger, type: .debug)
            case .opticID:
                result["biometryType"] = 4
            @unknown default:
                result["biometryType"] = 0
            }
        } else if let authError = error {
            result["errorCode"] = convertErrorCode(authError.code)
            result["errorMessage"] = authError.localizedDescription
            os_log("[LocalBiometric] isAvailable error: %{public}@", log: logger, type: .error, authError.localizedDescription)
        }

        os_log("[LocalBiometric] isAvailable result: %{public}@", log: logger, type: .debug, String(describing: result))
        call.resolve(result)
    }

    @objc func verifyIdentity(_ call: CAPPluginCall) {
        os_log("[LocalBiometric] verifyIdentity called", log: logger, type: .debug)
        let context = LAContext()
        let reason = call.getString("reason") ?? "Authenticate to continue"
        let useFallback = call.getBool("useFallback") ?? false

        let policy: LAPolicy = useFallback ? .deviceOwnerAuthentication : .deviceOwnerAuthenticationWithBiometrics

        context.evaluatePolicy(policy, localizedReason: reason) { success, error in
            if success {
                os_log("[LocalBiometric] verifyIdentity SUCCESS", log: logger, type: .debug)
                call.resolve()
            } else {
                let errorCode = (error as NSError?)?.code ?? 0
                os_log("[LocalBiometric] verifyIdentity FAILED: %{public}@", log: logger, type: .error, error?.localizedDescription ?? "unknown")
                call.reject(error?.localizedDescription ?? "Authentication failed", String(self.convertErrorCode(errorCode)))
            }
        }
    }

    @objc func setCredentials(_ call: CAPPluginCall) {
        os_log("[LocalBiometric] setCredentials called", log: logger, type: .debug)
        guard let server = call.getString("server"),
              let username = call.getString("username"),
              let password = call.getString("password") else {
            os_log("[LocalBiometric] setCredentials missing params", log: logger, type: .error)
            call.reject("Missing required parameters")
            return
        }

        // Use GenericPassword instead of InternetPassword for better simulator compatibility
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: server,
            kSecAttrAccount as String: username
        ]

        // Try to delete existing item first
        SecItemDelete(deleteQuery as CFDictionary)

        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: server,
            kSecAttrAccount as String: username,
            kSecValueData as String: password.data(using: .utf8)!,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        let status = SecItemAdd(addQuery as CFDictionary, nil)
        if status == errSecSuccess {
            os_log("[LocalBiometric] setCredentials SUCCESS", log: logger, type: .debug)
            call.resolve()
        } else {
            os_log("[LocalBiometric] setCredentials FAILED: %{public}d", log: logger, type: .error, status)
            call.reject("Failed to store credentials: \(status)")
        }
    }

    @objc func getCredentials(_ call: CAPPluginCall) {
        os_log("[LocalBiometric] getCredentials called", log: logger, type: .debug)
        guard let server = call.getString("server") else {
            call.reject("Missing server parameter")
            return
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: server,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecReturnAttributes as String: true,
            kSecReturnData as String: true
        ]

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecSuccess,
           let item = result as? [String: Any],
           let passwordData = item[kSecValueData as String] as? Data,
           let password = String(data: passwordData, encoding: .utf8),
           let username = item[kSecAttrAccount as String] as? String {
            os_log("[LocalBiometric] getCredentials SUCCESS", log: logger, type: .debug)
            call.resolve([
                "username": username,
                "password": password
            ])
        } else {
            os_log("[LocalBiometric] getCredentials FAILED: %{public}d", log: logger, type: .error, status)
            call.reject("Credentials not found")
        }
    }

    @objc func deleteCredentials(_ call: CAPPluginCall) {
        os_log("[LocalBiometric] deleteCredentials called", log: logger, type: .debug)
        guard let server = call.getString("server") else {
            call.reject("Missing server parameter")
            return
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: server
        ]

        let status = SecItemDelete(query as CFDictionary)
        os_log("[LocalBiometric] deleteCredentials status: %{public}d", log: logger, type: .debug, status)
        call.resolve()
    }

    private func convertErrorCode(_ code: Int) -> Int {
        switch code {
        case LAError.biometryNotAvailable.rawValue:
            return 1
        case LAError.biometryLockout.rawValue:
            return 2
        case LAError.biometryNotEnrolled.rawValue:
            return 3
        case LAError.authenticationFailed.rawValue:
            return 10
        case LAError.userCancel.rawValue:
            return 16
        case LAError.passcodeNotSet.rawValue:
            return 14
        default:
            return 0
        }
    }
}
