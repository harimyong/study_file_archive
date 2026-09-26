'use client';
import { ShieldCheck, X, UserX } from 'lucide-react';

export default function UserManagerModal({
  show,
  onClose,
  usersList,
  categories,
  userPermissions,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  onCreateUser,
  onDeleteUser,
  onTogglePermission,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col p-6 shadow-xl overflow-hidden">
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center pb-3 border-b mb-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
            <ShieldCheck />
            <span>유저 계정 및 카테고리 권한 관리</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-6 pr-2">
          {/* 신규 유저 생성 */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-sm text-gray-700 mb-3">신규 유저 생성 (일반 ID)</h4>
            <form onSubmit={onCreateUser} className="flex gap-2">
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
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm font-medium"
              >
                생성
              </button>
            </form>
          </div>

          {/* 유저 목록 및 권한 설정 / 유저 삭제 */}
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
                        onClick={() => onDeleteUser(usr.id, usr.email)}
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
                          <label
                            key={cat.id}
                            className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer bg-gray-50 px-2 py-1 rounded border"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onTogglePermission(usr.id, cat.id)}
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
  );
}