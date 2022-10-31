//
//  UserType.swift
//  ChainLink
//
//  Created by Artem on 31.10.2022.
//

enum UserType: Int {
    case customer, supplier, producer

    var userIdentifier: String {

        switch self {

        case .customer:
            return "customer"

        case .supplier:
            return "supplier"

        case .producer:
            return "producer"
        }
    }
    
}
