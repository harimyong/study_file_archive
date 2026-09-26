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

    // 1. Storage 실물 파일들 삭제 경로 추출
    const storagePaths = filesToDelete
      .map((file) => {
        const urlParts = file.file_url.split('/study-files/');
        return urlParts.length > 1 ? decodeURIComponent(urlParts[1]) : null;
      })
      .filter(Boolean);

    if (storagePaths.length > 0) {
      await supabase.storage.from('study-files').remove(storagePaths);
    }

    // 2. DB 일괄 삭제
    const { error } = await supabase
      .from('files')
      .delete()
      .in('id', selectedFileIds);

    if (error) {
      alert('파일 삭제에 실패했습니다: ' + error.message);
      return;
    }

    // 3. UI 업데이트 및 선택 초기화
    setFiles(files.filter((f) => !selectedFileIds.includes(f.id)));
    setSelectedFileIds([]);
  } catch (err) {
    console.error('일괄 삭제 에러:', err);
    alert('삭제 처리 중 오류가 발생했습니다.');
  }
};

// 선택된 여러 파일 일괄 이동
export const handleMoveSelectedFiles = async (
  selectedFileIds,
  targetCategoryId,
  fetchFilesCallback,
  currentCategoryId,
  setSelectedFileIds,
  userProfile
) => {
  if (userProfile?.role !== 'admin') return;
  if (selectedFileIds.length === 0 || !targetCategoryId) return;

  try {
    // DB의 category_id 일괄 업데이트
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
    fetchFilesCallback(currentCategoryId); // 목록 새로고침
  } catch (err) {
    console.error('일괄 이동 에러:', err);
    alert('파일 이동 중 오류가 발생했습니다.');
  }
};