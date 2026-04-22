#include "../include/JsonUtils.h"
#include "../include/SearchEngine.h"

#include <cctype>
#include <exception>
#include <iostream>
#include <iterator>
#include <sstream>
#include <string>
#include <unordered_map>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "Ws2_32.lib")
#endif

namespace {

struct HttpRequest {
    std::string method;
    std::string path;
    std::string query;
    std::unordered_map<std::string, std::string> headers;
    std::string body;
};

std::unordered_map<std::string, std::string> parseQuery(const std::string& query) {
    std::unordered_map<std::string, std::string> values;
    std::stringstream stream(query);
    std::string segment;
    while (std::getline(stream, segment, '&')) {
        const std::size_t split = segment.find('=');
        if (split == std::string::npos) continue;
        values[segment.substr(0, split)] = segment.substr(split + 1);
    }
    return values;
}

std::string urlDecode(const std::string& value) {
    std::string decoded;
    for (std::size_t i = 0; i < value.size(); ++i) {
        if (value[i] == '%' && i + 2 < value.size()) {
            const std::string hex = value.substr(i + 1, 2);
            decoded.push_back(static_cast<char>(std::stoi(hex, nullptr, 16)));
            i += 2;
        } else if (value[i] == '+') {
            decoded.push_back(' ');
        } else {
            decoded.push_back(value[i]);
        }
    }
    return decoded;
}

HttpRequest parseRequest(const std::string& raw) {
    HttpRequest request;
    std::stringstream stream(raw);
    std::string startLine;
    std::getline(stream, startLine);
    if (!startLine.empty() && startLine.back() == '\r') startLine.pop_back();

    std::stringstream start(startLine);
    std::string target;
    start >> request.method >> target;
    const std::size_t queryPos = target.find('?');
    request.path = queryPos == std::string::npos ? target : target.substr(0, queryPos);
    request.query = queryPos == std::string::npos ? "" : target.substr(queryPos + 1);

    std::string line;
    while (std::getline(stream, line) && line != "\r") {
        if (!line.empty() && line.back() == '\r') line.pop_back();
        const std::size_t split = line.find(':');
        if (split == std::string::npos) continue;
        std::string key = line.substr(0, split);
        std::string value = line.substr(split + 1);
        while (!value.empty() && std::isspace(static_cast<unsigned char>(value.front()))) value.erase(value.begin());
        request.headers[key] = value;
    }

    request.body.assign((std::istreambuf_iterator<char>(stream)), std::istreambuf_iterator<char>());
    return request;
}

std::string response(const std::string& body, int status = 200, const std::string& statusText = "OK") {
    std::ostringstream out;
    out << "HTTP/1.1 " << status << " " << statusText << "\r\n"
        << "Content-Type: application/json\r\n"
        << "Access-Control-Allow-Origin: *\r\n"
        << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
        << "Access-Control-Allow-Headers: Content-Type\r\n"
        << "Content-Length: " << body.size() << "\r\n\r\n"
        << body;
    return out.str();
}

std::string handleRequest(SearchEngine& engine, const HttpRequest& request) {
    try {
        if (request.method == "OPTIONS") return response("{}");

        if (request.path == "/scan-folder" && request.method == "POST") {
            const std::string rootPath = json::getJsonString(request.body, "path");
            if (rootPath.empty()) return response(json::message("Missing path"), 400, "Bad Request");
            return response(json::scanSummary(engine.scanFolder(rootPath)));
        }

        if (request.path == "/search" && request.method == "GET") {
            const auto params = parseQuery(request.query);
            const auto queryIt = params.find("q");
            return response("{\"results\":" + json::searchResults(engine.search(queryIt == params.end() ? "" : urlDecode(queryIt->second))) + "}");
        }

        if (request.path == "/autocomplete" && request.method == "GET") {
            const auto params = parseQuery(request.query);
            const auto prefixIt = params.find("prefix");
            return response(json::autocomplete(engine.autocomplete(prefixIt == params.end() ? "" : urlDecode(prefixIt->second))));
        }

        if (request.path == "/mark-temp" && request.method == "POST") {
            const std::string path = json::getJsonString(request.body, "path");
            const long long ttlSeconds = json::getJsonLong(request.body, "ttlSeconds", 600);
            return response("{\"temporaryFiles\":" + json::searchResults(engine.markTemporary(path, ttlSeconds)) + "}");
        }

        if (request.path == "/restore-temp" && request.method == "POST") {
            const std::string path = json::getJsonString(request.body, "path");
            return response("{\"temporaryFiles\":" + json::searchResults(engine.restoreTemporary(path)) + "}");
        }

        if (request.path == "/extend-temp" && request.method == "POST") {
            const std::string path = json::getJsonString(request.body, "path");
            const long long ttlSeconds = json::getJsonLong(request.body, "ttlSeconds", 600);
            return response("{\"temporaryFiles\":" + json::searchResults(engine.extendTemporary(path, ttlSeconds)) + "}");
        }

        if (request.path == "/mark-important" && request.method == "POST") {
            const std::string path = json::getJsonString(request.body, "path");
            const long long important = json::getJsonLong(request.body, "important", 1);
            return response("{\"files\":" + json::searchResults(engine.markImportant(path, important != 0)) + "}");
        }

        if (request.path == "/delete-expired" && request.method == "POST") {
            return response("{\"deleted\":" + json::searchResults(engine.deleteExpired()) + "}");
        }

        if (request.path == "/rename-file" && request.method == "POST") {
            const std::string path = json::getJsonString(request.body, "path");
            const std::string nextName = json::getJsonString(request.body, "nextName");
            if (path.empty() || nextName.empty()) return response(json::message("Missing path or nextName"), 400, "Bad Request");
            return response(json::scanSummary(engine.renameFile(path, nextName)));
        }

        if (request.path == "/move-file" && request.method == "POST") {
            const std::string path = json::getJsonString(request.body, "path");
            const std::string nextParent = json::getJsonString(request.body, "nextParent");
            if (path.empty() || nextParent.empty()) return response(json::message("Missing path or nextParent"), 400, "Bad Request");
            return response(json::scanSummary(engine.moveFile(path, nextParent)));
        }

        if (request.path == "/delete-file" && request.method == "POST") {
            const std::string path = json::getJsonString(request.body, "path");
            if (path.empty()) return response(json::message("Missing path"), 400, "Bad Request");
            return response(json::scanSummary(engine.deleteFile(path)));
        }

        if (request.path == "/get-structure" && request.method == "GET") {
            return response("{\"structure\":" + json::structure(engine.getStructure()) + ",\"insights\":" + json::insights(engine.getInsights()) + "}");
        }

        if (request.path == "/related-files" && request.method == "GET") {
            const auto params = parseQuery(request.query);
            const auto pathIt = params.find("path");
            return response(json::related(engine.relatedFiles(pathIt == params.end() ? "" : urlDecode(pathIt->second))));
        }

        if (request.path == "/temp-files" && request.method == "GET") {
            return response("{\"temporaryFiles\":" + json::searchResults(engine.getTemporaryFiles()) + "}");
        }

        if (request.path == "/preview" && request.method == "GET") {
            const auto params = parseQuery(request.query);
            const auto pathIt = params.find("path");
            return response("{\"preview\":" + json::quote(engine.previewFile(pathIt == params.end() ? "" : urlDecode(pathIt->second))) + "}");
        }

        if (request.path == "/optimize-backup" && request.method == "GET") {
            const auto params = parseQuery(request.query);
            const auto capacityIt = params.find("capacity");
            const std::size_t capacity = capacityIt == params.end() ? 100 : std::stoull(capacityIt->second);
            return response("{\"results\":" + json::searchResults(engine.optimizeBackup(capacity)) + "}");
        }

        return response(json::message("Route not found"), 404, "Not Found");
    } catch (const std::exception& error) {
        return response(json::statusMessage("error", error.what()), 500, "Internal Server Error");
    }
}

}  // namespace

int main() {
#ifdef _WIN32
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        std::cerr << "Failed to initialize Winsock\n";
        return 1;
    }
#endif

    SearchEngine engine;
    const int port = 18080;

    SOCKET serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (serverSocket == INVALID_SOCKET) {
        std::cerr << "Unable to create socket\n";
        return 1;
    }

    sockaddr_in serverAddress{};
    serverAddress.sin_family = AF_INET;
    serverAddress.sin_addr.s_addr = INADDR_ANY;
    serverAddress.sin_port = htons(port);

    if (bind(serverSocket, reinterpret_cast<sockaddr*>(&serverAddress), sizeof(serverAddress)) == SOCKET_ERROR) {
        std::cerr << "Bind failed\n";
        return 1;
    }

    if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR) {
        std::cerr << "Listen failed\n";
        return 1;
    }

    std::cout << "AetherDocs backend running on http://localhost:" << port << "\n";

    while (true) {
        sockaddr_in clientAddress{};
        int clientSize = sizeof(clientAddress);
        SOCKET clientSocket = accept(serverSocket, reinterpret_cast<sockaddr*>(&clientAddress), &clientSize);
        if (clientSocket == INVALID_SOCKET) continue;

        std::string rawRequest;
        char buffer[8192];
        int received = 0;
        do {
            received = recv(clientSocket, buffer, sizeof(buffer), 0);
            if (received > 0) {
                rawRequest.append(buffer, buffer + received);
                if (received < static_cast<int>(sizeof(buffer))) break;
            }
        } while (received > 0);

        const HttpRequest request = parseRequest(rawRequest);
        const std::string httpResponse = handleRequest(engine, request);
        send(clientSocket, httpResponse.c_str(), static_cast<int>(httpResponse.size()), 0);
        closesocket(clientSocket);
    }

#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}
