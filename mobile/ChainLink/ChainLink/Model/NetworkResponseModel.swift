//
//  NetworkResponseModel.swift
//  ChainLink
//
//  Created by Artem on 22.10.2022.
//

struct NetworkResponseModel: Decodable {

    struct Answer: Decodable {

        let qr: String
        let account: String
        let success: Bool
        let imageLink: String
        let blockchainLink: String
        let name: String
        let produced: Bool
        let producedDate: String
        let inShop: Bool
        let inShopDate: String
        let sold: Bool
        let soldDate: String
        let buttonTitle: String
        let buttonEnable: Bool
    }

    var states: [Bool] {
        [answer.produced, answer.inShop, answer.sold]
    }

    let answer: Answer
    
}
