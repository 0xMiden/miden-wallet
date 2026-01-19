import Foundation
import Capacitor
import AVFoundation
import UIKit
import os.log

private let logger = OSLog(subsystem: "com.miden.wallet", category: "BarcodeScanner")

@objc(BarcodeScannerPlugin)
public class BarcodeScannerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BarcodeScannerPlugin"
    public let jsName = "BarcodeScanner"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "scan", returnType: CAPPluginReturnPromise)
    ]

    private var scannerViewController: BarcodeScannerViewController?
    private var currentCall: CAPPluginCall?

    @objc func scan(_ call: CAPPluginCall) {
        os_log("[BarcodeScanner] scan called", log: logger, type: .debug)

        DispatchQueue.main.async {
            self.currentCall = call

            // Check camera permission
            switch AVCaptureDevice.authorizationStatus(for: .video) {
            case .authorized:
                self.presentScanner()
            case .notDetermined:
                AVCaptureDevice.requestAccess(for: .video) { granted in
                    DispatchQueue.main.async {
                        if granted {
                            self.presentScanner()
                        } else {
                            call.reject("Camera permission denied")
                        }
                    }
                }
            case .denied, .restricted:
                call.reject("Camera permission denied")
            @unknown default:
                call.reject("Unknown camera permission status")
            }
        }
    }

    private func presentScanner() {
        guard let viewController = self.bridge?.viewController else {
            currentCall?.reject("Unable to get view controller")
            return
        }

        let scanner = BarcodeScannerViewController()
        scanner.delegate = self
        scanner.modalPresentationStyle = .fullScreen
        viewController.present(scanner, animated: true)
        self.scannerViewController = scanner
    }

    fileprivate func dismissScanner(with barcode: String?) {
        DispatchQueue.main.async {
            self.scannerViewController?.dismiss(animated: true) {
                if let barcode = barcode {
                    os_log("[BarcodeScanner] scan success: %{public}@", log: logger, type: .debug, barcode)
                    self.currentCall?.resolve(["barcode": barcode])
                } else {
                    os_log("[BarcodeScanner] scan cancelled", log: logger, type: .debug)
                    self.currentCall?.reject("Scan cancelled")
                }
                self.scannerViewController = nil
                self.currentCall = nil
            }
        }
    }
}

// MARK: - Scanner View Controller

class BarcodeScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    weak var delegate: BarcodeScannerPlugin?

    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var hasScanned = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        setupCamera()
        setupUI()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        hasScanned = false

        DispatchQueue.global(qos: .userInitiated).async {
            if self.captureSession?.isRunning == false {
                self.captureSession?.startRunning()
            }
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)

        DispatchQueue.global(qos: .userInitiated).async {
            if self.captureSession?.isRunning == true {
                self.captureSession?.stopRunning()
            }
        }
    }

    private func setupCamera() {
        let captureSession = AVCaptureSession()
        self.captureSession = captureSession

        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else {
            os_log("[BarcodeScanner] No video capture device", log: logger, type: .error)
            return
        }

        do {
            let videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)
            if captureSession.canAddInput(videoInput) {
                captureSession.addInput(videoInput)
            }
        } catch {
            os_log("[BarcodeScanner] Error creating video input: %{public}@", log: logger, type: .error, error.localizedDescription)
            return
        }

        let metadataOutput = AVCaptureMetadataOutput()
        if captureSession.canAddOutput(metadataOutput) {
            captureSession.addOutput(metadataOutput)
            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = [.qr]
        }

        let previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer.frame = view.layer.bounds
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)
        self.previewLayer = previewLayer
    }

    private func setupUI() {
        // Cancel button
        let cancelButton = UIButton(type: .system)
        cancelButton.setTitle("Cancel", for: .normal)
        cancelButton.setTitleColor(.white, for: .normal)
        cancelButton.titleLabel?.font = UIFont.systemFont(ofSize: 17, weight: .medium)
        cancelButton.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        cancelButton.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(cancelButton)

        // Scan frame overlay
        let scanFrame = UIView()
        scanFrame.layer.borderColor = UIColor.white.cgColor
        scanFrame.layer.borderWidth = 2
        scanFrame.layer.cornerRadius = 12
        scanFrame.backgroundColor = .clear
        scanFrame.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(scanFrame)

        // Instructions label
        let instructionLabel = UILabel()
        instructionLabel.text = "Align QR code within frame"
        instructionLabel.textColor = .white
        instructionLabel.font = UIFont.systemFont(ofSize: 15)
        instructionLabel.textAlignment = .center
        instructionLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(instructionLabel)

        NSLayoutConstraint.activate([
            cancelButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            cancelButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),

            scanFrame.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            scanFrame.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            scanFrame.widthAnchor.constraint(equalToConstant: 250),
            scanFrame.heightAnchor.constraint(equalToConstant: 250),

            instructionLabel.topAnchor.constraint(equalTo: scanFrame.bottomAnchor, constant: 24),
            instructionLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.layer.bounds
    }

    @objc private func cancelTapped() {
        delegate?.dismissScanner(with: nil)
    }

    // MARK: - AVCaptureMetadataOutputObjectsDelegate

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard !hasScanned else { return }

        if let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
           metadataObject.type == .qr,
           let barcode = metadataObject.stringValue {
            hasScanned = true

            // Haptic feedback
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)

            delegate?.dismissScanner(with: barcode)
        }
    }
}
