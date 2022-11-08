//
//  NetworkService.swift
//  ChainLink
//
//  Created by Artem on 05.11.2022.
//

import Foundation

enum HTTPError: Swift.Error, LocalizedError {

    case invalidURLRequest
    case badServerResponse
    case unknown

    var errorDescription: String? {

        switch self {

        case .invalidURLRequest:
            return NSLocalizedString("URLRequest вернул nil", comment: "invalidURLRequest")

        case .badServerResponse:
            return NSLocalizedString("Статус код сервера >299", comment: "badServerResponse")

        case.unknown:
            return NSLocalizedString("Неизвестная ошибка", comment: "unknown")
        }
    }
    
}

struct NetworkService {

    func performRequest(account: UserType, type: ActionType, qrCode: String) async throws -> NetworkResponseModel {

        guard let url = URL(string: NetworkConstants.baseURL) else { throw HTTPError.invalidURLRequest }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Application/json", forHTTPHeaderField: "Content-Type")

        let body = ["account": account.userIdentifier, "type": type.rawValue, "qr": qrCode]
        let httpBody = try? JSONSerialization.data(withJSONObject: body, options: [])
        request.httpBody = httpBody

        let (data, _) = try await URLSession.shared.data(for: request)

        let model = try JSONDecoder().decode(NetworkResponseModel.self, from: data)
        return model
    }

}
