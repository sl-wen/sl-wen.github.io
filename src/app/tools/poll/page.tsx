/**
 * 投票器工具页（/tools/poll）
 *
 * 功能概览：
 * - 创建投票：游客 + 登录用户均可发起投票
 *   - 游客：通过设备唯一 ID 限制“每天 1 次”
 *   - 登录用户：传递 user_id 到 Supabase，后端可以在 RPC 中扣积分
 * - 分享投票：创建后生成带 id 的链接 `/tools/poll?id=xxx`，支持复制分享
 * - 参与投票：访问带 id 的链接即可投票，无需登录
 *   - 使用设备 ID / user_id 限制“一人一票”（由后端 RPC 保证）
 *   - 支持多选，受字段 max_choices 限制
 * - 查看结果：所有访问者均可看到实时票数与百分比
 *
 * 前端只负责：
 * - 状态管理与表单校验
 * - 调用 Supabase RPC / 视图获取和提交数据
 * 安全与次数限制由 Supabase（后端）负责。
 */

'use client';

import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/utils/auth-context';
import type { PollWithOptions } from '@/utils/pollService';
import {
  createPoll,
  getDeviceId,
  getPollById,
  hasCreatedPollToday,
  hasVotedOnPoll,
  voteOnPoll
} from '@/utils/pollService';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

// 页面模式：创建模式 / 查看模式
type Mode = 'create' | 'view';

// 选项数量上下限
const MAX_OPTIONS = 8;
const MIN_OPTIONS = 2;

// 外层页面组件：只负责 Suspense 包裹，内部真正使用 useSearchParams 的子组件
export default function PollPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400 text-sm">加载中...</div>
        </div>
      }
    >
      <PollToolPageInner />
    </Suspense>
  );
}

function PollToolPageInner() {
  // 读取 URL 中的 ?id，用来判断是“创建”还是“查看”
  const searchParams = useSearchParams();
  const pollIdFromUrl = searchParams.get('id');
  const mode: Mode = pollIdFromUrl ? 'view' : 'create';

  // 登录用户信息（如果已登录）
  const { userProfile } = useAuth();

  // 设备唯一 ID（用于识别“游客”）
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // ===== 创建投票相关状态 =====
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [maxChoices, setMaxChoices] = useState(1);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [canCreateToday, setCanCreateToday] = useState<boolean | null>(null);

  // ===== 查看 / 投票相关状态 =====
  const [poll, setPoll] = useState<PollWithOptions | null>(null);
  const [loadingPoll, setLoadingPoll] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState(new Set<string>());
  const [submittingVote, setSubmittingVote] = useState(false);
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);

  // 页面挂载后生成或读取设备 ID
  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

  // 创建模式：检查当日是否已经创建过投票（游客 + 登录用户）
  useEffect(() => {
    const checkCreateLimit = async () => {
      if (!deviceId && !userProfile?.user_id) return;
      try {
        const result = await hasCreatedPollToday({
          creatorUserId: userProfile?.user_id ?? null,
          creatorDeviceId: deviceId ?? null
        });
        setCanCreateToday(!result);
      } catch {
        setCanCreateToday(true);
      }
    };
    if (mode === 'create') {
      checkCreateLimit();
    }
  }, [mode, deviceId, userProfile?.user_id]);

  // 查看模式：根据 URL 中的 pollId 加载投票详情
  useEffect(() => {
    const loadPoll = async () => {
      if (!pollIdFromUrl) return;
      setLoadingPoll(true);
      setPollError(null);
      try {
        const data = await getPollById(pollIdFromUrl);
        if (!data) {
          setPollError('未找到该投票');
        } else {
          setPoll(data);
        }
      } catch (error) {
        setPollError(error instanceof Error ? error.message : '加载投票失败');
      } finally {
        setLoadingPoll(false);
      }
    };
    loadPoll();
  }, [pollIdFromUrl]);

  // 查看模式：检查当前设备 / 用户是否已经投过票
  useEffect(() => {
    const checkVoted = async () => {
      if (!pollIdFromUrl || (!deviceId && !userProfile?.user_id)) return;
      try {
        const voted = await hasVotedOnPoll({
          pollId: pollIdFromUrl,
          voterUserId: userProfile?.user_id ?? null,
          voterDeviceId: deviceId ?? null
        });
        setHasVoted(voted);
      } catch {
        setHasVoted(false);
      }
    };
    if (mode === 'view') {
      checkVoted();
    }
  }, [mode, pollIdFromUrl, deviceId, userProfile?.user_id]);

  // 计算当前投票总票数，用于百分比展示
  const totalVotes = useMemo(() => {
    if (!poll?.options) return 0;
    return poll.options.reduce((sum, o) => sum + (o.votes_count || 0), 0);
  }, [poll]);

  // 更新某个选项的文案
  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // 添加一个空选项（最多 MAX_OPTIONS 个）
  const addOption = () => {
    setOptions((prev) => {
      if (prev.length >= MAX_OPTIONS) return prev;
      return [...prev, ''];
    });
  };

  // 删除指定下标的选项（至少保留 MIN_OPTIONS 个）
  const removeOption = (index: number) => {
    setOptions((prev) => {
      if (prev.length <= MIN_OPTIONS) return prev;
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
  };

  // 提交创建投票
  // - 前端只做基础校验，真正的频次限制和积分扣除在 Supabase RPC 中处理
  const handleCreate = useCallback(async () => {
    if (!deviceId && !userProfile?.user_id) {
      setCreateError('无法识别设备，请稍后重试');
      return;
    }
    if (!title.trim()) {
      setCreateError('请填写投票标题');
      return;
    }

    const cleanedOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanedOptions.length < MIN_OPTIONS) {
      setCreateError(`至少需要 ${MIN_OPTIONS} 个选项`);
      return;
    }

    if (maxChoices < 1 || maxChoices > cleanedOptions.length) {
      setCreateError('最多可选数量必须在 1 和选项数之间');
      return;
    }

    if (canCreateToday === false) {
      setCreateError('今天已创建过投票，请明天再试');
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const pollData = await createPoll({
        title: title.trim(),
        description: description.trim() || undefined,
        options: cleanedOptions,
        maxChoices,
        expiresAt: null,
        creatorUserId: userProfile?.user_id ?? null,
        creatorDeviceId: deviceId ?? null
      });
      const url = new URL(window.location.href);
      url.searchParams.set('id', pollData.poll_id);
      window.history.replaceState(null, '', url.toString());
      setPoll(pollData);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '创建投票失败');
    } finally {
      setCreating(false);
    }
  }, [deviceId, userProfile?.user_id, title, description, options, maxChoices, canCreateToday]);

  // 切换某个选项的勾选状态（多选）
  // - 当已选数量达到 max_choices 时，不再允许选更多
  const toggleSelectOption = (optionId: string) => {
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        if (poll && next.size >= poll.max_choices) {
          return next;
        }
        next.add(optionId);
      }
      return next;
    });
  };

  // 提交投票
  // - 使用 RPC：vote_on_poll；后端保证“一人一票”和幂等性
  const handleVote = async () => {
    if (!poll || selectedOptions.size === 0) return;
    if (!deviceId && !userProfile?.user_id) {
      setPollError('无法识别设备，请稍后重试');
      return;
    }
    if (hasVoted) {
      setPollError('已参与过该投票');
      return;
    }

    setSubmittingVote(true);
    setPollError(null);
    try {
      await voteOnPoll({
        pollId: poll.poll_id,
        optionIds: Array.from(selectedOptions),
        voterUserId: userProfile?.user_id ?? null,
        voterDeviceId: deviceId ?? null
      });
      const updated = await getPollById(poll.poll_id);
      if (updated) {
        setPoll(updated);
      }
      setHasVoted(true);
    } catch (error) {
      setPollError(error instanceof Error ? error.message : '投票失败');
    } finally {
      setSubmittingVote(false);
    }
  };

  // 生成当前投票的分享链接（带 ?id 参数）
  const shareUrl = useMemo(() => {
    if (!poll) return '';
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.origin + '/tools/poll');
    url.searchParams.set('id', poll.poll_id);
    return url.toString();
  }, [poll]);

  // 复制分享链接到剪贴板（失败时直接弹出链接文本）
  const handleCopyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('分享链接已复制');
    } catch {
      alert(shareUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">投票器</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            游客每日可发起 1 次投票，登录用户可通过消耗积分发起，分享链接后他人可直接参与投票。
          </p>
        </div>

        {mode === 'create' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
            {canCreateToday === false && (
              <div className="mb-4 text-sm text-orange-600 dark:text-orange-400">
                今天已经创建过投票，继续创建可能会失败。
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                标题
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入投票标题"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                描述（可选）
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="补充说明或规则"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  选项
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-blue-600 dark:text-blue-400"
                  disabled={options.length >= MAX_OPTIONS}
                >
                  添加选项（最多 {MAX_OPTIONS} 个）
                </button>
              </div>
              <div className="space-y-2">
                {options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`选项 ${index + 1}`}
                    />
                    {options.length > MIN_OPTIONS && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-xs text-red-500"
                      >
                        删除
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                每人最多可选数量
              </label>
              <Input
                type="number"
                min={1}
                max={options.length || 1}
                value={maxChoices}
                onChange={(e) => setMaxChoices(Number(e.target.value) || 1)}
              />
            </div>

            {createError && (
              <div className="mb-4 text-sm text-red-600 dark:text-red-400">{createError}</div>
            )}

            <Button onClick={handleCreate} isLoading={creating}>
              创建投票
            </Button>
          </div>
        )}

        {mode === 'view' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            {loadingPoll && <div className="text-gray-500 dark:text-gray-400">加载中...</div>}
            {pollError && <div className="text-red-600 dark:text-red-400 mb-4">{pollError}</div>}
            {poll && (
              <>
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {poll.title}
                  </h2>
                  {poll.description && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {poll.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    每人最多可选 {poll.max_choices} 项
                  </p>
                </div>

                <div className="space-y-3 mb-4">
                  {poll.options.map((opt) => {
                    const percent = totalVotes
                      ? Math.round(((opt.votes_count || 0) / totalVotes) * 100)
                      : 0;
                    const checked = selectedOptions.has(opt.option_id);
                    return (
                      <button
                        key={opt.option_id}
                        type="button"
                        onClick={() => toggleSelectOption(opt.option_id)}
                        className={`w-full text-left border rounded-lg px-3 py-2 text-sm transition-colors ${checked
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700'
                          }`}
                        disabled={hasVoted || submittingVote}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-900 dark:text-white">{opt.text}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {opt.votes_count || 0} 票 {totalVotes ? `(${percent}%)` : ''}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!hasVoted && (
                  <Button
                    onClick={handleVote}
                    isLoading={submittingVote}
                    disabled={selectedOptions.size === 0}
                  >
                    提交投票
                  </Button>
                )}
                {hasVoted && (
                  <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                    已记录你的投票，随时可查看最新结果。
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      当前总票数：{totalVotes}
                    </div>
                    {shareUrl && (
                      <button
                        type="button"
                        onClick={handleCopyShare}
                        className="text-xs text-blue-600 dark:text-blue-400"
                      >
                        复制分享链接
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
