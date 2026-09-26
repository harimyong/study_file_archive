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

  // 1. 최상위 디렉토리(parent_id가 null/undefined) 바로 밑의 직계 하위 디렉토리만 추출
  const rootCategories = categories.filter((c) => !c.parent_id);
  const rootCategoryIds = rootCategories.map((c) => c.id);

  // 최상위 직계 하위 폴더들 (parent_id가 최상위 폴더 ID 중 하나인 경우)
  const directSubCategories = categories.filter((c) =>
    rootCategoryIds.includes(c.parent_id)
  );

  // 2. 특정 폴더 ID를 기준으로 모든 재귀적 하위 자식 폴더 ID 배열을 수집하는 함수
  const getAllChildCategoryIds = (parentId) => {
    let childIds = [];
    const directChildren = categories.filter((c) => c.parent_id === parentId);

    directChildren.forEach((child) => {
      childIds.push(child.id);
      childIds = childIds.concat(getAllChildCategoryIds(child.id));
    });

    return childIds;
  };

  // 3. 체크박스 클릭 핸들러 (부모 체크 시 부모 + 모든 하위 자식 폴더 함께 토글)
  const handleCategoryToggle = (userId, targetCategory) => {
    // 선택한 카테고리 본인 ID + 모든 하위 자식 폴더 ID 목록
    const allRelatedIds = [
      targetCategory.id,
      ...getAllChildCategoryIds(targetCategory.id),
    ];

    const currentPerms = userPermissions[userId] || [];
    const isCurrentlyChecked = currentPerms.includes(targetCategory.id);

    // 부모 및 모든 하위 폴더 ID 들을 일괄 토글 전달
    onTogglePermission(userId, allRelatedIds, !isCurrentlyChecked);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
            <h4 className="font-semibold text-sm text-gray-700 mb-3">
              신규 유저 생성 (일반 ID)
            </h4>
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
            <h4 className="font-semibold text-sm text-gray-700 mb-3">
              등록된 유저 권한 및 삭제 관리
            </h4>
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

                    {/* 최상위 디렉토리 바로 밑 직계 하위 폴더 목록만 체크박스로 표출 */}
                    <div className="flex flex-wrap gap-3">
                      {directSubCategories.length === 0 ? (
                        <p className="text-xs text-gray-400">
                          선택 가능한 하위 카테고리가 없습니다.
                        </p>
                      ) : (
                        directSubCategories.map((cat) => {
                          const isChecked = (
                            userPermissions[usr.id] || []
                          ).includes(cat.id);
                          return (
                            <label
                              key={cat.id}
                              className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer bg-gray-50 px-2.5 py-1.5 rounded border hover:bg-indigo-50"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  handleCategoryToggle(usr.id, cat)
                                }
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>📁 {cat.name}</span>
                            </label>
                          );
                        })
                      )}
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