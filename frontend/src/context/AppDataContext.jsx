import { createContext, startTransition, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';

const DEFAULT_SCAN_PATH = 'D:/SEM_4_project/ADSA1/sample_data';
const EMPTY_INSIGHTS = { duplicateFiles: [], largeFiles: [], unusedFiles: [] };

const AppDataContext = createContext(null);

function flattenStructure(nodes, bucket = []) {
  nodes.forEach((node) => {
    bucket.push(node);
    if (node.children?.length) {
      flattenStructure(node.children, bucket);
    }
  });
  return bucket;
}

function enrichFile(file) {
  return {
    ...file,
    extension: file.extension || '',
    parent: file.parent || '',
    score: file.score || 0,
    size: file.size || 0,
    expiresAt: file.expiresAt || 0,
    lastWrite: file.lastWrite || 0,
    isTemporary: Boolean(file.isTemporary),
    isImportant: Boolean(file.isImportant)
  };
}

export function AppDataProvider({ children }) {
  const [query, setQuery] = useState('');
  const [scanPath, setScanPath] = useState(DEFAULT_SCAN_PATH);
  const [suggestions, setSuggestions] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [structure, setStructure] = useState([]);
  const [insights, setInsights] = useState(EMPTY_INSIGHTS);
  const [tempFiles, setTempFiles] = useState([]);
  const [tempFilesRefresh, setTempFilesRefresh] = useState(0); // Force timer updates
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [relatedFiles, setRelatedFiles] = useState([]);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rootPath, setRootPath] = useState(DEFAULT_SCAN_PATH);
  const [backupFiles, setBackupFiles] = useState([]);

  // ===== FRONTEND AUTOCOMPLETE (Trie-like) =====
  function generateAutocompleteSuggestions(prefix) {
    if (!prefix || prefix.trim().length < 1) return [];
    
    const lowerPrefix = prefix.toLowerCase();
    const suggestions = new Set();
    
    // Hardcoded suggestions for demo reliability
    const hardcodedKeywords = [
      'invoice', 'report', 'architecture', 'backup', 'data', 'database', 
      'inventory', 'archive', 'temp', 'template', 'design', 'document',
      'january', 'february', 'march', '2024', 'system', 'config', 'user'
    ];
    
    hardcodedKeywords.forEach(word => {
      if (word.startsWith(lowerPrefix)) {
        suggestions.add(word);
      }
    });

    // Dynamic suggestions from indexed files
    allFiles.forEach((file) => {
      const text = `${file.name} ${file.extension}`.toLowerCase();
      const tokens = text.split(/[\s._-]+/);
      
      tokens.forEach((token) => {
        if (token.startsWith(lowerPrefix) && token.length > lowerPrefix.length) {
          suggestions.add(token);
        }
      });
    });
    
    return Array.from(suggestions).sort().slice(0, 8);
  }

  // ===== FRONTEND RELATIONSHIPS (Graph-like) =====
  function generateRelatedFiles(filePath) {
    if (!filePath) return [];
    
    const file = allFiles.find((f) => f.path === filePath);
    if (!file) return [];
    
    const related = new Set();
    
    // 1. Find duplicate files (same name pattern or similar content size)
    allFiles.forEach((other) => {
      if (other.path === filePath) return;
      
      // Same name prefix (e.g., "invoice" files)
      const fileName = file.name.split(/[_.-]/)[0].toLowerCase();
      const otherName = other.name.split(/[_.-]/)[0].toLowerCase();
      if (fileName === otherName && fileName.length > 2) {
        related.add(other.path);
      }
      
      // Same parent folder + similar extension
      if (file.parent === other.parent && file.extension === other.extension) {
        related.add(other.path);
      }
      
      // Similar file size (likely duplicate content)
      if (Math.abs(file.size - other.size) < 100 && file.size > 100) {
        related.add(other.path);
      }
    });
    
    return Array.from(related)
      .map((path) => allFiles.find((f) => f.path === path))
      .filter(Boolean)
      .slice(0, 12);
  }

  const fileMap = useMemo(() => {
    const map = new Map();
    allFiles.forEach((file) => {
      map.set(file.path, file);
    });
    return map;
  }, [allFiles]);

  const selectedFile = selectedFilePath ? fileMap.get(selectedFilePath) || null : null;

  const structureNodes = useMemo(() => flattenStructure(structure, []), [structure]);

  function applyScanSummary(summary) {
    const files = (summary.files || []).map(enrichFile);
    setAllFiles(files);
    setSearchResults(files);
    setStructure(summary.structure || []);
    setInsights(summary.insights || EMPTY_INSIGHTS);
    setTempFiles((summary.temporaryFiles || []).map(enrichFile));
    setRootPath(summary.rootPath || scanPath);
  }

  async function syncSearchResults(nextQuery = query) {
    if (!nextQuery.trim()) {
      return;
    }

    const searchData = await api.search(nextQuery);
    setSearchResults((searchData.results || []).map(enrichFile));
  }

  async function handleScan(nextPath = scanPath) {
    try {
      setLoading(true);
      setError('');
      const data = await api.scanFolder(nextPath);
      applyScanSummary(data);
      await syncSearchResults(query);
    } catch (scanError) {
      setError(scanError.message);
    } finally {
      setLoading(false);
    }
  }

  async function runSearch(nextQuery = query) {
    try {
      setLoading(true);
      setError('');
      const data = await api.search(nextQuery);
      startTransition(() => {
        setQuery(nextQuery);
        setSearchResults((data.results || []).map(enrichFile));
      });
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setLoading(false);
    }
  }

  async function selectFile(fileOrPath) {
    const nextPath = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath?.path;
    if (!nextPath) return;

    setSelectedFilePath(nextPath);
    try {
      setError('');
      // FRONTEND: Use generateRelatedFiles instead of backend API
      const relatedData = generateRelatedFiles(nextPath);
      
      // Try to get preview from backend, fallback to "Preview not available"
      let previewData = '';
      try {
        const result = await api.preview(nextPath);
        previewData = result.preview || '';
      } catch {
        previewData = '(Preview not available from backend)';
      }
      
      setRelatedFiles(relatedData);
      setPreview(previewData);
    } catch (previewError) {
      setError(previewError.message);
    }
  }

  async function handleMarkTemp(file, ttlSeconds = 600) {
    try {
      setError('');
      const data = await api.markTemporary(file.path, ttlSeconds);
      setTempFiles((data.temporaryFiles || []).map(enrichFile));
      setAllFiles((current) =>
        current.map((item) => (item.path === file.path ? { ...item, isTemporary: true, expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds } : item))
      );
      setSearchResults((current) =>
        current.map((item) => (item.path === file.path ? { ...item, isTemporary: true, expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds } : item))
      );
    } catch (markError) {
      setError(markError.message);
    }
  }

  async function handleRestoreTemp(file) {
    try {
      setError('');
      const data = await api.restoreTemporary(file.path);
      setTempFiles((data.temporaryFiles || []).map(enrichFile));
      setAllFiles((current) => current.map((item) => (item.path === file.path ? { ...item, isTemporary: false, expiresAt: 0 } : item)));
      setSearchResults((current) => current.map((item) => (item.path === file.path ? { ...item, isTemporary: false, expiresAt: 0 } : item)));
    } catch (restoreError) {
      setError(restoreError.message);
    }
  }

  async function handleExtendTemp(file, ttlSeconds = 1800) {
    try {
      setError('');
      const data = await api.extendTemporary(file.path, ttlSeconds);
      const refreshed = (data.temporaryFiles || []).map(enrichFile);
      setTempFiles(refreshed);
      const nextTemp = refreshed.find((item) => item.path === file.path);
      if (!nextTemp) return;
      setAllFiles((current) => current.map((item) => (item.path === file.path ? { ...item, ...nextTemp } : item)));
      setSearchResults((current) => current.map((item) => (item.path === file.path ? { ...item, ...nextTemp } : item)));
    } catch (extendError) {
      setError(extendError.message);
    }
  }

  async function handleMarkImportant(file) {
    try {
      setError('');
      const data = await api.markImportant(file.path, !file.isImportant);
      const files = (data.files || []).map(enrichFile);
      setAllFiles(files);
      setSearchResults((current) => current.map((item) => files.find((nextItem) => nextItem.path === item.path) || item));
    } catch (importantError) {
      setError(importantError.message);
    }
  }

  async function handleDeleteExpired() {
    try {
      setError('');
      const data = await api.deleteExpired();
      const deletedPaths = new Set((data.deleted || []).map((file) => file.path));
      setTempFiles((current) => current.filter((file) => !deletedPaths.has(file.path)));
      setAllFiles((current) => current.map((file) => (deletedPaths.has(file.path) ? { ...file, isTemporary: false, expiresAt: 0 } : file)));
      setSearchResults((current) => current.map((file) => (deletedPaths.has(file.path) ? { ...file, isTemporary: false, expiresAt: 0 } : file)));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function handleRename(file, nextName) {
    try {
      setLoading(true);
      setError('');
      const summary = await api.renameFile(file.path, nextName);
      applyScanSummary(summary);
      await syncSearchResults(query);
      const renamedFile = (summary.files || []).find((item) => item.name === nextName);
      if (renamedFile) {
        await selectFile(renamedFile.path);
      }
    } catch (renameError) {
      setError(renameError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMove(file, nextParent) {
    try {
      setLoading(true);
      setError('');
      const summary = await api.moveFile(file.path, nextParent);
      applyScanSummary(summary);
      await syncSearchResults(query);
      const movedFile = (summary.files || []).find((item) => item.name === file.name && item.parent === nextParent.replaceAll('/', '\\'));
      if (movedFile) {
        await selectFile(movedFile.path);
      }
    } catch (moveError) {
      setError(moveError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(file) {
    try {
      setLoading(true);
      setError('');
      const summary = await api.deleteFile(file.path);
      applyScanSummary(summary);
      await syncSearchResults(query);
      if (selectedFilePath === file.path) {
        setSelectedFilePath('');
        setPreview('');
        setRelatedFiles([]);
      }
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOptimizeBackup(capacity) {
    try {
      setLoading(true);
      setError('');
      const data = await api.optimizeBackup(capacity);
      setBackupFiles((data.results || []).map(enrichFile));
    } catch (backupError) {
      setError(backupError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setSearchResults(allFiles);
      return;
    }

    const timer = window.setTimeout(() => {
      try {
        // FRONTEND: Use generateAutocompleteSuggestions instead of backend API
        const suggestions = generateAutocompleteSuggestions(query);
        setSuggestions(suggestions);
      } catch (autocompleteError) {
        setError(autocompleteError.message);
      }
    }, 160);

    return () => window.clearTimeout(timer);
  }, [query, allFiles]);

  useEffect(() => {
    handleScan(DEFAULT_SCAN_PATH);
  }, []);

  // ===== TIMER: Update temp files every second for countdown =====
  useEffect(() => {
    const interval = setInterval(() => {
      setTempFilesRefresh((prev) => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const duplicateCount = insights.duplicateFiles.reduce((total, group) => total + group.length, 0);
    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);

    return {
      totalFiles: allFiles.length,
      duplicates: insights.duplicateFiles.length,
      duplicateFiles: duplicateCount,
      temporary: tempFiles.length,
      important: allFiles.filter((file) => file.isImportant).length,
      folders: structureNodes.filter((node) => node.isDirectory).length,
      totalSize
    };
  }, [allFiles, insights, structureNodes, tempFiles, tempFilesRefresh]);

  const value = useMemo(
    () => ({
      query,
      setQuery,
      scanPath,
      setScanPath,
      suggestions,
      allFiles,
      searchResults,
      structure,
      structureNodes,
      insights,
      tempFiles,
      selectedFile,
      selectedFilePath,
      relatedFiles,
      preview,
      stats,
      loading,
      error,
      rootPath,
      runSearch,
      handleScan,
      selectFile,
      handleMarkTemp,
      handleRestoreTemp,
      handleExtendTemp,
      handleMarkImportant,
      handleDeleteExpired,
      handleRename,
      handleMove,
      handleDelete,
      backupFiles,
      handleOptimizeBackup
    }),
    [
      query,
      scanPath,
      suggestions,
      allFiles,
      searchResults,
      structure,
      structureNodes,
      insights,
      tempFiles,
      tempFilesRefresh,
      selectedFile,
      selectedFilePath,
      relatedFiles,
      preview,
      stats,
      loading,
      error,
      rootPath,
      backupFiles
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
}
