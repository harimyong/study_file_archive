import { supabase } from './supabaseClient';

// 파일 목록 불러오기
export const fetchFiles = async (categoryId, setFiles) => {
  if (!categoryId) return;
  const { data } = await supabase
    .from('files')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false });

  if (data) setFiles(data);
};

// 파일 업로드
export const handleFileUpload = async (e, selectedCategory, userProfile, setUploading, fetchFilesCallback) => {
  const files = e.target.files;
  if (!files || files.length === 0 || !selectedCategory) return;
  if (userProfile?.role !== 'admin') return;

  setUploading(true);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${selectedCategory.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('study-files')
      .upload(filePath, file);

    if (uploadError) {
      console.error('업로드 에러:', uploadError);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from('study-files')
      .getPublicUrl(filePath);

    await supabase.from('files').insert([
      {
        category_id: selectedCategory.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type || fileExt,
      },
    ]);
  }

  setUploading(false);
  if (typeof fetchFilesCallback === 'function') {
    fetchFilesCallback(selectedCategory.id);
  }
};

// 파일 개별 삭제
export const handleDeleteFile = async (file, userProfile, files, setFiles) => {
  if (userProfile?.role !== 'admin') return;
  if (!confirm('파일을 삭제하시겠습니까?')) return;

  try {
    const urlParts = file.file_url.split('/study-files/');
    if (urlParts.length > 1) {
      await supabase.storage.from('study-files').remove([decodeURIComponent(urlParts[1])]);
    }

    const { error } = await supabase.from('files').delete().eq('id', file.id);
    if (!error) {
      setFiles(files.filter((f) => f.id !== file.id));
    }
  } catch (err) {
    console.error('파일 삭제 실패:', err);
  }
};

// 파일 강제 다운로드
export const handleDownloadFile = async (fileUrl, fileName) => {
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

// 미리보기 열기 및 확장자별 디코딩 처리
export const handleOpenPreview = async (file, setPreviewFile, setPreviewType, setTextContent) => {
  setPreviewFile(file);
  const ext = file.file_name.split('.').pop().toLowerCase();

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    setPreviewType('image');
  } else if (['html', 'htm'].includes(ext)) {
    setPreviewType('html');
    setTextContent('불러오는 중...');
    try {
      const res = await fetch(file.file_url);
      const buffer = await res.arrayBuffer();
      let decoder = new TextDecoder('euc-kr');
      let text = decoder.decode(buffer);
      if (text.includes('')) text = new TextDecoder('utf-8').decode(buffer);
      setTextContent(text);
    } catch (err) {
      setTextContent('<p>파일 내용을 불러오지 못했습니다.</p>');
    }
  } else if (['txt', 'md', 'json', 'js', 'css', 'py', 'java', 'c', 'cpp'].includes(ext)) {
    setPreviewType('text');
    setTextContent('텍스트를 읽어오는 중...');
    try {
      const res = await fetch(file.file_url);
      const buffer = await res.arrayBuffer();
      let decoder = new TextDecoder('euc-kr');
      let text = decoder.decode(buffer);
      if (text.includes('')) text = new TextDecoder('utf-8').decode(buffer);
      setTextContent(text);
    } catch (err) {
      setTextContent('파일을 읽는 중 에러가 발생했습니다.');
    }
  } else if (ext === 'pdf') {
    setPreviewType('pdf');
  } else if (['hwp', 'hwpx', 'zip', 'exe'].includes(ext)) {
    setPreviewType('unsupported');
  } else {
    setPreviewType('doc');
  }
};

// 선택된 여러 파일 일괄 삭제
export const handleDeleteSelectedFiles = async (
  selectedFileIds,
  files,
  setFiles,
  setSelectedFileIds,
  userProfile
) => {
  if (userProfile?.role !== 'admin') return;
  if (selectedFileIds.length === 0) return;

  if (!confirm(`선택한 ${selectedFileIds.length}개의 파일을 정말 삭제하시겠습니까?`)) return;

  try {
    const filesToDelete = files.filter((f) => selectedFileIds.includes(f.id));

    const storagePaths = filesToDelete
      .map((file) => {
        const urlParts = file.file_url.split('/study-files/');
        return urlParts.length > 1 ? decodeURIComponent(urlParts[1]) : null;
      })
      .filter(Boolean);

    if (storagePaths.length > 0) {
      await supabase.storage.from('study-files').remove(storagePaths);
    }

    const { error } = await supabase
      .from('files')
      .delete()
      .in('id', selectedFileIds);

    if (!error) {
      setFiles(files.filter((f) => !selectedFileIds.includes(f.id)));
      setSelectedFileIds([]);
    }
  } catch (err) {
    console.error('일괄 삭제 에러:', err);
  }
};

// 선택된 여러 파일 일괄 이동
export const handleMoveSelectedFiles = async (
  selectedFileIds,
  targetCategoryId,
  currentCategoryId,
  fetchFilesCallback,
  setSelectedFileIds,
  userProfile
) => {
  if (userProfile?.role !== 'admin') return;
  if (selectedFileIds.length === 0 || !targetCategoryId) return;

  try {
    const { error } = await supabase
      .from('files')
      .update({ category_id: targetCategoryId })
      .in('id', selectedFileIds);

    if (error) {
      alert('파일 이동에 실패했습니다: ' + error.message);
      return;
    }

    alert(`${selectedFileIds.length}개 파일이 성공적으로 이동되었습니다.`);
    setSelectedFileIds([]);
    if (typeof fetchFilesCallback === 'function') {
      fetchFilesCallback(currentCategoryId);
    }
  } catch (err) {
    console.error('일괄 이동 에러:', err);
  }
};