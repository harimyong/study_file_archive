'use client';
import { HardDrive, FolderPlus, Trash2, Users, LogOut, Folder, X } from 'lucide-react';

export default function CategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  userProfile,
  session,
  newCategoryName,
  setNewCategoryName,
  onCreateCategory,
  onDeleteCategory,
  onOpenUserModal,
  onLogout,
  isMobileOpen,
  onCloseMobile
}) {
  // 현재 위치(selectedCategory)의 직접적인 하위 폴더들만 필터링
  const currentSubFolders = categories.filter(
    (cat) => cat.parent_id === (selectedCategory ? selectedCategory.id : null)
  );

  return (
    <div
      className={`${
        isMobileOpen ? 'block' : 'hidden'
      } md:block w-full md:w-64 bg-white border-r p-4 flex flex-col justify-between h-full fixed md:static inset-y-0 left-0 z-30 transition-all`}
    >
      <div>
        {/* 상단 헤더 & 모바일 닫기 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-lg">
            <HardDrive />
            <span>Study File Archive</span>
          </div>
          <button onClick={onCloseMobile} className="md:hidden text-gray-500 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {/* 새 폴더/하위 폴더 추가 폼 */}
        {userProfile?.role === 'admin' && (
          <form onSubmit={onCreateCategory} className="mb-4 flex gap-1">
            <input
              type="text"
              placeholder={
                selectedCategory ? `'${selectedCategory.name}' 하위 폴더...` : '최상위 카테고리...'
              }
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white p-1 rounded hover:bg-indigo-700 flex-shrink-0"
              title="폴더 생성"
            >
              <FolderPlus size={18} />
            </button>
          </form>
        )}

        {/* 폴더 탐색 트리가 표시되는 영역 */}
        <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
          {/* 최상위 루트 버튼 */}
          <div
            onClick={() => {
              onSelectCategory(null);
              onCloseMobile();
            }}
            className={`flex items-center p-2 rounded cursor-pointer text-sm ${
              selectedCategory === null
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Folder size={16} className="mr-2 text-amber-500" />
            <span>최상위 (루트)</span>
          </div>

          {/* 현재 폴더 내의 하위 폴더 목록 */}
          {currentSubFolders.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat);
                onCloseMobile();
              }}
              className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm group ${
                selectedCategory?.id === cat.id
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="truncate flex items-center gap-1">
                📁 {cat.name}
              </span>
              {userProfile?.role === 'admin' && (
                <Trash2
                  size={14}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCategory(cat.id);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 사용자 프로필 및 계정 관리 */}
      <div className="border-t pt-4 space-y-2 bg-white">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span className="truncate font-medium">
            {session?.user?.email?.replace('@archive.local', '')}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              userProfile?.role === 'admin'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {userProfile?.role === 'admin' ? '관리자' : '유저'}
          </span>
        </div>

        {userProfile?.role === 'admin' && (
          <button
            onClick={onOpenUserModal}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-medium"
          >
            <Users size={14} />
            <span>유저 및 권한 관리</span>
          </button>
        )}

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded text-xs font-medium"
        >
          <LogOut size={14} />
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  );
}