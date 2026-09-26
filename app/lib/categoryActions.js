import { supabase } from './supabaseClient';

// 특정 카테고리 ID들을 부모로 두는 모든 하위 자식 폴더 ID를 재귀적으로 구하는 함수
const getAllChildCategoryIds = (allCategories, parentIds) => {
  let childIds = [];
  const directChildren = allCategories.filter((c) => parentIds.includes(c.parent_id));

  if (directChildren.length > 0) {
    const directChildIds = directChildren.map((c) => c.id);
    childIds = childIds.concat(directChildIds);
    // 더 깊은 계층의 자식들도 재귀적으로 수집
    childIds = childIds.concat(getAllChildCategoryIds(allCategories, directChildIds));
  }

  return childIds;
};

// 카테고리 목록 불러오기 (유저 하위 폴더 자동 포함 및 현재 위치 유지 보장)
export const fetchCategories = async (profile, setCategories) => {
  if (!profile) return;

  const { data: allCategories, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !allCategories) return;

  if (profile.role === 'admin') {
    setCategories(allCategories);
  } else {
    // 1. 유저에게 직접 부여된 카테고리 ID 수집
    const { data: permData } = await supabase
      .from('category_permissions')
      .select('category_id')
      .eq('user_id', profile.id);

    const directPermIds = permData ? permData.map((p) => p.category_id) : [];

    // 2. 직접 권한이 있는 카테고리 하위에 속한 모든 자식 폴더 ID 수집
    const childPermIds = getAllChildCategoryIds(allCategories, directPermIds);

    // 3. 직접 권한 + 하위 폴더 권한 합치기
    const totalAllowedIds = Array.from(new Set([...directPermIds, ...childPermIds]));

    const allowedCategories = allCategories.filter((c) => totalAllowedIds.includes(c.id));
    setCategories(allowedCategories);
  }
  // ★ setSelectedCategory(null) 구문을 완전히 제거하여 탭 이동 시 Home으로 튕기는 문제 해결!
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

  const { data, error } = await supabase
    .from('categories')
    .insert([
      {
        name: newCategoryName.trim(),
        parent_id: selectedCategory ? selectedCategory.id : null,
      },
    ])
    .select();

  if (!error && data) {
    setCategories([...categories, data[0]]);
    setNewCategoryName('');
  }
};

// 카테고리 삭제
export const handleDeleteCategory = async (id, userProfile, categories, setCategories, setSelectedCategory) => {
  if (userProfile?.role !== 'admin') return;
  if (!confirm('카테고리를 삭제하면 모든 하위 폴더와 파일이 삭제됩니다. 계속하시겠습니까?')) return;

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (!error) {
    setCategories(categories.filter((c) => c.id !== id));
    setSelectedCategory(null);
  }
};