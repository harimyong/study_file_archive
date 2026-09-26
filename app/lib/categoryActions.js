import { supabase } from './supabaseClient';

export const fetchCategories = async (userProfile, setCategories, setSelectedCategory, selectedCategory) => {
  const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
  if (!error && data) {
    setCategories(data);
  }
};

export const handleCreateCategory = async (e, newCategoryName, selectedCategory, userProfile, categories, setCategories, setNewCategoryName) => {
  e.preventDefault();
  if (!newCategoryName.trim()) return;

  const { data, error } = await supabase
    .from('categories')
    .insert([
      {
        name: newCategoryName,
        parent_id: selectedCategory ? selectedCategory.id : null, // 하위 폴더 연결
      },
    ])
    .select();

  if (!error && data) {
    setCategories([...categories, data[0]]);
    setNewCategoryName('');
  }
};

export const handleDeleteCategory = async (id, userProfile, categories, setCategories, setSelectedCategory) => {
  if (!confirm('카테고리와 하위 폴더, 모든 파일이 삭제됩니다. 계속하시겠습니까?')) return;

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (!error) {
    setCategories(categories.filter((c) => c.id !== id));
    setSelectedCategory(null);
  }
};