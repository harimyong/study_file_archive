'use client';
import { useState } from 'react';
import { ShieldCheck, X, UserX, Plus } from 'lucide-react';

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
  // 유저별 드롭다운 선택 상태 관리
  const [selectedCategoryMap, setSelectedCategoryMap] = useState({});

  if (!show) return null;

  // 1. 최상위 카테고리만 필터링 (parent_id가 null 또는 undefined인 카테고리)
  const topLevelCategories = categories.filter((c) => !c.parent_id);

  // 2. 선택한 카테고리의 모든 재귀적 하위 자식 폴더 ID 수집
  const getAllChildCategoryIds = (parentId) => {
    let childIds = [];
    const directChildren = categories.filter((c) => c.parent_id === parentId);

    directChildren.forEach((child) => {
      childIds.push(child.id);
      childIds = childIds.concat(getAllChildCategoryIds(child.id));
    });

    return childIds;
  };

  // 3. 드롭다운 선택 시 해당 유저에게 권한 추가
  const handleAddCategoryPermission = (userId) => {
    const targetCatId = selectedCategoryMap[userId];
    if (!targetCatId) return;

    const targetCategory = categories.find((c) => c.id === targetCatId);
    if (!targetCategory) return;

    // 해당 최상위 카테고리 + 모든 하위 폴더 ID 수집
    const allRelatedIds = [
      targetCategory.id,
      ...getAllChildCategoryIds(targetCategory.id),
    ];

    // 권한 부여 (true)
    onTogglePermission(userId, allRelatedIds, true);

    // 드롭다운 선택 초기화
    setSelectedCategoryMap({ ...selectedCategoryMap, [userId]: '' });
  };

  // 4. 이미 부여된 권한 삭제 (X 버튼 클릭)
  const handleRemoveCategoryPermission = (userId, categoryId) => {
    const targetCategory = categories.find((c) => c.id === categoryId);
    if (!targetCategory) return;

    const allRelatedIds = [
      targetCategory.id,
      ...getAllChildCategoryIds(targetCategory.id),
    ];

    // 권한 제거 (false)
    onTogglePermission(userId, allRelatedIds, false);
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

          {/* 유저 목록 및 드롭다운 기반 카테고리 권한 관리 */}
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-3">
              등록된 유저 권한 및 삭제 관리
            </h4>
            {usersList.length === 0 ? (
              <p className="text-xs text-gray-400">등록된 유저가 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {usersList.map((usr) => {
                  const currentPermIds = userPermissions[usr.id] || [];

                  // 현재 유저가 부여받은 최상위 카테고리들만 필터링
                  const userTopLevelCategories = topLevelCategories.filter(
                    (cat) => currentPermIds.includes(cat.id)
                  );

                  // 유저에게 아직 부여되지 않은 최상위 카테고리들 (드롭다운 옵션)
                  const unassignedTopCategories = topLevelCategories.filter(
                    (cat) => !currentPermIds.includes(cat.id)
                  );

                  return (
                    <div key={usr.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-sm text-indigo-900">
                          👤 {usr.email.replace('@archive.local', '')}
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

                      {/* 드롭다운 카테고리 권한 추가 영역 */}
                      <div className="flex items-center gap-2 mb-3">
                        <select
                          value={selectedCategoryMap[usr.id] || ''}
                          onChange={(e) =>
                            setSelectedCategoryMap({
                              ...selectedCategoryMap,
                              [usr.id]: e.target.value,
                            })
                          }
                          className="text-xs border rounded px-2.5 py-1.5 bg-white flex-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">추가할 카테고리 선택...</option>
                          {unassignedTopCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              📁 {cat.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAddCategoryPermission(usr.id)}
                          disabled={!selectedCategoryMap[usr.id]}
                          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-3 py-1.5 rounded text-xs font-medium transition"
                        >
                          <Plus size={14} />
                          <span>권한 추가</span>
                        </button>
                      </div>

                      {/* 부여된 카테고리 뱃지 목록 */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {userTopLevelCategories.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">
                            부여된 카테고리 권한이 없습니다.
                          </span>
                        ) : (
                          userTopLevelCategories.map((cat) => (
                            <span
                              key={cat.id}
                              className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-medium"
                            >
                              <span>📁 {cat.name}</span>
                              <button
                                onClick={() =>
                                  handleRemoveCategoryPermission(usr.id, cat.id)
                                }
                                className="text-indigo-400 hover:text-indigo-900 rounded-full p-0.5"
                                title="권한 제거"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}