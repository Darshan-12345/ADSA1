#pragma once

#include <ctime>
#include <string>
#include <vector>

struct SearchResult {
    std::string path;
    std::string name;
    std::string extension;
    std::string parent;
    std::size_t score = 0;
    std::size_t size = 0;
    bool isTemporary = false;
    bool isImportant = false;
    long long expiresAt = 0;
    long long lastWrite = 0;
};

struct FileNode {
    std::string path;
    std::string name;
    bool isDirectory = false;
    std::size_t size = 0;
    std::vector<FileNode> children;
};

struct TempFileEntry {
    std::string path;
    long long expiresAt = 0;

    bool operator>(const TempFileEntry& other) const {
        return expiresAt > other.expiresAt;
    }
};

struct FileMetadata {
    std::string path;
    std::string name;
    std::string extension;
    std::string parent;
    std::string content;
    std::size_t size = 0;
    bool isTemporary = false;
    bool isImportant = false;
    long long expiresAt = 0;
    std::time_t lastWrite = 0;
};

struct Insights {
    std::vector<std::vector<std::string>> duplicateFiles;
    std::vector<std::string> largeFiles;
    std::vector<std::string> unusedFiles;
};

struct ScanSummary {
    std::string rootPath;
    std::size_t indexedFiles = 0;
    std::size_t indexedFolders = 0;
    bool indexing = false;
    std::vector<SearchResult> files;
    Insights insights;
    std::vector<FileNode> structure;
    std::vector<SearchResult> temporaryFiles;
};
