//
//  CustomButton.swift
//  ChainLink
//
//  Created by Artem on 03.11.2022.
//

import UIKit

class CustomButton: UIButton {

    // MARK: - Init

    required init?(coder: NSCoder) {
        super.init(coder: coder)

        var configuration = UIButton.Configuration.plain()

        var attributeContainer = AttributeContainer()
        attributeContainer.font = .init(name: "Helvetica Neue Bold", size: 25)

        configuration.cornerStyle = .capsule
        configuration.imagePadding = 10

        let handler: UIButton.ConfigurationUpdateHandler = { [unowned self] button in

            
            switch button.state {

            case .disabled:
                button.configuration?.background.backgroundColor = #colorLiteral(red: 0.850980401, green: 0.8509805799, blue: 0.8552859426, alpha: 1)
                attributeContainer.foregroundColor = .black
                button.configuration?.attributedTitle = AttributedString(currentTitle ?? "", attributes: attributeContainer)


            default:
                button.configuration?.background.backgroundColor = #colorLiteral(red: 0.2286144793, green: 0.3001247048, blue: 0.9123151302, alpha: 1)
                attributeContainer.foregroundColor = .white
                button.configuration?.attributedTitle = AttributedString(currentTitle ?? "", attributes: attributeContainer)
            }
        }

        self.configuration = configuration
        configurationUpdateHandler = handler

    }

    // MARK: - Public methods

    func startLoading() {
        configuration?.showsActivityIndicator = true
    }

    func stopLoading() {
        configuration?.showsActivityIndicator = false
    }
}
