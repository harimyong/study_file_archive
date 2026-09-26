'use client';
import { HardDrive, FolderPlus, Trash2, Users, LogOut } from 'lucide-react';

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
}) {
  return (
    <div className="w-64 bg-white border-r p-4 flex flex-col justify-between h-full">
      <div>
        {/* 서비스 로고 */}
        <div className="flex items-center space-x-2 text-indigo-600 mb-6 font-bold text-lg">
          <HardDrive />
          <span>Study File Archive</span>
        </div>

        {/* 관리자 전용: 새 카테고리 추가 */}
        {userProfile?.role === 'admin' && (
          <form onSubmit={onCreateCategory} className="mb-4 flex gap-1">
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
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm group ${
                selectedCategory?.id === cat.id
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="truncate">📁 {cat.name}</span>
              {userProfile?.role === 'admin' && (
                <Trash2
                  size={14}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-500"
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

      {/* 사이드바 하단: 사용자 정보, 유저 관리 모달 열기, 로그아웃 */}
      <div className="border-t pt-4 space-y-2">
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