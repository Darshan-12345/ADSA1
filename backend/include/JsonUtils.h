#pragma once

#include "Models.h"

#include <cctype>
#include <sstream>
#include <string>
#include <vector>

namespace json {

inline std::string escape(const std::string& value) {
    std::ostringstream out;
    for (char ch : value) {
        switch (ch) {
            case '\\': out << "\\\\"; break;
            case '"': out << "\\\""; break;
            case '\n': out << "\\n"; break;
            case '\r': out << "\\r"; break;
            case '\t': out << "\\t"; break;
            default: out << ch; break;
        }
    }
    return out.str();
}

inline std::string quote(const std::string& value) {
    return "\"" + escape(value) + "\"";
}

inline std::string boolValue(bool value) {
    return value ? "true" : "false";
}

inline std::string getJsonString(const std::string& body, const std::string& key) {
    const std::string pattern = "\"" + key + "\"";
    const std::size_t keyPos = body.find(pattern);
    if (keyPos == std::string::npos) return "";
    const std::size_t colonPos = body.find(':', keyPos + pattern.size());
    if (colonPos == std::string::npos) return "";
    std::size_t start = body.find('"', colonPos + 1);
    if (start == std::string::npos) return "";
    ++start;

    std::string result;
    bool escaped = false;
    for (std::size_t i = start; i < body.size(); ++i) {
      const char ch = body[i];
      if (escaped) {
          switch (ch) {
              case 'n': result.push_back('\n'); break;
              case 'r': result.push_back('\r'); break;
              case 't': result.push_back('\t'); break;
              default: result.push_back(ch); break;
          }
          escaped = false;
          continue;
      }
      if (ch == '\\') {
          escaped = true;
          continue;
      }
      if (ch == '"') break;
      result.push_back(ch);
    }
    return result;
}

inline long long getJsonLong(const std::string& body, const std::string& key, long long fallback = 0) {
    const std::string pattern = "\"" + key + "\"";
    const std::size_t keyPos = body.find(pattern);
    if (keyPos == std::string::npos) return fallback;
    const std::size_t colonPos = body.find(':', keyPos + pattern.size());
    if (colonPos == std::string::npos) return fallback;
    std::size_t start = colonPos + 1;
    while (start < body.size() && std::isspace(static_cast<unsigned char>(body[start]))) ++start;
    std::size_t end = start;
    while (end < body.size() && (std::isdigit(static_cast<unsigned char>(body[end])) || body[end] == '-')) ++end;
    if (end == start) return fallback;
    return std::stoll(body.substr(start, end - start));
}

inline std::string stringArray(const std::vector<std::string>& values) {
    std::ostringstream out;
    out << "[";
    for (std::size_t i = 0; i < values.size(); ++i) {
        if (i > 0) out << ",";
        out << quote(values[i]);
    }
    out << "]";
    return out.str();
}

inline std::string searchResult(const SearchResult& result) {
    std::ostringstream out;
    out << "{"
        << "\"path\":" << quote(result.path) << ","
        << "\"name\":" << quote(result.name) << ","
        << "\"extension\":" << quote(result.extension) << ","
        << "\"parent\":" << quote(result.parent) << ","
        << "\"score\":" << result.score << ","
        << "\"size\":" << result.size << ","
        << "\"isTemporary\":" << boolValue(result.isTemporary) << ","
        << "\"isImportant\":" << boolValue(result.isImportant) << ","
        << "\"expiresAt\":" << result.expiresAt << ","
        << "\"lastWrite\":" << result.lastWrite
        << "}";
    return out.str();
}

inline std::string searchResults(const std::vector<SearchResult>& results) {
    std::ostringstream out;
    out << "[";
    for (std::size_t i = 0; i < results.size(); ++i) {
        if (i > 0) out << ",";
        out << searchResult(results[i]);
    }
    out << "]";
    return out.str();
}

inline std::string fileNode(const FileNode& node) {
    std::ostringstream out;
    out << "{"
        << "\"path\":" << quote(node.path) << ","
        << "\"name\":" << quote(node.name) << ","
        << "\"isDirectory\":" << boolValue(node.isDirectory) << ","
        << "\"size\":" << node.size << ","
        << "\"children\":[";
    for (std::size_t i = 0; i < node.children.size(); ++i) {
        if (i > 0) out << ",";
        out << fileNode(node.children[i]);
    }
    out << "]}";
    return out.str();
}

inline std::string structure(const std::vector<FileNode>& nodes) {
    std::ostringstream out;
    out << "[";
    for (std::size_t i = 0; i < nodes.size(); ++i) {
        if (i > 0) out << ",";
        out << fileNode(nodes[i]);
    }
    out << "]";
    return out.str();
}

inline std::string duplicatesArray(const std::vector<std::vector<std::string>>& values) {
    std::ostringstream out;
    out << "[";
    for (std::size_t i = 0; i < values.size(); ++i) {
        if (i > 0) out << ",";
        out << stringArray(values[i]);
    }
    out << "]";
    return out.str();
}

inline std::string insights(const Insights& data) {
    std::ostringstream out;
    out << "{"
        << "\"duplicateFiles\":" << duplicatesArray(data.duplicateFiles) << ","
        << "\"largeFiles\":" << stringArray(data.largeFiles) << ","
        << "\"unusedFiles\":" << stringArray(data.unusedFiles)
        << "}";
    return out.str();
}

inline std::string scanSummary(const ScanSummary& summary) {
    std::ostringstream out;
    out << "{"
        << "\"rootPath\":" << quote(summary.rootPath) << ","
        << "\"indexedFiles\":" << summary.indexedFiles << ","
        << "\"indexedFolders\":" << summary.indexedFolders << ","
        << "\"indexing\":" << boolValue(summary.indexing) << ","
        << "\"files\":" << searchResults(summary.files) << ","
        << "\"insights\":" << insights(summary.insights) << ","
        << "\"structure\":" << structure(summary.structure) << ","
        << "\"temporaryFiles\":" << searchResults(summary.temporaryFiles)
        << "}";
    return out.str();
}

inline std::string message(const std::string& value) {
    return "{\"message\":" + quote(value) + "}";
}

inline std::string statusMessage(const std::string& status, const std::string& value) {
    return "{\"status\":" + quote(status) + ",\"message\":" + quote(value) + "}";
}

inline std::string autocomplete(const std::vector<std::string>& values) {
    return "{\"suggestions\":" + stringArray(values) + "}";
}

inline std::string related(const std::vector<std::string>& values) {
    return "{\"relatedFiles\":" + stringArray(values) + "}";
}

}  // namespace json
