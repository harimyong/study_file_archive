'use client';
import { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from './lib/supabaseClient';
import { Menu } from 'lucide-react';

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
      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between z-20">
        <span className="font-bold text-indigo-600">Study File Archive</span>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1 text-gray-600 hover:text-indigo-600 focus:outline-none"
        >
          <Menu size={24} />
        </button>
      </div>

      <CategorySidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
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
          fetchUsersAndPermissions(setUsersList, setUserPermissions);
        }}
        onLogout={() => supabase.auth.signOut()}
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