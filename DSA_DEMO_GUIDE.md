# AetherDocs - DSA Demonstration Guide

## Project Overview - Data Structures & Algorithms Focus

This project demonstrates **5 core DSA concepts**:

1. **Trie** (Prefix Tree) - Autocomplete
2. **Inverted Index** (Hash Map + Set) - Full-text Search
3. **Adjacency List** (Graph) - File Relationships
4. **Min-Heap** (Priority Queue) - Temporary File Expiration
5. **Depth-First Search (DFS)** - Directory Tree Traversal

---

## Part 1: TRIE - Autocomplete Feature

### What is a Trie?
A **Trie (Prefix Tree)** is a tree-like data structure where each node represents a character. It's optimal for:
- Fast prefix matching: **O(m)** where m = prefix length
- Autocomplete suggestions
- Dictionary validation

### How It Works in This Project

```
When user types: "inv"

Trie Structure:
                root
               / | \ ...
              i  a  d
              |
              n
              |
              v (terminal)
              |
           ├─ o (invoice)
           ├─ e (inverted)
           └─ a (invalid)
```

### Code Implementation

**File:** `backend/src/SearchEngine.cpp`

```cpp
// Trie Node Structure
struct TrieNode {
    std::map<char, TrieNode*> children;  // Maps char -> next node
    bool terminal = false;                // Is this end of word?
    std::vector<std::string> terms;       // Suggestions (up to 10)
};

// INSERT: Add word to trie
void SearchEngine::trieInsert(const std::string& word) {
    TrieNode* cursor = trieRoot_;
    for (char raw : word) {
        const char ch = std::tolower(raw);
        // If path doesn't exist, create new node
        if (!cursor->children.count(ch)) {
            cursor->children[ch] = new TrieNode();
        }
        cursor = cursor->children[ch];
        // Store up to 10 suggestions at each node
        if (cursor->terms.size() < 10) {
            cursor->terms.push_back(word);
        }
    }
    cursor->terminal = true;  // Mark as word ending
}

// SEARCH: Find suggestions for prefix
SearchEngine::TrieNode* SearchEngine::trieWalk(const std::string& prefix) {
    TrieNode* cursor = trieRoot_;
    for (char raw : prefix) {
        const char ch = std::tolower(raw);
        // Walk down the trie
        if (!cursor->children.count(ch)) {
            return nullptr;  // Prefix not found
        }
        cursor = cursor->children[ch];
    }
    return cursor;  // Return node at end of prefix
}

// COLLECT: Get all suggestions from a node
void SearchEngine::trieCollect(TrieNode* node, 
                               std::vector<std::string>& output, 
                               std::size_t limit) {
    if (!node || output.size() >= limit) return;
    
    // Add terms stored at this node
    for (const auto& term : node->terms) {
        if (std::find(output.begin(), output.end(), term) == output.end()) {
            output.push_back(term);
            if (output.size() >= limit) return;
        }
    }
    
    // Recursively collect from child nodes
    for (const auto& entry : node->children) {
        trieCollect(entry.second, output, limit);
        if (output.size() >= limit) return;
    }
}
```

### Complexity Analysis

| Operation | Time | Space |
|-----------|------|-------|
| Insert word | O(m) | O(m) where m = word length |
| Search prefix | O(m) | O(1) |
| Get suggestions | O(n) | O(8) (max 8 suggestions) |
| **Total Space** | - | **O(alphabet_size × total_chars)** |

### Live Demo

**When you type in search bar:**
- Type `"inv"` → Suggestions: `invoice`, `inventory`, `investigation`
- Type `"rep"` → Suggestions: `report`, `repository`
- Type `"arch"` → Suggestions: `architecture`, `archive`

---

## Part 2: INVERTED INDEX - Full-Text Search

### What is an Inverted Index?
An **Inverted Index** maps terms → documents containing them.

```
Regular Index:        Inverted Index:
Document → Terms      Term → Documents

doc1.txt:             invoice → {doc1.txt, doc2.txt, doc3.txt}
  "invoice 2024"      report → {doc5.txt, doc6.txt}
                      2024 → {doc1.txt, doc2.txt, doc3.txt, doc7.txt}
doc2.txt:
  "invoice payment"
```

### Benefits
- **O(1)** lookup for all files containing a term
- **O(k)** where k = number of results
- Industry standard (used by Google, Elasticsearch)

### Code Implementation

```cpp
// Data Structure
std::unordered_map<std::string, std::unordered_set<std::string>> invertedIndex_;
//                    ↑ term                  ↑ set of file paths

// BUILD INDEX: Tokenize file and add to inverted index
void SearchEngine::tokenizeAndIndex(const FileMetadata& metadata) {
    // Normalize and tokenize file name + content
    std::stringstream stream(normalize(metadata.name + " " + 
                                       metadata.extension + " " + 
                                       metadata.content));
    std::string token;
    std::unordered_set<std::string> uniqueTerms;
    
    while (stream >> token) {
        if (token.size() < 2) continue;  // Skip single chars
        uniqueTerms.insert(token);       // Deduplicate
    }
    
    // Add each term to inverted index
    for (const auto& tokenValue : uniqueTerms) {
        invertedIndex_[tokenValue].insert(metadata.path);
        trieInsert(tokenValue);  // Also add to trie
    }
}

// SEARCH: Find files matching query
std::vector<SearchResult> SearchEngine::search(const std::string& query, 
                                               std::size_t limit) {
    std::string normalizedQuery = normalize(query);
    std::unordered_map<std::string, std::size_t> scoreMap;
    
    // Tokenize query
    std::stringstream stream(normalizedQuery);
    std::string token;
    while (stream >> token) {
        if (token.size() < 2) continue;
        
        // For each query term, find files and increase score
        if (invertedIndex_.count(token)) {
            for (const auto& filePath : invertedIndex_[token]) {
                scoreMap[filePath]++;  // Increment score
            }
        }
    }
    
    // Convert to SearchResult vector and sort by score
    std::vector<SearchResult> results;
    for (const auto& [path, score] : scoreMap) {
        auto result = toSearchResult(files_[path], score);
        results.push_back(result);
    }
    
    // Sort by relevance score (highest first)
    std::sort(results.begin(), results.end(), 
              [](const SearchResult& a, const SearchResult& b) {
                  return a.score > b.score;
              });
    
    results.resize(std::min(results.size(), limit));
    return results;
}
```

### Complexity Analysis

| Operation | Time | Space |
|-----------|------|-------|
| Index file | O(w) | O(w) where w = word count |
| Search query | O(q×k) | O(k) where q = query terms, k = results |
| **Total Space** | - | **O(total_unique_terms × avg_docs_per_term)** |

### Live Demo

**Search Examples:**
```
Query: "invoice"     → Files: invoice_jan_2024.txt, invoice_feb_2024.txt, etc.
Query: "report"      → Files: monthly_report_jan.txt, quarterly_report_q1.txt, etc.
Query: "2024"        → Files: All files with "2024" in name/content
Query: "architecture" → Files: architecture_design.txt, app_architecture.txt, etc.
```

---

## Part 3: ADJACENCY LIST - File Relationships (Graph)

### What is an Adjacency List? 
A **Graph** data structure that represents connections between files.

```
Adjacency List:
invoice_jan_2024.txt    → {duplicate_invoice_jan.txt, backup_invoice_jan.txt}
duplicate_invoice_jan.txt → {invoice_jan_2024.txt, backup_invoice_jan.txt}
backup_invoice_jan.txt   → {invoice_jan_2024.txt, duplicate_invoice_jan.txt}
                ↑
         (Bidirectional edges)
```

### Benefits
- Efficient neighbor lookup: **O(1)** average case
- Space-efficient: **O(V + E)** where V = files, E = relationships

### Code Implementation

```cpp
// Data Structure: Bidirectional graph
std::unordered_map<std::string, std::unordered_set<std::string>> adjacency_;
//                    ↑ source file              ↑ connected files

// ADD RELATIONSHIP: Connect two files
void SearchEngine::addGraphRelationship(const std::string& source, 
                                        const std::string& target) {
    if (source == target || source.empty() || target.empty()) return;
    
    // Bidirectional edge
    adjacency_[source].insert(target);
    adjacency_[target].insert(source);
}

// GET RELATED FILES: Find connected files
std::vector<std::string> SearchEngine::relatedFiles(const std::string& path) {
    std::vector<std::string> result;
    
    if (adjacency_.count(path)) {
        for (const auto& related : adjacency_[path]) {
            result.push_back(related);
        }
    }
    
    return result;
}
```

### Complexity Analysis

| Operation | Time | Space |
|-----------|------|-------|
| Add edge | O(1) average | O(1) |
| Find neighbors | O(degree) | O(degree) |
| **Total Space** | - | **O(V + E)** |

### Live Demo

**File Relationships:**
```
Click on: invoice_jan_2024.txt
Related Files Found:
  - duplicate_invoice_jan.txt (duplicate name)
  - backup_invoice_jan.txt (same content hash)

Click on: architecture_design.txt
Related Files Found:
  - app_architecture.txt (similar content)
  - desktop_architecture.txt (similar content)
```

---

## Part 4: MIN-HEAP - Temporary File Expiration

### What is a Min-Heap?
A **Min-Heap** is a binary tree where parent ≤ children. Perfect for priority queues.

```
Min-Heap (sorted by expiration time):
              (expires: 10:00)
             /            \
        (10:15)        (10:20)
        /     \         /     \
    (10:30) (10:35) (10:45) (10:50)

When we pop, we always get the file expiring SOONEST (top)
```

### Benefits
- Extract min (earliest expiry): **O(1)**
- Insert new file: **O(log n)**
- Delete expired files efficiently: **O(k log n)**

### Code Implementation

```cpp
// Data Structure: Min-Heap priority queue
std::priority_queue<TempFileEntry, 
                    std::vector<TempFileEntry>, 
                    std::greater<TempFileEntry>> tempHeap_;
//                       ↑ Min-heap comparator

// Heap Entry Structure
struct TempFileEntry {
    std::string path;
    long long expiresAt = 0;  // Unix timestamp
    
    bool operator>(const TempFileEntry& other) const {
        return expiresAt > other.expiresAt;  // Min-heap: smaller = higher priority
    }
};

// MARK TEMPORARY: Add file to heap with expiration
std::vector<SearchResult> SearchEngine::markTemporary(const std::string& path, 
                                                      long long ttlSeconds) {
    long long expiresAt = currentEpochSeconds() + ttlSeconds;
    
    files_[path].isTemporary = true;
    files_[path].expiresAt = expiresAt;
    
    // Insert into min-heap: O(log n)
    tempHeap_.push({path, expiresAt});
    
    // Return updated files
    return getTemporaryFiles();
}

// DELETE EXPIRED: Remove all expired files (lazy deletion)
std::vector<SearchResult> SearchEngine::deleteExpired() {
    long long now = currentEpochSeconds();
    
    // Pop from heap while top is expired: O(k log n)
    while (!tempHeap_.empty() && tempHeap_.top().expiresAt <= now) {
        const auto& entry = tempHeap_.top();
        
        if (files_.count(entry.path)) {
            files_[entry.path].isTemporary = false;
            files_[entry.path].expiresAt = 0;
        }
        
        tempHeap_.pop();
    }
    
    return getTemporaryFiles();
}
```

### Complexity Analysis

| Operation | Time | Space |
|-----------|------|-------|
| Mark as temporary | O(log n) | O(1) |
| Delete expired | O(k log n) | O(1) where k = expired files |
| **Total Space** | - | **O(n)** |

### Live Demo

**Mark file as temporary:**
```
Action: Mark "temp_download.tmp" with TTL = 3600 seconds (1 hour)
  → File appears in TEMPORARY page with countdown timer
  → Timer counts down: 59m 59s → 59m 58s → ...
  → After 1 hour: File auto-removes from list
```

---

## Part 5: DFS - Directory Tree Traversal

### What is DFS?
**Depth-First Search** recursively explores a tree from root to leaves.

```
Directory Tree:

sample_data/
├── documents/
│   ├── invoices/
│   │   ├── invoice_jan_2024.txt    ← Leaf
│   │   ├── invoice_feb_2024.txt    ← Leaf
│   │   └── invoice_march_2024.txt  ← Leaf
│   ├── reports/
│   └── archived/
├── projects/
│   ├── web_app/
│   ├── mobile_app/
│   └── desktop_app/
└── temp/

DFS Traversal Order:
sample_data → documents → invoices → invoice_jan_2024.txt 
           → invoice_feb_2024.txt 
           → invoice_march_2024.txt
           → ... (continue to next branch)
```

### Benefits
- Space efficient: **O(h)** stack space where h = tree height
- Suitable for building complete directory tree

### Code Implementation

```cpp
// RECURSIVE DFS: Build file tree structure
void SearchEngine::dfsBuild(const std::string& path, FileNode& node) {
    std::vector<std::pair<std::string, WIN32_FIND_DATAA>> entries;
    WIN32_FIND_DATAA data;
    
    // Open directory
    HANDLE handle = FindFirstFileA(joinPath(path, "*").c_str(), &data);
    if (handle == INVALID_HANDLE_VALUE) return;
    
    // Read all entries in current directory
    do {
        const std::string name = data.cFileName;
        if (name == "." || name == "..") continue;
        
        entries.push_back({name, data});
    } while (FindNextFileA(handle, &data));
    
    FindClose(handle);
    
    // Sort entries (directories first, then files)
    std::sort(entries.begin(), entries.end(),
              [](const auto& a, const auto& b) {
                  return isDirectory(a.second) > isDirectory(b.second);
              });
    
    // Recursively process each entry
    for (const auto& [name, data] : entries) {
        FileNode child;
        child.name = name;
        child.path = joinPath(path, name);
        child.isDirectory = isDirectory(data);
        child.size = fileSize(data);
        
        // Recursive call: DFS into subdirectory
        if (child.isDirectory) {
            dfsBuild(child.path, child);  // ← RECURSION (DFS)
            folderCount_++;
        } else {
            // Add file metadata
            FileMetadata metadata;
            metadata.path = child.path;
            metadata.name = child.name;
            metadata.extension = extensionOf(child.path);
            metadata.parent = path;
            metadata.size = child.size;
            metadata.content = readFileSnippet(child.path);
            metadata.lastWrite = fileTimeToEpoch(data.ftLastWriteTime);
            
            addDocument(metadata);
        }
        
        node.children.push_back(child);
    }
}
```

### Complexity Analysis

| Operation | Time | Space |
|-----------|------|-------|
| DFS traversal | O(V + E) | O(h) where h = height |
| Build full tree | O(n) | O(n) where n = total files |
| **Total Space** | - | **O(height of tree)** |

### Live Demo

**Structure page visualization:**
```
Click on sample_data folder tree:
  ✓ Expands to show documents/, projects/, temp/, backups/
  ✓ Click documents → shows invoices/, reports/, archived/
  ✓ Click invoices → shows invoice_jan_2024.txt, invoice_feb_2024.txt, etc.
  
Complete tree structure visible showing all 50+ files organized hierarchically
```

---

## Part 6: Advanced Features - Insights

### DUPLICATE DETECTION (Set Intersection)
```
Step 1: Hash all files by content
  invoice_jan_2024.txt     → hash: 0xABC123
  duplicate_invoice_jan.txt → hash: 0xABC123  ← MATCH!

Step 2: Group by hash
  duplicates = {
    {invoice_jan_2024.txt, duplicate_invoice_jan.txt, backup_invoice_jan.txt}
  }

Time: O(n × file_size)
Space: O(n)
```

### LARGE FILES DETECTION
```
Step 1: Scan all files, track size
Step 2: Sort by size descending
Step 3: Return top K (default: K=10)

Time: O(n log n) sorting
Space: O(n)
```

---

## Complete Feature Checklist

Run this sequence to demonstrate all DSA concepts:

### 1. Start Backend
```powershell
cd d:\SEM_4_project\ADSA1\backend
g++ -std=c++17 -Iinclude src/main.cpp src/SearchEngine.cpp -lws2_32 -o smart_document_server.exe
.\smart_document_server.exe
```

### 2. Start Frontend
```powershell
cd d:\SEM_4_project\ADSA1\frontend
npm install
npm run dev
```

### 3. Navigate to http://localhost:5173 and test:

#### TRIE (Autocomplete)
- [ ] Type `"inv"` in search → see suggestions
- [ ] Type `"rep"` in search → see suggestions
- [ ] Type `"arch"` in search → see suggestions

#### INVERTED INDEX (Search)
- [ ] Search `"invoice"` → 6 results with relevance scores
- [ ] Search `"report"` → 5 results
- [ ] Search `"architecture"` → 3 results

#### ADJACENCY LIST (Relationships)
- [ ] Go to Relationships page
- [ ] View file connection graph
- [ ] See related files linked together

#### MIN-HEAP (Temporary Files)
- [ ] Go to Temporary Files page
- [ ] Mark a file with 10-second TTL
- [ ] Watch timer count down
- [ ] File auto-expires after TTL

#### DFS (Structure)
- [ ] Go to Structure page
- [ ] See full hierarchical directory tree
- [ ] Click expand/collapse folders
- [ ] Verify all 50+ files listed correctly

#### INSIGHTS
- [ ] Go to Insights page
- [ ] View 3 duplicate files detected
- [ ] View large files (>100KB)
- [ ] View unused files in archive/

---

## Key Algorithms & Complexities Summary

| Feature | Algorithm | Time | Space |
|---------|-----------|------|-------|
| Autocomplete | Trie + DFS | O(m+n) | O(alphabet×chars) |
| Search | Inverted Index + Sorting | O(q×k + k log k) | O(q×k) |
| Relationships | Graph Traversal | O(V+E) | O(V+E) |
| Temp Expiry | Min-Heap | O(log n) insert, O(k log n) delete | O(n) |
| Structure | DFS | O(n) | O(height) |
| Duplicates | Hash + Sorting | O(n) | O(n) |
| Large Files | Tracking + Sort | O(n log n) | O(n) |

---

## Presentation Talking Points

1. **Why Trie for Autocomplete?**
   - Character-by-character matching is fast
   - Prefix sharing reduces memory
   - Better than binary search on dictionary

2. **Why Inverted Index for Search?**
   - Instant lookup: O(1) for any term
   - Industry standard (Google, Elasticsearch)
   - Scales to billions of documents

3. **Why Adjacency List for Graphs?**
   - Memory efficient: O(V+E)
   - Fast neighbor lookup
   - Ideal for sparse graphs

4. **Why Min-Heap for Expiration?**
   - Always know soonest-expiring file
   - Efficient background cleanup
   - Used by OS schedulers, garbage collectors

5. **Why DFS for Directory Traversal?**
   - Low memory footprint: O(height)
   - Natural recursive structure of file systems
   - Complete tree construction

---

## Testing Commands

### Test via API (if you want curl/Postman testing):

```bash
# 1. Scan folder
curl http://localhost:18080/scan -X POST -H "Content-Type: application/json" -d "{\"path\":\"d:\\SEM_4_project\\ADSA1\\sample_data\"}"

# 2. Search (Inverted Index)
curl "http://localhost:18080/search?query=invoice"

# 3. Autocomplete (Trie)
curl "http://localhost:18080/autocomplete?prefix=inv"

# 4. Structure (DFS)
curl http://localhost:18080/structure

# 5. Related Files (Graph)
curl "http://localhost:18080/related?path=d:\\SEM_4_project\\ADSA1\\sample_data\\documents\\invoices\\invoice_jan_2024.txt"

# 6. Insights (Duplicate Detection)
curl http://localhost:18080/insights

# 7. Temporary Files (Min-Heap)
curl http://localhost:18080/temp/list
```

---

## Conclusion

This project is a **complete DSA masterclass** demonstrating:
- ✅ Advanced tree structures (Trie)
- ✅ Hash-based indexing (Inverted Index)
- ✅ Graph data structures (Adjacency List)
- ✅ Priority queues (Min-Heap)
- ✅ Graph algorithms (DFS)
- ✅ Sorting & searching (Multiple patterns)

**Perfect for semester 4 ADSA evaluation!**
