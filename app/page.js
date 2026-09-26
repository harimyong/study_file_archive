'use client';
import { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from './lib/supabaseClient';
import { Menu, LogOut } from 'lucide-react';

import { fetchCategories, handleCreateCategory, handleDeleteCategory } from './lib/categoryActions';
import { fetchUsersAndPermissions, handleCreateUser, handleDeleteUser, handleTogglePermission } from './lib/userActions';
import { fetchFiles, handleFileUpload, handleDeleteFile, handleDownloadFile, handleOpenPreview } from './lib/fileActions';

import LoginView from './components/LoginView';
import CategorySidebar from './components/CategorySidebar';
import FileViewer from './components/FileViewer';
import UserManagerModal from './components/UserManagerModal';

export default function Home() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // 초기값 Home (null)
  const [files, setFiles] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploading, setUploading] = useState(false);

  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState('');
  const [textContent, setTextContent] = useState('');

  const [showUserModal, setShowUserModal] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [userPermissions, setUserPermissions] = useState({});

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        setSelectedCategory(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setUserProfile(data);
      // 카테고리를 가져오되 현재 선택된 selectedCategory 상태는 절대 건드리지 않음
      fetchCategories(data, setCategories);
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchFiles(selectedCategory.id, setFiles);
    } else {
      setFiles([]);
    }
  }, [selectedCategory]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const virtualEmail = loginEmail.includes('@') ? loginEmail.trim() : `${loginEmail.trim()}@archive.local`;

    const { error } = await supabase.auth.signInWithPassword({
      email: virtualEmail,
      password: loginPassword,
    });
    if (error) setAuthError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해 주세요.');
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await supabase.auth.signOut();
  };

  if (!session) {
    return (
      <LoginView
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        authError={authError}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans overflow-hidden">
      {/* 모바일 전용 상단 헤더 */}
      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 text-gray-600 hover:text-indigo-600 focus:outline-none"
            title="메뉴 열기"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-indigo-600 text-sm">Study File Archive</span>
        </div>

        {/* 모바일 헤더 우측: 로그아웃 버튼 노출 */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded text-xs font-medium transition"
        >
          <LogOut size={14} />
          <span>로그아웃</span>
        </button>
      </div>

      <CategorySidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setIsMobileMenuOpen(false); // 모바일에서 카테고리 선택 시 사이드바 닫기
        }}
        userProfile={userProfile}
        session={session}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        onCreateCategory={(e) =>
          handleCreateCategory(
            e,
            newCategoryName,
            selectedCategory,
            userProfile,
            categories,
            setCategories,
            setNewCategoryName
          )
        }
        onDeleteCategory={(id) =>
          handleDeleteCategory(id, userProfile, categories, setCategories, setSelectedCategory)
        }
        onOpenUserModal={() => {
          setShowUserModal(true);
          setIsMobileMenuOpen(false);
          fetchUsersAndPermissions(setUsersList, setUserPermissions);
        }}
        onLogout={handleLogout}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <FileViewer
        selectedCategory={selectedCategory}
        userProfile={userProfile}
        uploading={uploading}
        files={files}
        categories={categories}
        onFileUpload={(e) =>
          handleFileUpload(e, selectedCategory, userProfile, setUploading, (catId) =>
            fetchFiles(catId, setFiles)
          )
        }
        onDeleteFile={(file) => handleDeleteFile(file, userProfile, files, setFiles)}
        onDownloadFile={handleDownloadFile}
        previewFile={previewFile}
        previewType={previewType}
        textContent={textContent}
        onOpenPreview={(file) =>
          handleOpenPreview(file, setPreviewFile, setPreviewType, setTextContent)
        }
        onClosePreview={() => setPreviewFile(null)}
        onSelectCategory={setSelectedCategory}
        refreshFiles={(catId) => fetchFiles(catId, setFiles)}
        setFiles={setFiles}
      />

      <UserManagerModal
        show={showUserModal}
        onClose={() => setShowUserModal(false)}
        usersList={usersList}
        categories={categories}
        userPermissions={userPermissions}
        newUserEmail={newUserEmail}
        setNewUserEmail={setNewUserEmail}
        newUserPassword={newUserPassword}
        setNewUserPassword={setNewUserPassword}
        onCreateUser={(e) =>
          handleCreateUser(
            e,
            newUserEmail,
            newUserPassword,
            supabaseUrl,
            supabaseAnonKey,
            setNewUserEmail,
            setNewUserPassword,
            () => fetchUsersAndPermissions(setUsersList, setUserPermissions)
          )
        }
        onDeleteUser={(userId, userEmail) =>
          handleDeleteUser(userId, userEmail, usersList, setUsersList)
        }
        onTogglePermission={(userId, categoryIds, shouldEnable) =>
          handleTogglePermission(
            userId,
            categoryIds,
            shouldEnable,
            userPermissions,
            setUserPermissions
          )
        }
      />
    </div>
  );
}