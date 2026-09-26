'use client';
import { useState, useEffect } from 'react';
import { Upload, FileText, Eye, Download, Trash2, ChevronRight, Folder, ArrowLeft, FolderOutput, CheckSquare, Square } from 'lucide-react';
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
  // 다중 선택 상태 및 이동 타겟 폴더 상태
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [targetMoveCategoryId, setTargetMoveCategoryId] = useState('');

  // 카테고리 변경 시 선택 상태 초기화
  useEffect(() => {
    setSelectedFileIds([]);
    setTargetMoveCategoryId('');
  }, [selectedCategory]);

  // 전체 선택 / 해제 토글
  const handleSelectAll = () => {
    if (selectedFileIds.length === files.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(files.map((f) => f.id));
    }
  };

  // 개별 파일 선택 토글
  const handleToggleFileSelect = (fileId) => {
    if (selectedFileIds.includes(fileId)) {
      setSelectedFileIds(selectedFileIds.filter((id) => id !== fileId));
    } else {
      setSelectedFileIds([...selectedFileIds, fileId]);
    }
  };

  // 이동 가능한 카테고리 목록 (현재 위치 제외한 전체 폴더)
  const availableMoveCategories = categories.filter(
    (c) => c.id !== selectedCategory?.id
  );

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      {/* 관리자 다중 선택 전용 액션바 (선택된 파일이 있을 때 노출) */}
      {userProfile?.role === 'admin' && selectedFileIds.length > 0 && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-indigo-900 text-sm font-semibold">
            <CheckSquare className="text-indigo-600" size={18} />
            <span>{selectedFileIds.length}개 파일 선택됨</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 폴더 이동 영역 */}
            <select
              value={targetMoveCategoryId}
              onChange={(e) => setTargetMoveCategoryId(e.target.value)}
              className="text-xs border rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">이동할 폴더 선택...</option>
              {availableMoveCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  📁 {cat.name}
                </option>
              ))}
            </select>

            <button
              onClick={() =>
                handleMoveSelectedFiles(
                  selectedFileIds,
                  targetMoveCategoryId,
                  refreshFiles,
                  selectedCategory?.id,
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

            {/* 선택 삭제 영역 */}
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

      {/* 파일 목록 상단 툴바 (전체 선택 버튼 추가) */}
      {selectedCategory && files.length > 0 && userProfile?.role === 'admin' && (
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

      {/* 파일 카드 목록 영역 */}
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
                {/* 관리자 전용 체크박스 */}
                {userProfile?.role === 'admin' && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleFileSelect(file.id)}
                    className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                )}
                <FileText className="text-indigo-500 flex-shrink-0 mt-0.5" size={24} />
                <div className="overflow-hidden flex-1">
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

              {/* 하단 개별 파일 제어 버튼들 */}
              <div className="flex justify-end space-x-2 border-t pt-2 mt-2">
                <button
                  onClick={() => onOpenPreview(file)}
                  className="p-1 text-gray-500 hover:text-indigo-600"
                  title="미리보기"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => onDownloadFile(file)}
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
    </div>
  );
}