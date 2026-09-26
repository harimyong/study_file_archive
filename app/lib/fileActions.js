import { supabase } from './supabaseClient';

export const fetchFiles = async (categoryId, setFiles) => {
  const { data } = await supabase
    .from('files')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false });

  if (data) setFiles(data);
};

export const handleFileUpload = async (e, selectedCategory, userProfile, setUploading, refreshFiles) => {
  if (userProfile?.role !== 'admin') return;
  const fileList = e.target.files;
  if (!fileList || fileList.length === 0 || !selectedCategory) return;
  setUploading(true);

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${selectedCategory.id}/${Date.now()}_${cleanFileName}`;

    const ext = file.name.split('.').pop().toLowerCase();
    let customContentType = file.type || 'application/octet-stream';

    if (ext === 'html' || ext === 'htm') customContentType = 'text/html; charset=utf-8';
    else if (['txt', 'md', 'json', 'js', 'css', 'py', 'java', 'c'].includes(ext)) customContentType = 'text/plain; charset=utf-8';

    const { error: uploadError } = await supabase.storage.from('study-files').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: customContentType,
    });

    if (uploadError) continue;

    const { data: urlData } = supabase.storage.from('study-files').getPublicUrl(filePath);

    await supabase.from('files').insert([{
      category_id: selectedCategory.id,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      file_type: file.type || ext,
    }]);
  }

  refreshFiles(selectedCategory.id);
  setUploading(false);
};

export const handleDeleteFile = async (file, userProfile, files, setFiles) => {
  if (userProfile?.role !== 'admin') return;
  if (!confirm('파일을 삭제하시겠습니까?')) return;

  try {
    const urlParts = file.file_url.split('/study-files/');
    if (urlParts.length > 1) {
      await supabase.storage.from('study-files').remove([decodeURIComponent(urlParts[1])]);
    }

    await supabase.from('files').delete().eq('id', file.id);
    setFiles(files.filter((f) => f.id !== file.id));
  } catch (err) {
    console.error('파일 삭제 실패:', err);
  }
};

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