import { supabase } from './supabaseClient';
import { createClient } from '@supabase/supabase-js';

const toVirtualEmail = (username) => {
  if (!username) return '';
  return username.includes('@') ? username.trim() : `${username.trim()}@archive.local`;
};

// 유저 및 권한 목록 불러오기
export const fetchUsersAndPermissions = async (setUsersList, setUserPermissions) => {
  const { data: profilesData } = await supabase.from('profiles').select('*').eq('role', 'user');
  if (profilesData) setUsersList(profilesData);

  const { data: permData } = await supabase.from('category_permissions').select('*');
  if (permData) {
    const permMap = {};
    permData.forEach((p) => {
      if (!permMap[p.user_id]) permMap[p.user_id] = [];
      permMap[p.user_id].push(p.category_id);
    });
    setUserPermissions(permMap);
  }
};

// 신규 유저 생성
export const handleCreateUser = async (e, newUserEmail, newUserPassword, supabaseUrl, supabaseAnonKey, setNewUserEmail, setNewUserPassword, refreshCallback) => {
  e.preventDefault();
  if (!newUserEmail || !newUserPassword) return;

  if (newUserPassword.length < 6) {
    alert('비밀번호는 최소 6자리 이상이어야 합니다.');
    return;
  }

  const virtualEmail = toVirtualEmail(newUserEmail);

  try {
    const adminAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await adminAuthClient.auth.signUp({
      email: virtualEmail,
      password: newUserPassword,
      options: { data: { role: 'user' } },
    });

    if (error) {
      alert('유저 생성 실패: ' + error.message);
      return;
    }

    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      alert('이미 존재하거나 가입된 아이디입니다.');
      return;
    }

    alert(`[${newUserEmail}] 유저 계정이 성공적으로 생성되었습니다.`);
    setNewUserEmail('');
    setNewUserPassword('');
    refreshCallback();
  } catch (err) {
    console.error('유저 생성 오류:', err);
    alert('유저 생성 처리 중 오류가 발생했습니다.');
  }
};

// 유저 삭제
export const handleDeleteUser = async (userId, userEmail, usersList, setUsersList) => {
  const displayId = userEmail.replace('@archive.local', '');
  if (!confirm(`[${displayId}] 유저를 완전히 삭제하시겠습니까?\n삭제 후 해당 계정은 더 이상 접속할 수 없습니다.`)) return;

  try {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (error) {
      alert('DB 유저 삭제 실패: ' + error.message);
      return;
    }

    alert('유저가 DB에서 완전히 삭제되었습니다.');
    setUsersList(usersList.filter((u) => u.id !== userId));
  } catch (err) {
    console.error('유저 삭제 오류:', err);
    alert('유저 삭제 처리 중 오류가 발생했습니다.');
  }
};

// 카테고리 및 자식 하위 폴더 권한 일괄 토글
export const handleTogglePermission = async (userId, categoryIds, shouldEnable, userPermissions, setUserPermissions) => {
  const currentPerms = userPermissions[userId] || [];
  const targetIds = Array.isArray(categoryIds) ? categoryIds : [categoryIds];

  if (shouldEnable) {
    // 추가할 ID 목록 추출
    const idsToAdd = targetIds.filter((id) => !currentPerms.includes(id));
    if (idsToAdd.length === 0) return;

    const rowsToInsert = idsToAdd.map((id) => ({
      user_id: userId,
      category_id: id,
    }));

    const { error } = await supabase.from('category_permissions').insert(rowsToInsert);

    if (!error) {
      setUserPermissions({
        ...userPermissions,
        [userId]: [...currentPerms, ...idsToAdd],
      });
    }
  } else {
    // 제거할 ID 목록 삭제
    const { error } = await supabase
      .from('category_permissions')
      .delete()
      .eq('user_id', userId)
      .in('category_id', targetIds);

    if (!error) {
      setUserPermissions({
        ...userPermissions,
        [userId]: currentPerms.filter((id) => !targetIds.includes(id)),
      });
    }
  }
};