//
//  Loadable.swift
//  ChainLink
//
//  Created by Artem on 05.11.2022.
//

import UIKit

protocol Loadable: AnyObject {
    func startLoading()
    func stopLoading()
}


// MARK: - Loadable
extension Loadable where Self: UIViewController {

    // MARK: - Public methods

    func startLoading() {
        let containerView = UIView()
        let loadingIndicator = UIActivityIndicatorView(style: .large)

        containerView.tag = 9999
        containerView.backgroundColor = UIColor.black.withAlphaComponent(0.2)
        containerView.translatesAutoresizingMaskIntoConstraints = false

        loadingIndicator.color = #colorLiteral(red: 0.2286144793, green: 0.3001247048, blue: 0.9123151302, alpha: 1)
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(containerView)
        containerView.addSubview(loadingIndicator)

        NSLayoutConstraint.activate([
            containerView.topAnchor.constraint(equalTo: view.topAnchor),
            containerView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            containerView.leftAnchor.constraint(equalTo: view.leftAnchor),
            containerView.rightAnchor.constraint(equalTo: view.rightAnchor),

            loadingIndicator.centerYAnchor.constraint(equalTo: containerView.centerYAnchor),
            loadingIndicator.centerXAnchor.constraint(equalTo: containerView.centerXAnchor)
        ])

        loadingIndicator.startAnimating()
    }

    func stopLoading() {
        let containerView = view.subviews.first(where: { $0.tag == 9999 })
        containerView?.removeFromSuperview()
    }

}

