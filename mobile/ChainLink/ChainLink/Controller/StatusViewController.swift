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

    @IBOutlet weak var produceDateLabel: UILabel!
    @IBOutlet weak var storeDateLabel: UILabel!
    @IBOutlet weak var soldDateLabel: UILabel!

    @IBOutlet var statusViews: [UIView]!
    @IBOutlet weak var statusStackView: UIStackView!
    @IBOutlet weak var lineView: UIView!

    @IBOutlet weak var actionButton: CustomButton!


    // MARK: - Properties

    var onDidDisappear: (() -> Void)?

    var userType: UserType!
    var model: NetworkResponseModel!

    let networkService = NetworkService()


    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()

        drawSelf()
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)

        onDidDisappear?()
    }

    
    // MARK: - Drawing

    private func drawSelf() {

        avatarImageView.image = UIImage(named: userType.userIdentifier)

        productImageView.sd_imageIndicator = SDWebImageActivityIndicator.gray
        productImageView.sd_setImage(with: URL(string: model.answer.imageLink))
        productNameLabel.text = model.answer.name
        productIdLabel.text = "id: " + model.answer.qr

        drawStatus()

        produceDateLabel.text = model.answer.producedDate
        storeDateLabel.text = model.answer.inShopDate
        soldDateLabel.text = model.answer.soldDate

        actionButton.setTitle(model.answer.buttonTitle, for: .normal)
        actionButton.isEnabled = model.answer.buttonEnable

        if case .customer = userType {
            actionButton.isHidden = true

            if !model.answer.success {
                statusStackView.isHidden = true
                productIdLabel.isHidden = true
                lineView.isHidden = true
                productNameLabel.text = "Sorry, not found. Try again or ask supplier"
                productImageView.image = UIImage(named: "icNotFound")
            }
        }
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

            } catch {
                actionButton.stopLoading()
                showAlert(withMessage: error.localizedDescription)
            }
        }
    }

    
    // MARK: - Actions

    @IBAction func actionButtonDidTap(_ sender: Any) {

        guard let index = model.states.firstIndex(of: false) else { return }
        let actionType = ActionType.allCases[index]
        performRequest(actionType: actionType)
    }

}
