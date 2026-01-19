import UIKit
import Capacitor
import WebKit

class AppViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(LocalBiometricPlugin())
        bridge?.registerPluginInstance(BarcodeScannerPlugin())
    }

    override open func viewDidLoad() {
        super.viewDidLoad()

        // Enable WebView inspection for iOS 16.4+ (required for Appium WebView context)
        #if DEBUG
        if #available(iOS 16.4, *) {
            webView?.isInspectable = true
        }
        #endif
    }
}
