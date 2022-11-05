//
//  QRCodeViewController.swift
//  ChainLink
//
//  Created by Artem on 04.11.2022.
//

import UIKit
import AVFoundation
import QRScanner

class QRCodeViewController: UIViewController, Loadable, Routable {

    // MARK: - Properties

    var userType: UserType!
    var model: NetworkResponseModel!
    var qrScannerView: QRScannerView!

    let networkService = NetworkService()


    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()

        setupQRScanner()
    }


    // MARK: - Private methods

    private func showAlert(withMessage message: String) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
            alert.addAction(.init(title: "OK", style: .default) { _ in
                self.qrScannerView.rescan()
            })
            self.present(alert, animated: true)
        }
    }

    private func setupQRScanner() {

        switch AVCaptureDevice.authorizationStatus(for: .video) {

        case .authorized:
            setupQRScannerView()

        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                if granted {
                    DispatchQueue.main.async {
                        self?.setupQRScannerView()
                    }
                }
            }

        default:
            showAlert(withMessage: "Camera is required to use in this application")
        }
    }

    private func setupQRScannerView() {
        
        qrScannerView = QRScannerView(frame: view.bounds)
        view.addSubview(qrScannerView)
        qrScannerView.configure(delegate: self, input: .init(isBlurEffectEnabled: true))

        qrScannerView.startRunning()
    }

    private func fetchData(qrCode: String) {

        startLoading()

        Task {
            do {
                let model = try await networkService.performRequest(account: userType, type: .scan, qrCode: qrCode)
                stopLoading()

                let statusVC = StatusViewController.instantiate(fromStoryboard: "Main")
                statusVC.userType = userType
                statusVC.model = model
                present(statusVC, animated: true)
                qrScannerView.rescan()
                debugPrint("✅", model)
            } catch {
                stopLoading()
                debugPrint("🔴", error)
                //                showAlert(withMessage: error.localizedDescription)
                
//                let statusVC = StatusViewController.instantiate(fromStoryboard: "Main")
//                statusVC.userType = userType
//                statusVC.model = model
//                present(statusVC, animated: true)
            }
        }
    }

    private func parseQRCode(qrCode: String) -> String {
        guard let data = qrCode.data(using: .utf8) else { return "" }
        let dictionary = try? JSONSerialization.jsonObject(with: data) as? [String: String]
        if let dictionary {
            return dictionary["id"] ?? ""
        }
        return ""
    }

}

// MARK: - QRScannerViewDelegate
extension QRCodeViewController: QRScannerViewDelegate {

    func qrScannerView(_ qrScannerView: QRScannerView, didFailure error: QRScannerError) {

        // showAlert(withMessage: error.localizedDescription)
        fetchData(qrCode: "37470079394597546017821359402343014298469527652371950473243809108734949064165")
    }

    func qrScannerView(_ qrScannerView: QRScannerView, didSuccess code: String) {

        let code = parseQRCode(qrCode: code)
        fetchData(qrCode: code)
    }

}
