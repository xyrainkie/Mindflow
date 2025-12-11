import React, { useState, useEffect, useRef } from 'react';
import { PomodoroSession, PomodoroType, PomodoroStatus, PomodoroSettings } from '../types';
import {
  ClockIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  SettingsIcon,
  ChevronLeftIcon,
  CheckIcon,
  CoffeeIcon
} from './Icons';

interface PomodoroTimerProps {
  onBack?: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onBack }) => {
  const [session, setSession] = useState<PomodoroSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [stats, setStats] = useState({
    totalWorkTime: 0,
    totalSessions: 0,
    todayWorkTime: 0,
    todaySessions: 0
  });

  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('pomodoroStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }

    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
  }, [settings]);

  // Timer effect
  useEffect(() => {
    if (session?.status === PomodoroStatus.RUNNING && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session?.status, timeRemaining]);

  const completeSession = () => {
    if (!session) return;

    const completedSession = {
      ...session,
      status: PomodoroStatus.COMPLETED,
      endTime: Date.now()
    };

    // Update stats
    const sessionDuration = (session.duration - timeRemaining) / 60;
    const isToday = new Date(session.startTime).toDateString() === new Date().toDateString();

    setStats(prev => ({
      totalWorkTime: prev.totalWorkTime + (session.type === PomodoroType.WORK ? sessionDuration : 0),
      totalSessions: prev.totalSessions + 1,
      todayWorkTime: prev.todayWorkTime + (session.type === PomodoroType.WORK && isToday ? sessionDuration : 0),
      todaySessions: prev.todaySessions + (isToday ? 1 : 0)
    }));

    localStorage.setItem('pomodoroStats', JSON.stringify({
      totalWorkTime: stats.totalWorkTime + (session.type === PomodoroType.WORK ? sessionDuration : 0),
      totalSessions: stats.totalSessions + 1,
      todayWorkTime: stats.todayWorkTime + (session.type === PomodoroType.WORK && isToday ? sessionDuration : 0),
      todaySessions: stats.todaySessions + (isToday ? 1 : 0)
    }));

    if (session.type === PomodoroType.WORK) {
      setCompletedSessions(prev => prev + 1);
    }

    setSession(completedSession);

    // Play notification sound
    if (settings.soundEnabled) {
      playAlarmAudio();
    }

    // Auto start next session if enabled
    const nextType = getNextSessionType(completedSession.type);
    if ((nextType !== PomodoroType.WORK && settings.autoStartBreaks) ||
        (nextType === PomodoroType.WORK && settings.autoStartPomodoros)) {
      setTimeout(() => startSession(nextType), 2000);
    }
  };

  const getNextSessionType = (currentType: PomodoroType): PomodoroType => {
    if (currentType === PomodoroType.WORK) {
      const isLongBreakTime = (completedSessions + 1) % settings.longBreakInterval === 0;
      return isLongBreakTime ? PomodoroType.LONG_BREAK : PomodoroType.SHORT_BREAK;
    }
    return PomodoroType.WORK;
  };

  const startSession = (type: PomodoroType) => {
    const duration = type === PomodoroType.WORK ? settings.workDuration * 60 :
                   type === PomodoroType.SHORT_BREAK ? settings.shortBreakDuration * 60 :
                   settings.longBreakDuration * 60;

    const newSession: PomodoroSession = {
      id: Date.now().toString(),
      type,
      duration,
      startTime: Date.now(),
      status: PomodoroStatus.RUNNING,
      taskDescription: type === PomodoroType.WORK ? currentTask : undefined
    };

    setSession(newSession);
    setTimeRemaining(duration);
  };

  const pauseSession = () => {
    if (session) {
      setSession({ ...session, status: PomodoroStatus.PAUSED });
    }
  };

  const resumeSession = () => {
    if (session) {
      setSession({ ...session, status: PomodoroStatus.RUNNING });
    }
  };

  const stopSession = () => {
    if (session) {
      setSession({ ...session, status: PomodoroStatus.CANCELLED });
      setTimeRemaining(0);
    }
  };

  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api';
      const url = `${base.replace(/\/$/, '')}/assets/alarm`;
      const a = new Audio(url);
      a.preload = 'auto';
      alarmAudio.current = a;
    } catch {}
  }, []);

  const playAlarmAudio = () => {
    const a = alarmAudio.current;
    if (a) {
      a.currentTime = 0;
      a.play().catch(() => {
        playNotificationSound();
      });
    } else {
      playNotificationSound();
    }
  };

  const playNotificationSound = () => {
    // Create a simple notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);

    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();

      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);

      oscillator2.frequency.value = 600;
      oscillator2.type = 'sine';
      gainNode2.gain.value = 0.3;

      oscillator2.start();
      oscillator2.stop(audioContext.currentTime + 0.3);
    }, 250);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTypeLabel = (type: PomodoroType): string => {
    switch (type) {
      case PomodoroType.WORK:
        return '专注时间';
      case PomodoroType.SHORT_BREAK:
        return '短休息';
      case PomodoroType.LONG_BREAK:
        return '长休息';
      default:
        return '';
    }
  };

  const getSessionTypeColor = (type: PomodoroType): string => {
    switch (type) {
      case PomodoroType.WORK:
        return 'text-orange-600 bg-orange-100 border-orange-300';
      case PomodoroType.SHORT_BREAK:
        return 'text-green-600 bg-green-100 border-green-300';
      case PomodoroType.LONG_BREAK:
        return 'text-blue-600 bg-blue-100 border-blue-300';
      default:
        return '';
    }
  };

  const getProgress = (): number => {
    if (!session || session.duration === 0) return 0;
    return ((session.duration - timeRemaining) / session.duration) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-200 via-red-200 to-pink-200 p-4 md:p-8">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b-4 border-black p-4 mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {onBack && (
              <button
                onClick={onBack}
                className="mr-4 p-2 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-3xl font-black text-gray-800 flex items-center">
              <span className="text-3xl mr-2">🍅</span>
              番茄时钟
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-gray-600">
              今日专注: {Math.floor(stats.todayWorkTime)} 分钟
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timer */}
        <div className="lg:col-span-2">
          <div className="bg-white/90 backdrop-blur-lg border-4 border-black rounded-3xl shadow-dopamine p-8">
            {/* Session Type */}
            {session && (
              <div className="mb-6 text-center">
                <span className={`px-4 py-2 rounded-full text-sm font-black border-2 ${getSessionTypeColor(session.type)}`}>
                  {getSessionTypeLabel(session.type)}
                </span>
              </div>
            )}

            {/* Timer Display */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <svg className="w-64 h-64 transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - getProgress() / 100)}`}
                    className={session?.type === PomodoroType.WORK ? 'text-orange-500' :
                              session?.type === PomodoroType.SHORT_BREAK ? 'text-green-500' :
                              session?.type === PomodoroType.LONG_BREAK ? 'text-blue-500' : 'text-gray-300'}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-black text-gray-800">
                    {formatTime(timeRemaining)}
                  </div>
                  {session?.taskDescription && session.type === PomodoroType.WORK && (
                    <div className="text-sm text-gray-600 mt-2 max-w-48 text-center">
                      {session.taskDescription}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center space-x-4 mb-8">
              {!session || session.status === PomodoroStatus.COMPLETED || session.status === PomodoroStatus.CANCELLED ? (
                <>
                  <button
                    onClick={() => startSession(PomodoroType.WORK)}
                    className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl border-4 border-black transition-colors flex items-center"
                  >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    开始专注
                  </button>
                  <button
                    onClick={() => startSession(PomodoroType.SHORT_BREAK)}
                    className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl border-4 border-black transition-colors flex items-center"
                  >
                    <CoffeeIcon className="w-5 h-5 mr-2" />
                    短休息
                  </button>
                </>
              ) : session.status === PomodoroStatus.RUNNING ? (
                <>
                  <button
                    onClick={pauseSession}
                    className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-black rounded-2xl border-4 border-black transition-colors flex items-center"
                  >
                    <PauseIcon className="w-5 h-5 mr-2" />
                    暂停
                  </button>
                  <button
                    onClick={stopSession}
                    className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl border-4 border-black transition-colors flex items-center"
                  >
                    <StopIcon className="w-5 h-5 mr-2" />
                    停止
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={resumeSession}
                    className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-2xl border-4 border-black transition-colors flex items-center"
                  >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    继续
                  </button>
                  <button
                    onClick={stopSession}
                    className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl border-4 border-black transition-colors flex items-center"
                  >
                    <StopIcon className="w-5 h-5 mr-2" />
                    停止
                  </button>
                </>
              )}
            </div>

            {/* Task Input */}
            {(!session || session.type === PomodoroType.WORK) && (
              <div className="border-t-2 border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  当前任务（可选）
                </label>
                <input
                  type="text"
                  value={currentTask}
                  onChange={(e) => setCurrentTask(e.target.value)}
                  placeholder="输入你正在专注的任务..."
                  className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-200 font-medium"
                  disabled={session?.status === PomodoroStatus.RUNNING}
                />
              </div>
            )}
          </div>
        </div>

        {/* Stats and Info */}
        <div className="space-y-6">
          {/* Today's Progress */}
          <div className="bg-white/90 backdrop-blur-lg border-4 border-black rounded-3xl shadow-dopamine p-6">
            <h3 className="text-xl font-black text-gray-800 mb-4">今日进度</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">专注次数</span>
                <span className="text-xl font-bold text-gray-800">{stats.todaySessions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">专注时间</span>
                <span className="text-xl font-bold text-gray-800">{Math.floor(stats.todayWorkTime)} 分钟</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">完成番茄</span>
                <span className="text-xl font-bold text-gray-800">{completedSessions}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>日目标</span>
                <span>{Math.min(completedSessions, 8)}/8 番茄</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((completedSessions / 8) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Total Stats */}
          <div className="bg-white/90 backdrop-blur-lg border-4 border-black rounded-3xl shadow-dopamine p-6">
            <h3 className="text-xl font-black text-gray-800 mb-4">总计统计</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">总专注次数</span>
                <span className="text-xl font-bold text-gray-800">{stats.totalSessions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">总专注时间</span>
                <span className="text-xl font-bold text-gray-800">{Math.floor(stats.totalWorkTime)} 分钟</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">平均时长</span>
                <span className="text-xl font-bold text-gray-800">
                  {stats.totalSessions > 0 ? Math.floor(stats.totalWorkTime / stats.totalSessions) : 0} 分钟
                </span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-yellow-300 rounded-3xl p-6">
            <h3 className="text-lg font-black text-gray-800 mb-3 flex items-center">
              <span className="text-2xl mr-2">💡</span>
              使用技巧
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                专注时关闭手机通知
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                休息时站起来活动
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                每完成4个番茄长休息
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                坚持使用养成好习惯
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black rounded-3xl shadow-dopamine max-w-md w-full p-6">
            <h3 className="text-xl font-black text-gray-800 mb-4">设置</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  专注时长（分钟）
                </label>
                <input
                  type="number"
                  value={settings.workDuration}
                  onChange={(e) => setSettings({...settings, workDuration: parseInt(e.target.value) || 25})}
                  min="1"
                  max="60"
                  className="w-full px-3 py-2 border-2 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  短休息时长（分钟）
                </label>
                <input
                  type="number"
                  value={settings.shortBreakDuration}
                  onChange={(e) => setSettings({...settings, shortBreakDuration: parseInt(e.target.value) || 5})}
                  min="1"
                  max="15"
                  className="w-full px-3 py-2 border-2 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  长休息时长（分钟）
                </label>
                <input
                  type="number"
                  value={settings.longBreakDuration}
                  onChange={(e) => setSettings({...settings, longBreakDuration: parseInt(e.target.value) || 15})}
                  min="1"
                  max="30"
                  className="w-full px-3 py-2 border-2 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  长休息间隔（专注次数）
                </label>
                <input
                  type="number"
                  value={settings.longBreakInterval}
                  onChange={(e) => setSettings({...settings, longBreakInterval: parseInt(e.target.value) || 4})}
                  min="2"
                  max="8"
                  className="w-full px-3 py-2 border-2 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => setSettings({...settings, soundEnabled: e.target.checked})}
                    className="w-4 h-4 text-orange-600 border-2 border-black rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">启用提示音</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-2xl border-2 border-black transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
