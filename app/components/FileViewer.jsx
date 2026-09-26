'use client';
import { Upload, FileText, Eye, Download, Trash2, ChevronRight, Folder, ArrowLeft } from 'lucide-react';

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
}) {
  // 1. 전체 경로(Breadcrumb) 계산 함수 (루트 -> 최상위 -> ... -> 현재 위치)
  const getCategoryPath = () => {
    if (!selectedCategory) return [];
    const path = [];
    let current = selectedCategory;

    // parent_id를 타고 올라가며 부모 폴더들을 수집
    while (current) {
      path.unshift(current); // 배열 맨 앞에 추가하여 순서 정렬
      current = categories.find((c) => c.id === current.parent_id);
    }
    return path;
  };

  const categoryPath = getCategoryPath();

  // 2. 부모 디렉토리로 이동하는 핸들러
  const handleGoToParent = () => {
    if (!selectedCategory) return;
    if (!selectedCategory.parent_id) {
      onSelectCategory(null); // 최상위 루트로 이동
    } else {
      const parentCat = categories.find((c) => c.id === selectedCategory.parent_id);
      onSelectCategory(parentCat || null);
    }
  };

  // 현재 카테고리의 바로 아래 하위 폴더들
  const subFolders = categories.filter(
    (c) => c.parent_id === (selectedCategory ? selectedCategory.id : null)
  );

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      {/* 생략 없는 전체 경로(Breadcrumb) 출력 */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 overflow-x-auto whitespace-nowrap py-1">
        <span
          className={`cursor-pointer hover:underline ${
            selectedCategory === null ? 'font-bold text-gray-800' : 'text-indigo-600 font-medium'
          }`}
          onClick={() => onSelectCategory(null)}
        >
          루트
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

      {/* 상단 타이틀 & 뒤로가기 / 업로드 버튼 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">
          {selectedCategory ? selectedCategory.name : '전체 / 최상위 루트'}
        </h1>

        {/* 액션 버튼 그룹 */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* 뒤로가기(부모 디렉토리 이동) 버튼 */}
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

          {/* 파일 업로드 버튼 */}
          {selectedCategory && (
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

      {/* 하위 폴더 영역 */}
      {subFolders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            하위 폴더
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

      {/* 파일 목록 영역 */}
      {selectedCategory ? (
        files.length === 0 ? (
          <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg text-sm">
            등록된 파일이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white p-4 rounded-lg border shadow-sm flex flex-col justify-between hover:shadow-md transition"
              >
                <div className="flex items-start space-x-3 mb-3">
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
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-20 text-gray-400 text-sm">
          사이드바에서 카테고리를 선택해 주세요.
        </div>
      )}

      {/* 미리보기 모달 */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-full sm:h-5/6 flex flex-col p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h3 className="font-bold text-gray-800 truncate text-sm sm:text-base">
                {previewFile.file_name}
              </h3>
              <button onClick={onClosePreview} className="text-gray-500 hover:text-black p-1">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto border rounded bg-gray-50 p-2">
              {previewType === 'html' ? (
                <iframe
                  srcDoc={textContent}
                  className="w-full h-full border-0 bg-white"
                  title="HTML Preview"
                />
              ) : (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(
                    previewFile.file_url
                  )}&embedded=true`}
                  className="w-full h-full border-0 bg-white"
                  title="Doc Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}