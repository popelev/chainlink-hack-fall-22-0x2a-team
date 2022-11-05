//
//  StatusViewController.swift
//  ChainLink
//
//  Created by Artem on 05.11.2022.
//

import UIKit
import SDWebImage

class StatusViewController: UIViewController, Routable {

    // MARK: - Outlets

    @IBOutlet weak var avatarImageView: UIImageView!
    @IBOutlet weak var productImageView: UIImageView!
    @IBOutlet weak var productNameLabel: UILabel!
    @IBOutlet weak var productIdLabel: UILabel!
//    @IBOutlet weak var produceStatusView: UIView!
    @IBOutlet weak var produceDateLabel: UILabel!
//    @IBOutlet weak var storeStatusView: UIView!
    @IBOutlet weak var storeDateLabel: UILabel!
//    @IBOutlet weak var soldStatusView: UIView!
    @IBOutlet weak var soldDateLabel: UILabel!
    @IBOutlet weak var actionButton: CustomButton!

    @IBOutlet var statusViews: [UIView]!


    // MARK: - Properties

    var userType: UserType!
    var model: NetworkResponseModel!

    let networkService = NetworkService()


    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()

        drawSelf()
    }


    // MARK: - Drawing

    private func drawSelf() {

        avatarImageView.image = UIImage(named: userType.userIdentifier)

        productImageView.sd_imageIndicator = SDWebImageActivityIndicator.gray
        productImageView.sd_setImage(with: URL(string: "https://" + model.answer.imageLink))
        productNameLabel.text = model.answer.name
        productIdLabel.text = "id: " + model.answer.qr
        actionButton.setTitle(model.answer.buttonTitle, for: .normal)
        actionButton.isEnabled = model.answer.buttonEnable
        drawStatus()
        produceDateLabel.text = model.answer.producedDate
        storeDateLabel.text = model.answer.inShopDate
        soldDateLabel.text = model.answer.soldDate
    }

    
    // MARK: - Private methods

    private func drawStatus() {
        statusViews.enumerated().forEach { index, view in
            view.backgroundColor = model.states[index] ? #colorLiteral(red: 0.4400430918, green: 0.7648789287, blue: 0.1854673922, alpha: 1) : #colorLiteral(red: 0.850980401, green: 0.8509805799, blue: 0.8552859426, alpha: 1)
        }
    }

    private func showAlert(withMessage message: String) {
            let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
            alert.addAction(.init(title: "OK", style: .default))
            present(alert, animated: true)
        }


    private func performRequest(actionType: ActionType) {

        actionButton.startLoading()

        Task {
            do {
                let model = try await networkService.performRequest(account: userType, type: actionType, qrCode: model.answer.qr)
                
                actionButton.stopLoading()
                self.model = model
                drawSelf()
                debugPrint("🟨 нажал на кнопку: ", model)
            } catch {
                actionButton.stopLoading()
                debugPrint("🔴", error)
                showAlert(withMessage: error.localizedDescription)

            }
        }
    }

    
    // MARK: - Actions

    @IBAction func actionButtonDidTap(_ sender: Any) {

        guard let index = model.states.firstIndex(of: false) else { return }
        let actionType = ActionType.allCases[index]
        debugPrint("🔵", actionType)
        performRequest(actionType: actionType)
    }

}
