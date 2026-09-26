'use client';
import { useState, useEffect } from 'react';
import { Upload, FileText, Eye, Download, Trash2, ChevronRight, Folder, ArrowLeft, FolderOutput, CheckSquare, X } from 'lucide-react';
import { handleDeleteSelectedFiles, handleMoveSelectedFiles } from '../lib/fileActions';

export default function FileViewer({
  selectedCategory,
  userProfile,
  uploading,
  files,
  categories,
  onFileUpload,
  onDeleteFile,
  onDownloadFile,
  previewFile,
  previewType,
  textContent,
  onOpenPreview,
  onClosePreview,
  onSelectCategory,
  refreshFiles,
  setFiles
}) {
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [targetMoveCategoryId, setTargetMoveCategoryId] = useState('');

  useEffect(() => {
    setSelectedFileIds([]);
    setTargetMoveCategoryId('');
  }, [selectedCategory]);

  const getCategoryPath = () => {
    if (!selectedCategory) return [];
    const path = [];
    let current = selectedCategory;

    while (current) {
      path.unshift(current);
      current = categories.find((c) => c.id === current.parent_id);
    }
    return path;
  };

  const categoryPath = getCategoryPath();

  const handleGoToParent = () => {
    if (!selectedCategory) return;
    if (!selectedCategory.parent_id) {
      onSelectCategory(null);
    } else {
      const parentCat = categories.find((c) => c.id === selectedCategory.parent_id);
      onSelectCategory(parentCat || null);
    }
  };

  const subFolders = categories.filter(
    (c) => c.parent_id === (selectedCategory ? selectedCategory.id : null)
  );

  const getRootCategoryName = (cat) => {
    if (!cat.parent_id) return null;
    let current = cat;
    while (current.parent_id) {
      const parent = categories.find((c) => c.id === current.parent_id);
      if (!parent) break;
      current = parent;
    }
    return current.name;
  };

  const availableMoveCategories = categories.filter(
    (c) => c.id !== selectedCategory?.id
  );

  const handleSelectAll = () => {
    if (selectedFileIds.length === files.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(files.map((f) => f.id));
    }
  };

  const handleToggleFileSelect = (fileId) => {
    if (selectedFileIds.includes(fileId)) {
      setSelectedFileIds(selectedFileIds.filter((id) => id !== fileId));
    } else {
      setSelectedFileIds([...selectedFileIds, fileId]);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      {/* 경로 (Breadcrumb) */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 overflow-x-auto whitespace-nowrap py-1">
        <span
          className={`cursor-pointer hover:underline ${
            selectedCategory === null ? 'font-bold text-gray-800' : 'text-indigo-600 font-medium'
          }`}
          onClick={() => onSelectCategory(null)}
        >
          Home
        </span>
        {categoryPath.map((cat, index) => {
          const isLast = index === categoryPath.length - 1;
          return (
            <div key={cat.id} className="flex items-center gap-1.5">
              <ChevronRight size={14} className="text-gray-400" />
              <span
                onClick={() => !isLast && onSelectCategory(cat)}
                className={`${
                  isLast
                    ? 'font-bold text-gray-900 cursor-default'
                    : 'text-indigo-600 font-medium cursor-pointer hover:underline'
                }`}
              >
                {cat.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* 헤더 및 타이틀 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">
          {selectedCategory ? selectedCategory.name : 'Home'}
        </h1>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedCategory && (
            <button
              onClick={handleGoToParent}
              className="flex items-center justify-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition"
              title="상위 폴더로 이동"
            >
              <ArrowLeft size={16} />
              <span>상위 폴더</span>
            </button>
          )}

          {userProfile?.role === 'admin' && (
            <label className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition flex-1 sm:flex-none">
              <Upload size={16} />
              <span>{uploading ? '업로드 중...' : '파일 업로드'}</span>
              <input
                type="file"
                multiple
                onChange={onFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </div>

      {/* 다중 선택 액션 바 */}
      {userProfile?.role === 'admin' && selectedFileIds.length > 0 && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-indigo-900 text-sm font-semibold">
            <CheckSquare className="text-indigo-600" size={18} />
            <span>{selectedFileIds.length}개 파일 선택됨</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={targetMoveCategoryId}
              onChange={(e) => setTargetMoveCategoryId(e.target.value)}
              className="text-xs border rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">이동할 폴더 선택...</option>
              {availableMoveCategories.map((cat) => {
                const rootName = getRootCategoryName(cat);
                return (
                  <option key={cat.id} value={cat.id}>
                    📁 {cat.name} {rootName ? `(${rootName})` : ''}
                  </option>
                );
              })}
            </select>

            <button
              onClick={() =>
                handleMoveSelectedFiles(
                  selectedFileIds,
                  targetMoveCategoryId,
                  selectedCategory?.id,
                  refreshFiles,
                  setSelectedFileIds,
                  userProfile
                )
              }
              disabled={!targetMoveCategoryId}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-3 py-1.5 rounded text-xs font-medium transition"
            >
              <FolderOutput size={14} />
              <span>선택 이동</span>
            </button>

            <button
              onClick={() =>
                handleDeleteSelectedFiles(
                  selectedFileIds,
                  files,
                  setFiles,
                  setSelectedFileIds,
                  userProfile
                )
              }
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium transition"
            >
              <Trash2 size={14} />
              <span>선택 삭제</span>
            </button>
          </div>
        </div>
      )}

      {/* 하위 폴더 목록 */}
      {subFolders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            폴더 목록
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {subFolders.map((sub) => (
              <div
                key={sub.id}
                onClick={() => onSelectCategory(sub)}
                className="flex items-center p-3 bg-white border rounded-lg shadow-sm hover:shadow-md cursor-pointer text-sm font-medium text-gray-700 gap-2 transition"
              >
                <Folder className="text-amber-500 flex-shrink-0" size={18} />
                <span className="truncate">{sub.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 전체 선택 체크박스 */}
      {files.length > 0 && userProfile?.role === 'admin' && (
        <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-800">
            <input
              type="checkbox"
              checked={selectedFileIds.length === files.length && files.length > 0}
              onChange={handleSelectAll}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>전체 선택 ({files.length})</span>
          </label>
        </div>
      )}

      {/* 파일 카드 목록 */}
      {files.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg text-sm">
          등록된 파일이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => {
            const isSelected = selectedFileIds.includes(file.id);
            return (
              <div
                key={file.id}
                className={`bg-white p-4 rounded-lg border shadow-sm flex flex-col justify-between hover:shadow-md transition relative ${
                  isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/20' : ''
                }`}
              >
                <div className="flex items-start space-x-3 mb-3">
                  {userProfile?.role === 'admin' && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleFileSelect(file.id)}
                      className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                    />
                  )}
                  <FileText className="text-indigo-500 flex-shrink-0 mt-0.5" size={24} />
                  <div className="overflow-hidden flex-1">
                    {/* 파일명 클릭 시 미리보기 동작 */}
                    <p
                      onClick={() => onOpenPreview(file)}
                      className="font-medium text-sm text-gray-800 truncate cursor-pointer hover:text-indigo-600 hover:underline"
                      title={`${file.file_name} (클릭하여 미리보기)`}
                    >
                      {file.file_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(file.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                {/* 개별 파일 버튼 액션 바 */}
                <div className="flex justify-end space-x-2 border-t pt-2 mt-2">
                  <button
                    onClick={() => onOpenPreview(file)}
                    className="p-1 text-gray-500 hover:text-indigo-600"
                    title="미리보기"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onDownloadFile(file.file_url, file.file_name)}
                    className="p-1 text-gray-500 hover:text-indigo-600"
                    title="다운로드"
                  >
                    <Download size={16} />
                  </button>
                  {userProfile?.role === 'admin' && (
                    <button
                      onClick={() => onDeleteFile(file)}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 미리보기 모달창 */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-full sm:h-5/6 flex flex-col p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h3 className="font-bold text-gray-800 truncate text-sm sm:text-base">
                {previewFile.file_name} 미리보기
              </h3>
              <button onClick={onClosePreview} className="text-gray-500 hover:text-black p-1">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 w-full overflow-auto flex items-center justify-center bg-gray-50 border rounded">
              {previewType === 'image' && (
                <img
                  src={previewFile.file_url}
                  alt={previewFile.file_name}
                  className="max-w-full max-h-full object-contain"
                />
              )}
              {previewType === 'html' && (
                <iframe
                  srcDoc={textContent}
                  className="w-full h-full border-0 bg-white"
                  title="HTML Preview"
                />
              )}
              {previewType === 'text' && (
                <pre className="w-full h-full p-4 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800 bg-white border-0">
                  {textContent}
                </pre>
              )}
              {previewType === 'pdf' && (
                <iframe
                  src={previewFile.file_url}
                  className="w-full h-full border-0 bg-white"
                  title="PDF Preview"
                />
              )}
              {previewType === 'doc' && (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(
                    previewFile.file_url
                  )}&embedded=true`}
                  className="w-full h-full border-0 bg-white"
                  title="Doc Preview"
                />
              )}
              {previewType === 'unsupported' && (
                <div className="text-center p-8">
                  <p className="text-gray-600 mb-4">
                    브라우저 직접 미리보기를 지원하지 않는 확장자입니다.
                  </p>
                  <button
                    onClick={() => onDownloadFile(previewFile.file_url, previewFile.file_name)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 font-medium text-sm"
                  >
                    파일 다운로드
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}