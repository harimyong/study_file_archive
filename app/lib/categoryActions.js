import { supabase } from './supabaseClient';

// 카테고리 목록 조회
export const fetchCategories = async (profile, setCategories, setSelectedCategory) => {
  const { data: allCategories, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !allCategories) return;

  if (profile.role === 'admin') {
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

  // 새로고침/로그인 시 항상 최상위(Home, null)에서 시작하도록 고정
  setSelectedCategory(null);
};

// 카테고리 생성
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
  if (!newCategoryName.trim() || userProfile?.role !== 'admin') return;

  const { data } = await supabase
    .from('categories')
    .insert([
      {
        name: newCategoryName,
        parent_id: selectedCategory ? selectedCategory.id : null,
      },
    ])
    .select();

  if (data) {
    setCategories([...categories, data[0]]);
    setNewCategoryName('');
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