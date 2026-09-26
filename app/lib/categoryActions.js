import { supabase } from './supabaseClient';

// 카테고리 및 하위 폴더 목록 불러오기 (유저별 접근 권한 필터링)
export const fetchCategories = async (profile, setCategories, setSelectedCategory, selectedCategory) => {
  if (!profile) return;

  // 1. 전체 카테고리 목록 가져오기
  const { data: allCategories, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !allCategories) {
    console.error('카테고리 불러오기 실패:', error);
    return;
  }

  // 2. 관리자(admin)인 경우: 모든 카테고리 접근 허용
  if (profile.role === 'admin') {
    setCategories(allCategories);
    if (allCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(allCategories[0]);
    }
  } 
  // 3. 일반 유저(user)인 경우: 허용된 카테고리 및 상위/하위 연관 폴더만 필터링
  else {
    const { data: permData } = await supabase
      .from('category_permissions')
      .select('category_id')
      .eq('user_id', profile.id);

    const allowedIds = permData ? permData.map((p) => p.category_id) : [];

    // 유저에게 직접 권한이 부여된 카테고리들만 추출
    const allowedCategories = allCategories.filter((cat) => allowedIds.includes(cat.id));

    setCategories(allowedCategories);

    // 현재 선택된 카테고리가 접근 권한 목록에 없다면 첫 번째 허용된 카테고리로 세팅
    if (allowedCategories.length > 0) {
      if (!selectedCategory || !allowedIds.includes(selectedCategory.id)) {
        setSelectedCategory(allowedCategories[0]);
      }
    } else {
      setSelectedCategory(null);
    }
  }
};