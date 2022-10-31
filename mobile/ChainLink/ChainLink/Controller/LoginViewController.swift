//
//  LoginViewController.swift
//  ChainLink
//
//  Created by Artem on 30.10.2022.
//

import UIKit

class LoginViewController: UIViewController {

    // MARK: - Outlets

    @IBOutlet weak var logInButton: UIButton!
    @IBOutlet var buttons: [UIButton]!


    // MARK: - Properties

    private var userType: UserType!

    private var signingIn = false {
        didSet {
            logInButton.setNeedsUpdateConfiguration()
        }
    }


    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()

        logInButton.configurationUpdateHandler = { [unowned self] button in

            var config = button.configuration
            config?.showsActivityIndicator = signingIn
            config?.activityIndicatorColorTransformer = .init({ _ in
                #colorLiteral(red: 0.2286144793, green: 0.3001247048, blue: 0.9123151302, alpha: 1)
            })
            config?.imagePadding = 10
            button.isEnabled = !signingIn && userType != nil
            button.configuration = config
        }
    }


    // MARK: - Actions

    @IBAction func buttonDidTap(_ sender: UIButton) {
        buttons.enumerated().forEach { index, button in
            if button == sender {
                userType = UserType(rawValue: index)
                button.backgroundColor = #colorLiteral(red: 0.2286144793, green: 0.3001247048, blue: 0.9123151302, alpha: 1)
                button.setTitleColor(.white, for: .normal)
            } else {
                button.backgroundColor = #colorLiteral(red: 0.6406627893, green: 0.6756404042, blue: 0.9417474866, alpha: 1)
                button.setTitleColor(.black, for: .normal)
            }
        }
        logInButton.isEnabled = userType != nil
    }

    @IBAction func logInButtonDidTap(_ sender: UIButton) {

        signingIn = true
        Timer.scheduledTimer(withTimeInterval: 1.0, repeats: false) { _ in
          self.signingIn = false
//            let QRCodeVC = QRCodeViewController.instantiate(fromStoryboard: "Main")
//            QRCodeVC.userType = self.userType
//            self.present(QRCodeVC, animated: true)
        }
    }

}

