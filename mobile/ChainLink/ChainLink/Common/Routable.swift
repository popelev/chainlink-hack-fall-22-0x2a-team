//
//  Routable.swift
//  ChainLink
//
//  Created by Artem on 04.11.2022.
//

import UIKit

protocol Routable {
    static func instantiate(fromStoryboard: String, with shared: Any?) -> Self
}

extension Routable where Self: UIViewController {
    static func instantiate(fromStoryboard: String, with shared: Any? = nil) -> Self {
        let className = String(describing: Self.self)
        let storyboard = UIStoryboard(name: fromStoryboard, bundle: Bundle.main)
        let viewController = storyboard.instantiateViewController(identifier: className) as! Self

        return viewController
    }
}

