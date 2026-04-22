#include "../include/SearchEngine.h"

#include <algorithm>
#include <chrono>
#include <fstream>
#include <stdexcept>
#include <sstream>
#include <windows.h>

namespace {

std::string joinPath(const std::string& left, const std::string& right) {
    if (left.empty()) return right;
    if (left.back() == '\\' || left.back() == '/') return left + right;
    return left + "\\" + right;
}

std::string baseName(const std::string& path) {
    const std::size_t pos = path.find_last_of("\\/");
    return pos == std::string::npos ? path : path.substr(pos + 1);
}

std::string parentPath(const std::string& path) {
    const std::size_t pos = path.find_last_of("\\/");
    return pos == std::string::npos ? "" : path.substr(0, pos);
}

std::string extensionOf(const std::string& path) {
    const std::string name = baseName(path);
    const std::size_t pos = name.find_last_of('.');
    return pos == std::string::npos ? "" : name.substr(pos);
}

long long currentEpochSeconds() {
    return static_cast<long long>(
        std::chrono::duration_cast<std::chrono::seconds>(std::chrono::system_clock::now().time_since_epoch()).count());
}

bool isDirectory(const WIN32_FIND_DATAA& data) {
    return (data.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) != 0;
}

long long fileTimeToEpoch(const FILETIME& fileTime) {
    ULARGE_INTEGER value;
    value.LowPart = fileTime.dwLowDateTime;
    value.HighPart = fileTime.dwHighDateTime;
    constexpr unsigned long long windowsToUnixEpoch = 116444736000000000ULL;
    if (value.QuadPart < windowsToUnixEpoch) return 0;
    return static_cast<long long>((value.QuadPart - windowsToUnixEpoch) / 10000000ULL);
}

std::size_t fileSize(const WIN32_FIND_DATAA& data) {
    LARGE_INTEGER size;
    size.HighPart = data.nFileSizeHigh;
    size.LowPart = data.nFileSizeLow;
    return static_cast<std::size_t>(size.QuadPart);
}

std::string normalizePath(const std::string& path) {
    std::string normalized = path;
    std::replace(normalized.begin(), normalized.end(), '/', '\\');
    return normalized;
}

bool ensureDirectoryExists(const std::string& rawPath) {
    const std::string path = normalizePath(rawPath);
    if (path.empty()) return false;
    if (CreateDirectoryA(path.c_str(), nullptr) != 0 || GetLastError() == ERROR_ALREADY_EXISTS) return true;

    std::size_t cursor = 0;
    while (cursor < path.size()) {
        const std::size_t split = path.find('\\', cursor);
        const std::string segment = path.substr(0, split);
        if (!segment.empty() && segment.back() != ':') {
            CreateDirectoryA(segment.c_str(), nullptr);
        }
        if (split == std::string::npos) break;
        cursor = split + 1;
    }

    return CreateDirectoryA(path.c_str(), nullptr) != 0 || GetLastError() == ERROR_ALREADY_EXISTS;
}

}  // namespace

SearchEngine::SearchEngine() : trieRoot_(new TrieNode()) {}

void SearchEngine::clear() {
    files_.clear();
    invertedIndex_.clear();
    adjacency_.clear();
    structure_.clear();
    insights_ = {};
    folderCount_ = 0;
    tempHeap_ = std::priority_queue<TempFileEntry, std::vector<TempFileEntry>, std::greater<TempFileEntry>>();
    trieRoot_ = new TrieNode();
}

std::string SearchEngine::normalize(const std::string& value) const {
    std::string normalized;
    normalized.reserve(value.size());
    for (char ch : value) {
        if (std::isalnum(static_cast<unsigned char>(ch)) || ch == '.' || ch == '_' || ch == '-') {
            normalized.push_back(static_cast<char>(std::tolower(static_cast<unsigned char>(ch))));
        } else {
            normalized.push_back(' ');
        }
    }
    return normalized;
}

std::string SearchEngine::readFileSnippet(const std::string& path) const {
    std::ifstream input(path, std::ios::binary);
    if (!input) return "";

    std::string content;
    content.resize(2048);
    input.read(&content[0], static_cast<std::streamsize>(content.size()));
    content.resize(static_cast<std::size_t>(input.gcount()));
    return content;
}

void SearchEngine::trieInsert(const std::string& word) {
    TrieNode* cursor = trieRoot_;
    for (char raw : word) {
        const char ch = static_cast<char>(std::tolower(static_cast<unsigned char>(raw)));
        if (!cursor->children.count(ch)) {
            cursor->children[ch] = new TrieNode();
        }
        cursor = cursor->children[ch];
        if (cursor->terms.size() < 10) {
            cursor->terms.push_back(word);
        }
    }
    cursor->terminal = true;
}

SearchEngine::TrieNode* SearchEngine::trieWalk(const std::string& prefix) {
    TrieNode* cursor = trieRoot_;
    for (char raw : prefix) {
        const char ch = static_cast<char>(std::tolower(static_cast<unsigned char>(raw)));
        if (!cursor->children.count(ch)) {
            return nullptr;
        }
        cursor = cursor->children[ch];
    }
    return cursor;
}

void SearchEngine::trieCollect(TrieNode* node, std::vector<std::string>& output, std::size_t limit) {
    if (!node || output.size() >= limit) return;

    for (const auto& term : node->terms) {
        if (std::find(output.begin(), output.end(), term) == output.end()) {
            output.push_back(term);
            if (output.size() >= limit) return;
        }
    }

    for (const auto& entry : node->children) {
        trieCollect(entry.second, output, limit);
        if (output.size() >= limit) return;
    }
}

void SearchEngine::tokenizeAndIndex(const FileMetadata& metadata) {
    std::stringstream stream(normalize(metadata.name + " " + metadata.extension + " " + metadata.content));
    std::string token;
    std::unordered_set<std::string> uniqueTerms;
    while (stream >> token) {
        if (token.size() < 2) continue;
        uniqueTerms.insert(token);
    }

    for (const auto& tokenValue : uniqueTerms) {
        invertedIndex_[tokenValue].insert(metadata.path);
        trieInsert(tokenValue);
    }
}

void SearchEngine::addGraphRelationship(const std::string& source, const std::string& target) {
    if (source == target || source.empty() || target.empty()) return;
    adjacency_[source].insert(target);
    adjacency_[target].insert(source);
}

void SearchEngine::addDocument(const FileMetadata& metadata) {
    files_[metadata.path] = metadata;
    tokenizeAndIndex(metadata);
}

void SearchEngine::dfsBuild(const std::string& path, FileNode& node) {
    std::vector<std::pair<std::string, WIN32_FIND_DATAA>> entries;
    WIN32_FIND_DATAA data;
    HANDLE handle = FindFirstFileA(joinPath(path, "*").c_str(), &data);
    if (handle == INVALID_HANDLE_VALUE) return;

    do {
        const std::string name = data.cFileName;
        if (name == "." || name == "..") continue;
        entries.push_back({joinPath(path, name), data});
    } while (FindNextFileA(handle, &data));

    FindClose(handle);

    std::sort(entries.begin(), entries.end(), [](const auto& left, const auto& right) {
        if (isDirectory(left.second) != isDirectory(right.second)) return isDirectory(left.second) > isDirectory(right.second);
        return baseName(left.first) < baseName(right.first);
    });

    for (const auto& entry : entries) {
        FileNode child;
        child.path = entry.first;
        child.name = baseName(entry.first);
        child.isDirectory = isDirectory(entry.second);
        child.size = child.isDirectory ? 0 : fileSize(entry.second);

        if (child.isDirectory) {
            ++folderCount_;
            dfsBuild(child.path, child);
        } else {
            FileMetadata metadata;
            metadata.path = child.path;
            metadata.name = child.name;
            metadata.extension = extensionOf(entry.first);
            metadata.parent = parentPath(entry.first);
            metadata.size = child.size;
            metadata.content = readFileSnippet(child.path);
            metadata.lastWrite = fileTimeToEpoch(entry.second.ftLastWriteTime);
            const std::string normalizedName = normalize(metadata.name);
            metadata.isImportant =
                normalizedName.find("important") != std::string::npos ||
                normalizedName.find("invoice") != std::string::npos ||
                normalizedName.find("architecture") != std::string::npos;
            metadata.isTemporary =
                metadata.extension == ".tmp" ||
                metadata.extension == ".log" ||
                normalizedName.find("temp") != std::string::npos ||
                normalizedName.find("cache") != std::string::npos;
            metadata.expiresAt = metadata.isTemporary ? currentEpochSeconds() + 1800 : 0;
            if (metadata.isTemporary) {
                tempHeap_.push({metadata.path, metadata.expiresAt});
            }
            addDocument(metadata);
        }

        node.children.push_back(child);
    }
}

void SearchEngine::collectInsights() {
    std::unordered_map<std::string, std::vector<std::string>> bySignature;
    std::vector<std::pair<std::size_t, std::string>> sizes;

    for (const auto& entry : files_) {
        const FileMetadata& metadata = entry.second;
        bySignature[normalize(metadata.content.substr(0, 180)) + ":" + std::to_string(metadata.size)].push_back(metadata.path);
        sizes.push_back({metadata.size, metadata.path});

        const bool maybeUnused =
            metadata.extension == ".tmp" ||
            metadata.extension == ".log" ||
            metadata.name.find("unused") != std::string::npos;

        if (maybeUnused) {
            insights_.unusedFiles.push_back(metadata.path);
        }
    }

    for (const auto& group : bySignature) {
        if (group.second.size() > 1) {
            insights_.duplicateFiles.push_back(group.second);
            for (std::size_t i = 0; i < group.second.size(); ++i) {
                for (std::size_t j = i + 1; j < group.second.size(); ++j) {
                    addGraphRelationship(group.second[i], group.second[j]);
                }
            }
        }
    }

    std::sort(sizes.begin(), sizes.end(), std::greater<std::pair<std::size_t, std::string>>());
    const std::size_t largeCount = std::min<std::size_t>(5, sizes.size());
    for (std::size_t i = 0; i < largeCount; ++i) {
        insights_.largeFiles.push_back(sizes[i].second);
    }

    std::unordered_map<std::string, std::vector<std::string>> byExtension;
    std::unordered_map<std::string, std::vector<std::string>> byParent;
    for (const auto& item : files_) {
        byExtension[item.second.extension].push_back(item.first);
        byParent[item.second.parent].push_back(item.first);
    }

    for (const auto& group : byExtension) {
        for (std::size_t i = 0; i < group.second.size(); ++i) {
            for (std::size_t j = i + 1; j < group.second.size(); ++j) {
                addGraphRelationship(group.second[i], group.second[j]);
            }
        }
    }

    for (const auto& group : byParent) {
        for (std::size_t i = 0; i < group.second.size(); ++i) {
            for (std::size_t j = i + 1; j < group.second.size(); ++j) {
                addGraphRelationship(group.second[i], group.second[j]);
            }
        }
    }
}

ScanSummary SearchEngine::scanFolder(const std::string& rootPath) {
    clear();
    rootPath_ = rootPath;

    FileNode rootNode;
    rootNode.path = rootPath;
    rootNode.name = baseName(rootPath).empty() ? rootPath : baseName(rootPath);
    rootNode.isDirectory = true;
    dfsBuild(rootPath, rootNode);
    structure_.push_back(rootNode);
    collectInsights();

    ScanSummary summary;
    summary.rootPath = rootPath_;
    summary.indexedFiles = files_.size();
    summary.indexedFolders = folderCount_;
    summary.files = search("", files_.size());
    summary.insights = insights_;
    summary.structure = structure_;
    summary.temporaryFiles = getTemporaryFiles();
    return summary;
}

SearchResult SearchEngine::toSearchResult(const FileMetadata& metadata, std::size_t score) const {
    SearchResult result;
    result.path = metadata.path;
    result.name = metadata.name;
    result.extension = metadata.extension;
    result.parent = metadata.parent;
    result.score = score;
    result.size = metadata.size;
    result.isTemporary = metadata.isTemporary;
    result.isImportant = metadata.isImportant;
    result.expiresAt = metadata.expiresAt;
    result.lastWrite = metadata.lastWrite;
    return result;
}

std::vector<SearchResult> SearchEngine::search(const std::string& query, std::size_t limit) {
    std::vector<SearchResult> results;

    if (query.empty()) {
        for (const auto& item : files_) {
            results.push_back(toSearchResult(item.second, 0));
        }
    } else {
        std::stringstream stream(normalize(query));
        std::string token;
        std::unordered_map<std::string, std::size_t> scoreByPath;
        while (stream >> token) {
            const auto indexIt = invertedIndex_.find(token);
            if (indexIt == invertedIndex_.end()) continue;
            for (const auto& path : indexIt->second) {
                scoreByPath[path] += 1;
            }
        }

        for (const auto& item : scoreByPath) {
            const auto fileIt = files_.find(item.first);
            if (fileIt != files_.end()) {
                results.push_back(toSearchResult(fileIt->second, item.second));
            }
        }
    }

    std::sort(results.begin(), results.end(), [](const SearchResult& left, const SearchResult& right) {
        if (left.score != right.score) return left.score > right.score;
        return left.name < right.name;
    });
    if (results.size() > limit) results.resize(limit);
    return results;
}

std::vector<std::string> SearchEngine::autocomplete(const std::string& prefix, std::size_t limit) {
    std::vector<std::string> suggestions;
    TrieNode* node = trieWalk(normalize(prefix));
    trieCollect(node, suggestions, limit);
    return suggestions;
}

std::vector<FileNode> SearchEngine::getStructure() {
    return structure_;
}

std::vector<std::string> SearchEngine::relatedFiles(const std::string& path) {
    std::vector<std::string> results;
    const auto it = adjacency_.find(path);
    if (it == adjacency_.end()) return results;
    results.insert(results.end(), it->second.begin(), it->second.end());
    std::sort(results.begin(), results.end());
    return results;
}

std::vector<SearchResult> SearchEngine::markTemporary(const std::string& path, long long ttlSeconds) {
    const auto it = files_.find(path);
    if (it == files_.end()) return {};

    const long long now = currentEpochSeconds();
    it->second.isTemporary = true;
    it->second.expiresAt = now + ttlSeconds;
    tempHeap_.push({path, it->second.expiresAt});
    return getTemporaryFiles();
}

std::vector<SearchResult> SearchEngine::markImportant(const std::string& path, bool important) {
    const auto it = files_.find(path);
    if (it == files_.end()) return {};
    it->second.isImportant = important;
    return search("", files_.size());
}

std::vector<SearchResult> SearchEngine::deleteExpired() {
    const long long now = currentEpochSeconds();

    std::vector<SearchResult> removed;
    while (!tempHeap_.empty() && tempHeap_.top().expiresAt <= now) {
        const TempFileEntry entry = tempHeap_.top();
        tempHeap_.pop();

        const auto fileIt = files_.find(entry.path);
        if (fileIt == files_.end() || !fileIt->second.isTemporary || fileIt->second.expiresAt != entry.expiresAt) {
            continue;
        }

        removed.push_back(toSearchResult(fileIt->second));
        fileIt->second.isTemporary = false;
        fileIt->second.expiresAt = 0;
    }
    return removed;
}

std::vector<SearchResult> SearchEngine::getTemporaryFiles() {
    std::vector<SearchResult> tempFiles;
    for (const auto& item : files_) {
        if (item.second.isTemporary) {
            tempFiles.push_back(toSearchResult(item.second, 0));
        }
    }

    std::sort(tempFiles.begin(), tempFiles.end(), [](const SearchResult& left, const SearchResult& right) {
        return left.score < right.score;
    });
    return tempFiles;
}

Insights SearchEngine::getInsights() {
    return insights_;
}

std::string SearchEngine::previewFile(const std::string& path) {
    return readFileSnippet(path);
}

ScanSummary SearchEngine::rescanRoot() {
    if (rootPath_.empty()) return {};
    return scanFolder(rootPath_);
}

ScanSummary SearchEngine::renameFile(const std::string& path, const std::string& nextName) {
    if (path.empty() || nextName.empty()) return {};

    const std::string source = normalizePath(path);
    const std::string target = joinPath(parentPath(source), nextName);
    if (!MoveFileExA(source.c_str(), target.c_str(), MOVEFILE_REPLACE_EXISTING)) {
        throw std::runtime_error("Unable to rename file");
    }
    return rescanRoot();
}

ScanSummary SearchEngine::moveFile(const std::string& path, const std::string& nextParent) {
    if (path.empty() || nextParent.empty()) return {};

    const std::string source = normalizePath(path);
    const std::string targetDir = normalizePath(nextParent);
    if (!ensureDirectoryExists(targetDir)) {
        throw std::runtime_error("Unable to create target directory");
    }

    const std::string target = joinPath(targetDir, baseName(source));
    if (!MoveFileExA(source.c_str(), target.c_str(), MOVEFILE_REPLACE_EXISTING)) {
        throw std::runtime_error("Unable to move file");
    }
    return rescanRoot();
}

ScanSummary SearchEngine::deleteFile(const std::string& path) {
    if (path.empty()) return {};

    const std::string target = normalizePath(path);
    if (!DeleteFileA(target.c_str())) {
        throw std::runtime_error("Unable to delete file");
    }
    return rescanRoot();
}

std::vector<SearchResult> SearchEngine::restoreTemporary(const std::string& path) {
    const auto it = files_.find(path);
    if (it == files_.end()) return {};

    it->second.isTemporary = false;
    it->second.expiresAt = 0;
    return getTemporaryFiles();
}

std::vector<SearchResult> SearchEngine::extendTemporary(const std::string& path, long long ttlSeconds) {
    const auto it = files_.find(path);
    if (it == files_.end()) return {};

    const long long nextTtl = ttlSeconds > 0 ? ttlSeconds : 600;
    const long long now = currentEpochSeconds();
    it->second.isTemporary = true;
    it->second.expiresAt = now + nextTtl;
    tempHeap_.push({normalizePath(path), it->second.expiresAt});
    return getTemporaryFiles();
}

std::vector<SearchResult> SearchEngine::optimizeBackup(std::size_t capacityKb) {
    std::vector<const FileMetadata*> items;
    for (const auto& entry : files_) {
        // Only consider non-temporary files
        if (!entry.second.isTemporary) {
            items.push_back(&entry.second);
        }
    }

    if (items.empty() || capacityKb == 0) return {};

    // 0/1 Knapsack using Dynamic Programming
    // Weight: file size in KB
    // Value: isImportant ? 100 : 10
    int n = static_cast<int>(items.size());
    int W = static_cast<int>(capacityKb);

    // Using a 2D DP table: dp[n+1][W+1]
    // dp[i][w] = max value with i items and capacity w
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(W + 1, 0));

    for (int i = 1; i <= n; ++i) {
        const auto* item = items[i - 1];
        int weight = static_cast<int>(item->size / 1024);
        if (weight == 0 && item->size > 0) weight = 1; // Minimum 1KB weight
        int value = item->isImportant ? 100 : 10;

        for (int w = 0; w <= W; ++w) {
            if (weight <= w) {
                dp[i][w] = std::max(dp[i - 1][w], dp[i - 1][w - weight] + value);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    // Backtrack to find the selected items
    std::vector<SearchResult> results;
    int w = W;
    for (int i = n; i > 0 && w > 0; --i) {
        if (dp[i][w] != dp[i - 1][w]) {
            const auto* item = items[i - 1];
            results.push_back(toSearchResult(*item));
            
            int weight = static_cast<int>(item->size / 1024);
            if (weight == 0 && item->size > 0) weight = 1;
            w -= weight;
        }
    }

    return results;
}
