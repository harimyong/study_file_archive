import { supabase } from './supabaseClient';

// 카테고리 목록 불러오기
export const fetchCategories = async (profile, setCategories, setSelectedCategory) => {
  const { data: allCategories, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !allCategories) return;

  if (profile?.role === 'admin') {
    setCategories(allCategories);
  } else {
    const { data: permData } = await supabase
      .from('category_permissions')
      .select('category_id')
      .eq('user_id', profile.id);

    const allowedIds = permData ? permData.map((p) => p.category_id) : [];
    const allowedCategories = allCategories.filter((c) => allowedIds.includes(c.id));

    setCategories(allowedCategories);
  }

  // 항상 최상위(Home, null)에서 시작
  setSelectedCategory(null);
};

// 카테고리/폴더 생성
export const handleCreateCategory = async (
  e,
  newCategoryName,
  selectedCategory,
  userProfile,
  categories,
  setCategories,
  setNewCategoryName
) => {
  e.preventDefault();

  // 1. 입력값 검증
  if (!newCategoryName.trim()) {
    alert('카테고리 이름을 입력해 주세요.');
    return;
  }

  // 2. 권한 검증
  if (userProfile?.role !== 'admin') {
    alert('카테고리 생성 권한이 없습니다. (관리자 전용)');
    return;
  }

  try {
    // 3. Supabase DB Insert
    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          name: newCategoryName.trim(),
          parent_id: selectedCategory ? selectedCategory.id : null, // Home 위치일 경우 null
        },
      ])
      .select();

    if (error) {
      console.error('카테고리 생성 DB 에러:', error);
      alert(`카테고리 생성 실패: ${error.message}`);
      return;
    }

    if (data && data.length > 0) {
      setCategories([...categories, data[0]]);
      setNewCategoryName('');
    }
  } catch (err) {
    console.error('카테고리 생성 예외 처리:', err);
    alert('카테고리 생성 중 오류가 발생했습니다.');
  }
};

// 카테고리 삭제
export const handleDeleteCategory = async (id, userProfile, categories, setCategories, setSelectedCategory) => {
  if (userProfile?.role !== 'admin') return;
  if (!confirm('카테고리를 삭제하면 포함된 모든 하위 폴더와 파일이 삭제됩니다. 계속하시겠습니까?')) return;

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (!error) {
    setCategories(categories.filter((c) => c.id !== id));
    setSelectedCategory(null);
  }
};