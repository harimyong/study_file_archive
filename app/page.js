'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FolderPlus, Upload, FileText, Trash2, Download, Eye, HardDrive, X, Users, LogOut, ShieldCheck, UserX } from 'lucide-react';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  // 인증 및 사용자 상태
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // 메인 데이터 상태
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [files, setFiles] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploading, setUploading] = useState(false);

  // 미리보기 모달 통합 상태
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState(''); // 'image' | 'html' | 'text' | 'pdf' | 'doc' | 'unsupported'
  const [textContent, setTextContent] = useState('');

  // 관리자 전용 - 유저 관리 모달 상태
  const [showUserModal, setShowUserModal] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [userPermissions, setUserPermissions] = useState({});

  // 일반 ID를 Supabase 내부용 가상 이메일로 변환하는 헬퍼 함수
  const toVirtualEmail = (username) => {
    if (!username) return '';
    return username.includes('@') ? username.trim() : `${username.trim()}@archive.local`;
  };

  // 1. 세션 확인 및 초기화
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else {
        setUserProfile(null);
        setCategories([]);
        setFiles([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. 로그인 유저 프로필 조회
  const fetchUserProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setUserProfile(data);
      fetchCategories(data);
    }
  };

  // 3. 카테고리 목록 조회 (유저별 접근 권한 필터링)
  const fetchCategories = async (profile) => {
    const { data: allCategories } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
    
    if (!allCategories) return;

    if (profile.role === 'admin') {
      setCategories(allCategories);
      if (allCategories.length > 0 && !selectedCategory) setSelectedCategory(allCategories[0]);
    } else {
      const { data: permData } = await supabase
        .from('category_permissions')
        .select('category_id')
        .eq('user_id', profile.id);

      const allowedIds = permData ? permData.map(p => p.category_id) : [];
      const allowedCategories = allCategories.filter(c => allowedIds.includes(c.id));
      
      setCategories(allowedCategories);
      if (allowedCategories.length > 0) setSelectedCategory(allowedCategories[0]);
      else setSelectedCategory(null);
    }
  };

  // 4. 파일 목록 조회
  useEffect(() => {
    if (selectedCategory) fetchFiles(selectedCategory.id);
  }, [selectedCategory]);

  const fetchFiles = async (categoryId) => {
    const { data } = await supabase.from('files').select('*').eq('category_id', categoryId).order('created_at', { ascending: false });
    if (data) setFiles(data);
  };

  // 로그인 처리 (관리자/유저 통합 일반 ID 로그인)
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const virtualEmail = toVirtualEmail(loginEmail);

    const { error } = await supabase.auth.signInWithPassword({
      email: virtualEmail,
      password: loginPassword,
    });
    if (error) setAuthError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해 주세요.');
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 카테고리 생성 (관리자 전용)
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || userProfile?.role !== 'admin') return;
    const { data } = await supabase.from('categories').insert([{ name: newCategoryName }]).select();
    if (data) {
      setCategories([...categories, data[0]]);
      setSelectedCategory(data[0]);
      setNewCategoryName('');
    }
  };

  // 카테고리 완전 삭제 (Storage 파일 + DB + UI 연동)
  const handleDeleteCategory = async (id) => {
    if (userProfile?.role !== 'admin') return;
    if (!confirm('카테고리를 삭제하면 포함된 모든 파일과 정보가 완전히 삭제됩니다. 진행하시겠습니까?')) return;

    try {
      const { data: categoryFiles } = await supabase.from('files').select('*').eq('category_id', id);

      if (categoryFiles && categoryFiles.length > 0) {
        const storagePaths = categoryFiles.map(file => {
          const urlParts = file.file_url.split('/study-files/');
          return urlParts.length > 1 ? decodeURIComponent(urlParts[1]) : null;
        }).filter(Boolean);

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

  // 파일 업로드 (UTF-8 / text 타입 헤더 처리)
  const handleFileUpload = async (e) => {
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
        contentType: customContentType
      });

      if (uploadError) continue;

      const { data: urlData } = supabase.storage.from('study-files').getPublicUrl(filePath);

      await supabase.from('files').insert([{
        category_id: selectedCategory.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type || ext
      }]);
    }

    fetchFiles(selectedCategory.id);
    setUploading(false);
  };

  // 파일 삭제 (Storage 실물 파일 + DB 메타데이터 동시 삭제)
  const handleDeleteFile = async (file) => {
    if (userProfile?.role !== 'admin') return;
    if (!confirm('파일을 삭제하시겠습니까?')) return;

    try {
      const urlParts = file.file_url.split('/study-files/');
      if (urlParts.length > 1) {
        await supabase.storage.from('study-files').remove([decodeURIComponent(urlParts[1])]);
      }

      await supabase.from('files').delete().eq('id', file.id);
      setFiles(files.filter(f => f.id !== file.id));
    } catch (err) {
      console.error('파일 삭제 실패:', err);
    }
  };

  // 파일 강제 다운로드
  const handleDownloadFile = async (fileUrl, fileName) => {
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

  // 모든 확장자 맞춤 미리보기 분기
  const handleOpenPreview = async (file) => {
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

  // 관리자 모달 - 유저 및 권한 목록 조회
  const fetchUsersAndPermissions = async () => {
    const { data: profilesData } = await supabase.from('profiles').select('*').eq('role', 'user');
    if (profilesData) setUsersList(profilesData);

    const { data: permData } = await supabase.from('category_permissions').select('*');
    if (permData) {
      const permMap = {};
      permData.forEach(p => {
        if (!permMap[p.user_id]) permMap[p.user_id] = [];
        permMap[p.user_id].push(p.category_id);
      });
      setUserPermissions(permMap);
    }
  };

  const handleOpenUserModal = () => {
    setShowUserModal(true);
    fetchUsersAndPermissions();
  };

  // 유저 계정 생성 (독립 클라이언트로 관리자 세션 유지)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) return;

    if (newUserPassword.length < 6) {
      alert('비밀번호는 최소 6자리 이상이어야 합니다.');
      return;
    }

    const virtualEmail = toVirtualEmail(newUserEmail);

    try {
      const adminAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { data, error } = await adminAuthClient.auth.signUp({
        email: virtualEmail,
        password: newUserPassword,
        options: { data: { role: 'user' } }
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

      fetchUsersAndPermissions();

    } catch (err) {
      console.error('유저 생성 오류:', err);
      alert('유저 생성 처리 중 오류가 발생했습니다.');
    }
  };

  // 유저 계정 삭제
  const handleDeleteUser = async (userId, userEmail) => {
    const displayId = userEmail.replace('@archive.local', '');
    if (!confirm(`[${displayId}] 유저를 완전히 삭제하시겠습니까?\n삭제 후 해당 계정은 더 이상 접속할 수 없습니다.`)) return;

    try {
      await supabase.from('category_permissions').delete().eq('user_id', userId);
      const { error } = await supabase.from('profiles').delete().eq('id', userId);

      if (error) {
        alert('유저 삭제 실패: ' + error.message);
      } else {
        alert('유저 삭제가 완료되었습니다.');
        setUsersList(usersList.filter(u => u.id !== userId));
      }
    } catch (err) {
      console.error('유저 삭제 오류:', err);
    }
  };

  // 카테고리 접근 권한 토글
  const handleTogglePermission = async (userId, categoryId) => {
    const currentPerms = userPermissions[userId] || [];
    const hasPerm = currentPerms.includes(categoryId);

    if (hasPerm) {
      await supabase.from('category_permissions').delete().eq('user_id', userId).eq('category_id', categoryId);
      setUserPermissions({
        ...userPermissions,
        [userId]: currentPerms.filter(id => id !== categoryId)
      });
    } else {
      await supabase.from('category_permissions').insert([{ user_id: userId, category_id: categoryId }]);
      setUserPermissions({
        ...userPermissions,
        [userId]: [...currentPerms, categoryId]
      });
    }
  };

  // ----------------------------------------------------
  // 🔒 로그인 화면 (Study File Archive 로고 적용)
  // ----------------------------------------------------
  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border">
          <div className="flex items-center justify-center space-x-2 text-indigo-600 mb-6">
            <HardDrive size={32} />
            <h1 className="text-2xl font-bold">Study File Archive</h1>
          </div>
          <p className="text-gray-500 text-center text-sm mb-6">서비스 이용을 위해 로그인해 주세요.</p>
          
          {authError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{authError}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">아이디 (ID)</label>
              <input
                type="text"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="아이디 입력"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">비밀번호</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium text-sm transition"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 💻 메인 서비스 화면 (Study File Archive 로고 적용)
  // ----------------------------------------------------
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* 사이드바 */}
      <div className="w-64 bg-white border-r p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 mb-6 font-bold text-lg">
            <HardDrive />
            <span>Study File Archive</span>
          </div>

          {/* 관리자 전용: 새 카테고리 추가 */}
          {userProfile?.role === 'admin' && (
            <form onSubmit={handleCreateCategory} className="mb-4 flex gap-1">
              <input
                type="text"
                placeholder="새 카테고리..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button type="submit" className="bg-indigo-600 text-white p-1 rounded hover:bg-indigo-700">
                <FolderPlus size={18} />
              </button>
            </form>
          )}

          {/* 카테고리 목록 */}
          <div className="space-y-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm group ${
                  selectedCategory?.id === cat.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="truncate">📁 {cat.name}</span>
                {userProfile?.role === 'admin' && (
                  <Trash2 size={14} className="opacity-0 group-hover:opacity-100 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 사이드바 하단 프로필 및 관리 버튼 */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span className="truncate font-medium">{session.user.email.replace('@archive.local', '')}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${userProfile?.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
              {userProfile?.role === 'admin' ? '관리자' : '유저'}
            </span>
          </div>

          {userProfile?.role === 'admin' && (
            <button
              onClick={handleOpenUserModal}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-medium"
            >
              <Users size={14} />
              <span>유저 및 권한 관리</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded text-xs font-medium"
          >
            <LogOut size={14} />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* 메인 파일 영역 */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedCategory ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">{selectedCategory.name}</h1>
              
              {/* 관리자 전용: 업로드 버튼 */}
              {userProfile?.role === 'admin' && (
                <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium">
                  <Upload size={16} />
                  <span>{uploading ? '업로드 중...' : '파일 업로드'}</span>
                  <input type="file" multiple onChange={handleFileUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>

            {files.length === 0 ? (
              <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                업로드된 학습 자료가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="bg-white p-4 rounded-lg border shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <div className="flex items-start space-x-3 mb-3">
                      <FileText className="text-indigo-500 flex-shrink-0" size={24} />
                      <div className="overflow-hidden">
                        <p className="font-medium text-sm text-gray-800 truncate" title={file.file_name}>{file.file_name}</p>
                        <p className="text-xs text-gray-400">{(file.file_size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 border-t pt-2 mt-2">
                      <button onClick={() => handleOpenPreview(file)} className="p-1 text-gray-500 hover:text-indigo-600" title="미리보기">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDownloadFile(file.file_url, file.file_name)} className="p-1 text-gray-500 hover:text-indigo-600" title="다운로드">
                        <Download size={16} />
                      </button>
                      {/* 관리자 전용: 파일 삭제 */}
                      {userProfile?.role === 'admin' && (
                        <button onClick={() => handleDeleteFile(file)} className="p-1 text-gray-500 hover:text-red-600" title="삭제">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            {categories.length === 0 ? '접근 가능한 카테고리가 없습니다.' : '사이드바에서 카테고리를 선택해 주세요.'}
          </div>
        )}
      </div>

      {/* 미리보기 모달 */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-5xl h-5/6 flex flex-col p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h3 className="font-bold text-gray-800 truncate">{previewFile.file_name} 미리보기</h3>
              <button onClick={() => setPreviewFile(null)} className="text-gray-500 hover:text-black p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 w-full overflow-auto flex items-center justify-center bg-gray-50 border rounded">
              {previewType === 'image' && (
                <img src={previewFile.file_url} alt={previewFile.file_name} className="max-w-full max-h-full object-contain" />
              )}
              {previewType === 'html' && (
                <iframe srcDoc={textContent} className="w-full h-full bg-white border-0" title="HTML Preview" />
              )}
              {previewType === 'text' && (
                <pre className="w-full h-full p-4 overflow-auto whitespace-pre-wrap font-sans text-sm text-gray-800 bg-white border-0">
                  {textContent}
                </pre>
              )}
              {previewType === 'pdf' && (
                <iframe src={previewFile.file_url} className="w-full h-full border-0" title="PDF Preview" />
              )}
              {previewType === 'doc' && (
                <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(previewFile.file_url)}&embedded=true`} className="w-full h-full border-0" title="Doc Preview" />
              )}
              {previewType === 'unsupported' && (
                <div className="text-center p-8">
                  <p className="text-gray-600 mb-4">HWP / HWPX 등의 파일은 브라우저 직접 미리보기를 지원하지 않습니다.</p>
                  <button
                    onClick={() => handleDownloadFile(previewFile.file_url, previewFile.file_name)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 font-medium text-sm"
                  >
                    파일 다운로드하여 열기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 관리자 전용: 유저 생성/삭제 및 권한 설정 모달 */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col p-6 shadow-xl overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
                <ShieldCheck />
                <span>유저 계정 및 카테고리 권한 관리</span>
              </div>
              <button onClick={() => setShowUserModal(false)} className="text-gray-500 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-6 pr-2">
              {/* 신규 유저 생성 폼 */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">신규 유저 생성 (일반 ID)</h4>
                <form onSubmit={handleCreateUser} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="유저 아이디 (ID)"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border rounded"
                  />
                  <input
                    type="password"
                    required
                    placeholder="비밀번호 (6자리 이상)"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border rounded"
                  />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm font-medium">
                    생성
                  </button>
                </form>
              </div>

              {/* 유저 목록 및 권한 설정 / 삭제 관리 */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-3">등록된 유저 권한 및 삭제 관리</h4>
                {usersList.length === 0 ? (
                  <p className="text-xs text-gray-400">등록된 유저가 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    {usersList.map((usr) => (
                      <div key={usr.id} className="border rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-sm text-indigo-900">
                            {usr.email.replace('@archive.local', '')}
                          </span>
                          <button
                            onClick={() => handleDeleteUser(usr.id, usr.email)}
                            className="flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 p-1 rounded transition"
                            title="유저 삭제"
                          >
                            <UserX size={14} />
                            <span>삭제</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {categories.map((cat) => {
                            const isChecked = (userPermissions[usr.id] || []).includes(cat.id);
                            return (
                              <label key={cat.id} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer bg-gray-50 px-2 py-1 rounded border">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(usr.id, cat.id)}
                                  className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{cat.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
