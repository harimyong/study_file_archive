'use client';
import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, X, UserX, Plus, ChevronDown, Check } from 'lucide-react';

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
  // 유저별 드롭다운 열림/닫힘 상태
  const [openDropdownMap, setOpenDropdownMap] = useState({});
  // 유저별 다중 선택된 카테고리 ID 배열 { [userId]: [catId1, catId2, ...] }
  const [selectedCategoriesMap, setSelectedCategoriesMap] = useState({});

  const modalRef = useRef(null);

  // 모달 외부 또는 드롭다운 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-dropdown-container')) {
        setOpenDropdownMap({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!show) return null;

  // 1. 최상위 카테고리만 필터링
  const topLevelCategories = categories.filter((c) => !c.parent_id);

  // 2. 특정 카테고리 ID의 모든 재귀적 자식 폴더 ID 수집
  const getAllChildCategoryIds = (parentId) => {
    let childIds = [];
    const directChildren = categories.filter((c) => c.parent_id === parentId);

    directChildren.forEach((child) => {
      childIds.push(child.id);
      childIds = childIds.concat(getAllChildCategoryIds(child.id));
    });

    return childIds;
  };

  // 3. 드롭다운 토글 (열기/닫기)
  const toggleDropdown = (userId) => {
    setOpenDropdownMap((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // 4. 체크박스 선택/해제 토글
  const handleCheckCategory = (userId, categoryId) => {
    const currentSelected = selectedCategoriesMap[userId] || [];
    let updated = [];

    if (currentSelected.includes(categoryId)) {
      updated = currentSelected.filter((id) => id !== categoryId);
    } else {
      updated = [...currentSelected, categoryId];
    }

    setSelectedCategoriesMap({
      ...selectedCategoriesMap,
      [userId]: updated,
    });
  };

  // 5. 선택된 여러 카테고리 일괄 권한 추가
  const handleAddMultiplePermissions = (userId) => {
    const selectedCatIds = selectedCategoriesMap[userId] || [];
    if (selectedCatIds.length === 0) return;

    // 선택된 카테고리들 + 각 카테고리의 모든 하위 폴더 ID 포함
    let allTargetIds = [];
    selectedCatIds.forEach((catId) => {
      allTargetIds.push(catId);
      allTargetIds = allTargetIds.concat(getAllChildCategoryIds(catId));
    });

    // 중복 제거
    const uniqueTargetIds = Array.from(new Set(allTargetIds));

    // 권한 부여 (true)
    onTogglePermission(userId, uniqueTargetIds, true);

    // 선택 초기화 및 드롭다운 닫기
    setSelectedCategoriesMap({ ...selectedCategoriesMap, [userId]: [] });
    setOpenDropdownMap({ ...openDropdownMap, [userId]: false });
  };

  // 6. 단일 권한 삭제 (뱃지 X 버튼 클릭)
  const handleRemovePermission = (userId, categoryId) => {
    const allRelatedIds = [
      categoryId,
      ...getAllChildCategoryIds(categoryId),
    ];

    onTogglePermission(userId, allRelatedIds, false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col p-6 shadow-xl overflow-hidden"
      >
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

          {/* 유저 목록 및 다중 선택 드롭다운 권한 관리 */}
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

                  // 현재 유저가 이미 부여받은 최상위 카테고리 목록
                  const userTopLevelCategories = topLevelCategories.filter(
                    (cat) => currentPermIds.includes(cat.id)
                  );

                  // 유저에게 아직 부여되지 않은 최상위 카테고리 목록 (선택 옵션)
                  const unassignedTopCategories = topLevelCategories.filter(
                    (cat) => !currentPermIds.includes(cat.id)
                  );

                  const selectedCatIds = selectedCategoriesMap[usr.id] || [];
                  const isOpen = openDropdownMap[usr.id] || false;

                  return (
                    <div key={usr.id} className="border rounded-lg p-4 bg-white">
                      {/* 유저 ID 정보 및 삭제 버튼 */}
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

                      {/* 커스텀 다중 선택 드롭다운 컨트롤 */}
                      <div className="flex items-center gap-2 mb-3 relative">
                        <div className="relative flex-1 custom-dropdown-container">
                          <button
                            type="button"
                            onClick={() => toggleDropdown(usr.id)}
                            className="w-full text-left text-xs border rounded px-3 py-2 bg-white flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <span className="truncate text-gray-700">
                              {selectedCatIds.length === 0
                                ? '추가할 카테고리 선택 (다중 선택 가능)...'
                                : `${selectedCatIds.length}개 카테고리 선택됨`}
                            </span>
                            <ChevronDown size={14} className="text-gray-400" />
                          </button>

                          {/* 드롭다운 메뉴 레이어 */}
                          {isOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto p-1 space-y-0.5">
                              {unassignedTopCategories.length === 0 ? (
                                <div className="p-2 text-xs text-gray-400 text-center">
                                  추가 가능한 카테고리가 없습니다.
                                </div>
                              ) : (
                                unassignedTopCategories.map((cat) => {
                                  const isChecked = selectedCatIds.includes(cat.id);
                                  return (
                                    <label
                                      key={cat.id}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center justify-between px-2.5 py-1.5 hover:bg-indigo-50 rounded cursor-pointer text-xs text-gray-700 transition"
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() =>
                                            handleCheckCategory(usr.id, cat.id)
                                          }
                                          className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>📁 {cat.name}</span>
                                      </div>
                                      {isChecked && (
                                        <Check size={12} className="text-indigo-600" />
                                      )}
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>

                        {/* 권한 추가 버튼 */}
                        <button
                          type="button"
                          onClick={() => handleAddMultiplePermissions(usr.id)}
                          disabled={selectedCatIds.length === 0}
                          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-3.5 py-2 rounded text-xs font-medium transition whitespace-nowrap"
                        >
                          <Plus size={14} />
                          <span>선택 항목 추가 ({selectedCatIds.length})</span>
                        </button>
                      </div>

                      {/* 부여된 카테고리 태그 뱃지 목록 */}
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
                                type="button"
                                onClick={() => handleRemovePermission(usr.id, cat.id)}
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