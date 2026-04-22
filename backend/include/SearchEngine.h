#pragma once

#include "Models.h"

#include <map>
#include <queue>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

class SearchEngine {
public:
    SearchEngine();

    ScanSummary scanFolder(const std::string& rootPath);
    std::vector<SearchResult> search(const std::string& query, std::size_t limit = 100);
    std::vector<std::string> autocomplete(const std::string& prefix, std::size_t limit = 8);
    std::vector<FileNode> getStructure();
    std::vector<std::string> relatedFiles(const std::string& path);
    std::vector<SearchResult> markTemporary(const std::string& path, long long ttlSeconds);
    std::vector<SearchResult> markImportant(const std::string& path, bool important);
    std::vector<SearchResult> deleteExpired();
    std::vector<SearchResult> getTemporaryFiles();
    Insights getInsights();
    std::string previewFile(const std::string& path);
    ScanSummary renameFile(const std::string& path, const std::string& nextName);
    ScanSummary moveFile(const std::string& path, const std::string& nextParent);
    ScanSummary deleteFile(const std::string& path);
    std::vector<SearchResult> restoreTemporary(const std::string& path);
    std::vector<SearchResult> extendTemporary(const std::string& path, long long ttlSeconds);
    std::vector<SearchResult> optimizeBackup(std::size_t capacityKb);

private:
    struct TrieNode {
        std::map<char, TrieNode*> children;
        bool terminal = false;
        std::vector<std::string> terms;
    };

    void clear();
    void dfsBuild(const std::string& path, FileNode& node);
    void addDocument(const FileMetadata& metadata);
    void tokenizeAndIndex(const FileMetadata& metadata);
    void trieInsert(const std::string& word);
    void trieCollect(TrieNode* node, std::vector<std::string>& output, std::size_t limit);
    TrieNode* trieWalk(const std::string& prefix);
    void collectInsights();
    std::string normalize(const std::string& value) const;
    std::string readFileSnippet(const std::string& path) const;
    SearchResult toSearchResult(const FileMetadata& metadata, std::size_t score = 0) const;
    void addGraphRelationship(const std::string& source, const std::string& target);
    ScanSummary rescanRoot();

    TrieNode* trieRoot_;
    std::string rootPath_;
    std::unordered_map<std::string, FileMetadata> files_;
    std::unordered_map<std::string, std::unordered_set<std::string>> invertedIndex_;
    std::unordered_map<std::string, std::unordered_set<std::string>> adjacency_;
    std::priority_queue<TempFileEntry, std::vector<TempFileEntry>, std::greater<TempFileEntry>> tempHeap_;
    std::vector<FileNode> structure_;
    Insights insights_;
    std::size_t folderCount_ = 0;
};
