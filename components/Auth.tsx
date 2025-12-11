import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { AuthResponse } from '../types';

interface AuthProps {
  onAuthSuccess: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('remember_email');
      const savedRemember = localStorage.getItem('remember_me');
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
      }
      if (savedRemember) {
        setRemember(savedRemember === 'true');
      }
    } catch {}
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login
        const response = await apiService.login(formData.email, formData.password);
        onAuthSuccess(response.user);
        if (remember) {
          localStorage.setItem('remember_email', formData.email);
          localStorage.setItem('remember_me', 'true');
        } else {
          localStorage.removeItem('remember_email');
          localStorage.setItem('remember_me', 'false');
        }
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          setError('密码确认不匹配');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('密码至少需要6个字符');
          setLoading(false);
          return;
        }

        const response = await apiService.register(formData.email, formData.username, formData.password);
        onAuthSuccess(response.user);
        if (remember) {
          localStorage.setItem('remember_email', formData.email);
          localStorage.setItem('remember_me', 'true');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4">
      <div className="bg-white/90 backdrop-blur-lg border-4 border-black rounded-3xl shadow-dopamine p-8 w-full max-w-md">
        <h1 className="text-3xl font-black text-center mb-8">
          <span className="text-primary">o</span>
          <span className="text-secondary">R</span>
          <span className="text-accent">A</span>
          <span className="text-highlight">I</span>
          <span className="text-fresh">N</span>
          <span className="text-fun-blue">ginal</span>
        </h1>

        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? '登录' : '注册'}
        </h2>

        {error && (
          <div className="bg-red-100 border-2 border-red-300 rounded-lg p-3 mb-4 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              name="email"
              placeholder="邮箱地址"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/20 bg-white/80"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <input
                type="text"
                name="username"
                placeholder="用户名"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/20 bg-white/80"
                required
              />
            </div>
          )}

          <div>
            <input
              type="password"
              name="password"
              placeholder="密码"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/20 bg-white/80"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="确认密码"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/20 bg-white/80"
                required
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 border-2 border-black rounded"
            />
            记住我（保存邮箱）
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-6 rounded-lg border-2 border-black shadow-dopamine hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-highlight hover:underline font-medium"
          >
            {isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
          </button>
          {isLogin && (
            <div className="mt-2 text-xs text-gray-500">已登录的令牌会自动保留7天，期间无需再次登录。</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
