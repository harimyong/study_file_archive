'use client';
import { Upload, FileText, Trash2, Download, Eye, X } from 'lucide-react';

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
}) {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {selectedCategory ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{selectedCategory.name}</h1>

            {userProfile?.role === 'admin' && (
              <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium">
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

          {files.length === 0 ? (
            <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              업로드된 학습 자료가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-white p-4 rounded-lg border shadow-sm flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <FileText className="text-indigo-500 flex-shrink-0" size={24} />
                    <div className="overflow-hidden">
                      <p
                        className="font-medium text-sm text-gray-800 truncate"
                        title={file.file_name}
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
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          {categories.length === 0
            ? '접근 가능한 카테고리가 없습니다.'
            : '사이드바에서 카테고리를 선택해 주세요.'}
        </div>
      )}

      {/* 미리보기 모달 */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-5xl h-5/6 flex flex-col p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h3 className="font-bold text-gray-800 truncate">
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
                  className="w-full h-full bg-white border-0"
                  title="HTML Preview"
                />
              )}
              {previewType === 'text' && (
                <pre className="w-full h-full p-4 overflow-auto whitespace-pre-wrap font-sans text-sm text-gray-800 bg-white border-0">
                  {textContent}
                </pre>
              )}
              {previewType === 'pdf' && (
                <iframe
                  src={previewFile.file_url}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              )}
              {previewType === 'doc' && (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(previewFile.file_url)}&embedded=true`}
                  className="w-full h-full border-0"
                  title="Doc Preview"
                />
              )}
              {previewType === 'unsupported' && (
                <div className="text-center p-8">
                  <p className="text-gray-600 mb-4">
                    HWP / HWPX 등의 파일은 브라우저 직접 미리보기를 지원하지 않습니다.
                  </p>
                  <button
                    onClick={() => onDownloadFile(previewFile.file_url, previewFile.file_name)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 font-medium text-sm"
                  >
                    파일 다운로드하여 열기
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