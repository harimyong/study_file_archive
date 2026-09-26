import { supabase } from './supabaseClient';

// 카테고리 목록 조회
export const fetchCategories = async (profile, setCategories, setSelectedCategory, selectedCategory) => {
  const { data: allCategories } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (!allCategories) return;

  if (profile.role === 'admin') {
    setCategories(allCategories);
    if (allCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(allCategories[0]);
    }
  } else {
    const { data: permData } = await supabase
      .from('category_permissions')
      .select('category_id')
      .eq('user_id', profile.id);

    const allowedIds = permData ? permData.map((p) => p.category_id) : [];
    const allowedCategories = allCategories.filter((c) => allowedIds.includes(c.id));

    setCategories(allowedCategories);
    if (allowedCategories.length > 0) setSelectedCategory(allowedCategories[0]);
    else setSelectedCategory(null);
  }
};

// 카테고리 생성
export const handleCreateCategory = async (e, newCategoryName, userProfile, categories, setCategories, setSelectedCategory, setNewCategoryName) => {
  e.preventDefault();
  if (!newCategoryName.trim() || userProfile?.role !== 'admin') return;

  const { data } = await supabase.from('categories').insert([{ name: newCategoryName }]).select();
  if (data) {
    setCategories([...categories, data[0]]);
    setSelectedCategory(data[0]);
    setNewCategoryName('');
  }
};

// 카테고리 삭제 (스토리지 실물 파일 + DB 통합 삭제)
export const handleDeleteCategory = async (id, userProfile, categories, setCategories, setSelectedCategory) => {
  if (userProfile?.role !== 'admin') return;
  if (!confirm('카테고리를 삭제하면 포함된 모든 파일과 정보가 완전히 삭제됩니다. 진행하시겠습니까?')) return;

  try {
    const { data: categoryFiles } = await supabase.from('files').select('*').eq('category_id', id);

    if (categoryFiles && categoryFiles.length > 0) {
      const storagePaths = categoryFiles
        .map((file) => {
          const urlParts = file.file_url.split('/study-files/');
          return urlParts.length > 1 ? decodeURIComponent(urlParts[1]) : null;
        })
        .filter(Boolean);

      if (storagePaths.length > 0) {
        await supabase.storage.from('study-files').remove(storagePaths);
      }
    }

    await supabase.from('categories').delete().eq('id', id);
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    setSelectedCategory(updated[0] || null);
  } catch (err) {
    console.error('카테고리 삭제 에러:', err);
    alert('카테고리 삭제 중 오류가 발생했습니다.');
  }
};