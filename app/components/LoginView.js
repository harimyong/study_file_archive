'use client';
import { HardDrive } from 'lucide-react';

export default function LoginView({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  authError,
  onLogin,
}) {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border">
        <div className="flex items-center justify-center space-x-2 text-indigo-600 mb-6">
          <HardDrive size={32} />
          <h1 className="text-2xl font-bold">Study File Archive</h1>
        </div>
        <p className="text-gray-500 text-center text-sm mb-6">서비스 이용을 위해 로그인해 주세요.</p>

        {authError && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{authError}</div>
        )}

        <form onSubmit={onLogin} className="space-y-4">
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