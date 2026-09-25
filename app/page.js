'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FolderPlus, Upload, FileText, Trash2, Download, Eye, HardDrive, X } from 'lucide-react';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [files, setFiles] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // 미리보기 모달 통합 상태
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState(''); // 'image' | 'html' | 'text' | 'pdf' | 'doc'
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) fetchFiles(selectedCategory.id);
  }, [selectedCategory]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
    if (data) {
      setCategories(data);
      if (data.length > 0 && !selectedCategory) setSelectedCategory(data[0]);
    }
  };

  const fetchFiles = async (categoryId) => {
    const { data } = await supabase.from('files').select('*').eq('category_id', categoryId).order('created_at', { ascending: false });
    if (data) setFiles(data);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const { data } = await supabase.from('categories').insert([{ name: newCategoryName }]).select();
    if (data) {
      setCategories([...categories, data[0]]);
      setSelectedCategory(data[0]);
      setNewCategoryName('');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('카테고리를 삭제하면 포함된 모든 파일 정보도 삭제됩니다.')) return;
    await supabase.from('categories').delete().eq('id', id);
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    setSelectedCategory(updated[0] || null);
  };

  const handleFileUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !selectedCategory) return;
    setUploading(true);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${selectedCategory.id}/${Date.now()}_${cleanFileName}`;
      
      const ext = file.name.split('.').pop().toLowerCase();
      let customContentType = file.type || 'application/octet-stream';

      if (ext === 'html' || ext === 'htm') {
        customContentType = 'text/html; charset=utf-8';
      } else if (ext === 'txt' || ext === 'md' || ext === 'json' || ext === 'js' || ext === 'css') {
        customContentType = 'text/plain; charset=utf-8';
      }

      const { error: uploadError } = await supabase.storage
        .from('study-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: customContentType
        });

      if (uploadError) {
        console.error('업로드 실패 원인:', uploadError);
        alert(`[${file.name}] 업로드 실패: ${uploadError.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from('study-files').getPublicUrl(filePath);

      await supabase.from('files').insert([{
        category_id: selectedCategory.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type || ext
      }]);
    }

    fetchFiles(selectedCategory.id);
    setUploading(false);
  };

  const handleDeleteFile = async (id) => {
    if (!confirm('파일을 삭제하시겠습니까?')) return;
    await supabase.from('files').delete().eq('id', id);
    setFiles(files.filter(f => f.id !== id));
  };

  // 강제 다운로드 처리
  const handleDownloadFile = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(fileUrl, '_blank');
    }
  };

const handleOpenPreview = async (file) => {
    setPreviewFile(file);
    const ext = file.file_name.split('.').pop().toLowerCase();

    // 1. 이미지 확장자
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      setPreviewType('image');
    } 
    // 2. HTML 확장자
    else if (['html', 'htm'].includes(ext)) {
      setPreviewType('html');
      setTextContent('불러오는 중...');
      try {
        const res = await fetch(file.file_url);
        const buffer = await res.arrayBuffer();
        let decoder = new TextDecoder('euc-kr');
        let text = decoder.decode(buffer);
        if (text.includes('')) {
          text = new TextDecoder('utf-8').decode(buffer);
        }
        setTextContent(text);
      } catch (err) {
        setTextContent('<p>파일 내용을 불러오지 못했습니다.</p>');
      }
    } 
    // 3. 텍스트 및 코드 파일 (한글 깨짐 자동 판별 디코딩)
    else if (['txt', 'md', 'json', 'js', 'css', 'py', 'java', 'c', 'cpp'].includes(ext)) {
      setPreviewType('text');
      setTextContent('텍스트를 읽어오는 중...');
      try {
        const res = await fetch(file.file_url);
        const buffer = await res.arrayBuffer();
        
        // 1차 EUC-KR 디코딩 시도
        let decoder = new TextDecoder('euc-kr');
        let text = decoder.decode(buffer);
        
        // 깨짐 문자()가 보이면 UTF-8로 재시도
        if (text.includes('')) {
          text = new TextDecoder('utf-8').decode(buffer);
        }
        setTextContent(text);
      } catch (err) {
        setTextContent('파일을 읽는 중 에러가 발생했습니다.');
      }
    } 
    // 4. PDF 문서
    else if (ext === 'pdf') {
      setPreviewType('pdf');
    } 
    // 5. 기타 문서 (PPTX, DOCX, XLSX 등)
    else {
      setPreviewType('doc');
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewType('');
    setTextContent('');
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* 사이드바 */}
      <div className="w-64 bg-white border-r p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 mb-6 font-bold text-xl">
            <HardDrive />
            <span>Cloud-Archive</span>
          </div>
          <form onSubmit={handleCreateCategory} className="mb-4 flex gap-1">
            <input
              type="text"
              placeholder="새 카테고리..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 text-white p-1 rounded hover:bg-indigo-700">
              <FolderPlus size={18} />
            </button>
          </form>
          <div className="space-y-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm group ${
                  selectedCategory?.id === cat.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="truncate">📁 {cat.name}</span>
                <Trash2 size={14} className="opacity-0 group-hover:opacity-100 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 파일 영역 */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedCategory ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">{selectedCategory.name}</h1>
              <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium">
                <Upload size={16} />
                <span>{uploading ? '업로드 중...' : '파일 업로드'}</span>
                <input type="file" multiple onChange={handleFileUpload} className="hidden" disabled={uploading} />
              </label>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                업로드된 학습 자료가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="bg-white p-4 rounded-lg border shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <div className="flex items-start space-x-3 mb-3">
                      <FileText className="text-indigo-500 flex-shrink-0" size={24} />
                      <div className="overflow-hidden">
                        <p className="font-medium text-sm text-gray-800 truncate" title={file.file_name}>{file.file_name}</p>
                        <p className="text-xs text-gray-400">{(file.file_size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 border-t pt-2 mt-2">
                      <button onClick={() => handleOpenPreview(file)} className="p-1 text-gray-500 hover:text-indigo-600" title="미리보기">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDownloadFile(file.file_url, file.file_name)} className="p-1 text-gray-500 hover:text-indigo-600" title="다운로드">
                        <Download size={16} />
                      </button>
                      <button onClick={() => handleDeleteFile(file.id)} className="p-1 text-gray-500 hover:text-red-600" title="삭제">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">사이드바에서 카테고리를 선택하거나 생성해 주세요.</div>
        )}
      </div>

      {/* 종합 맞춤 미리보기 모달 */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-5xl h-5/6 flex flex-col p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h3 className="font-bold text-gray-800 truncate">{previewFile.file_name} 미리보기</h3>
              <button onClick={closePreview} className="text-gray-500 hover:text-black p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 w-full overflow-auto flex items-center justify-center bg-gray-50 border rounded">
              {/* 1. 이미지 미리보기 */}
              {previewType === 'image' && (
                <img
                  src={previewFile.file_url}
                  alt={previewFile.file_name}
                  className="max-w-full max-h-full object-contain"
                />
              )}

              {/* 2. HTML 웹페이지 직접 렌더링 */}
              {previewType === 'html' && (
                <iframe
                  srcDoc={textContent}
                  className="w-full h-full bg-white border-0"
                  title="HTML Preview"
                />
              )}

              {/* 3. 텍스트 / 코드 파일 직접 표출 */}
              {previewType === 'text' && (
                <pre className="w-full h-full p-4 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800 bg-white border-0">
                  {textContent}
                </pre>
              )}

              {/* 4. PDF 브라우저 직접 렌더링 */}
              {previewType === 'pdf' && (
                <iframe
                  src={previewFile.file_url}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              )}

              {/* 5. PPTX / DOCX 등 일반 문서 (구글 뷰어) */}
              {previewType === 'doc' && (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(previewFile.file_url)}&embedded=true`}
                  className="w-full h-full border-0"
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
