import { supabase } from './supabase-config';

// 投票选项实体
// 对应表：poll_options
export interface PollOption {
    option_id: string; // 选项主键 ID（UUID）
    poll_id: string; // 所属投票 ID
    text: string; // 选项文案
    votes_count: number; // 当前该选项累计票数
}

// 投票主体实体
// 对应表：polls
export interface Poll {
    poll_id: string; // 投票主键 ID（UUID）
    creator_user_id: string | null; // 创建者用户 ID（登录用户）
    creator_device_id: string | null; // 创建者设备 ID（游客）
    title: string; // 投票标题
    description: string | null; // 投票描述/说明
    max_choices: number; // 每人最多可选多少个选项
    expires_at: string | null; // 过期时间（可选）
    created_at: string; // 创建时间
    total_votes: number; // 所有选项累计总票数
}

// 带选项的投票结构
// 对应视图：polls_view 中的一行（包含 options JSON 数组）
export interface PollWithOptions extends Poll {
    options: PollOption[];
}

// 单条投票记录实体
// 对应表：poll_votes
export interface Vote {
    vote_id: string; // 投票记录主键 ID（UUID）
    poll_id: string; // 哪个投票
    option_id: string; // 选择了哪个选项
    voter_user_id: string | null; // 投票者用户 ID（登录用户）
    voter_device_id: string | null; // 投票者设备 ID（游客）
    created_at: string; // 投票时间
}

// 基于“浏览器指纹”的游客设备 ID 方案
// 思路：
// 1. 先尝试从 localStorage 中读取已有 ID（保证同一浏览器多次访问一致）
// 2. 若无，则收集一组相对稳定的浏览器信息（指纹原始数据）：
//    - userAgent / platform / 语言 / 分辨率 / 颜色深度 / CPU 核数 / 内存 / 时区 等
// 3. 对这串字符串做一次同步哈希，得到一个较稳定且简短的十六进制 ID
// 4. 若指纹获取失败，再退回到随机 ID（与之前逻辑兼容）
//
// 注意：
// - 这不是“真正不可变”的唯一 ID，清空浏览器数据 / 更换设备都会变
// - 但比单纯随机 UUID 更接近“同一设备同一 ID”，适合作为投票场景的游客标识

// 简单字符串哈希函数（djb2 变体），同步、无依赖
const hashString = (input: string): string => {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = (hash * 33) ^ input.charCodeAt(i);
    }
    // 转为无符号整数再转 16 进制串
    return (hash >>> 0).toString(16);
};

// 构建浏览器指纹原始字符串
const buildFingerprintSource = (): string | null => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return null;

    try {
        const nav = navigator as any;
        const screen = window.screen;

        const ua = nav.userAgent || '';
        const uaDataBrand =
            nav.userAgentData && Array.isArray(nav.userAgentData.brands)
                ? nav.userAgentData.brands.map((b: any) => `${b.brand}/${b.version}`).join(',')
                : '';
        const platform = nav.platform || '';
        const language = nav.language || '';
        const languages = Array.isArray(nav.languages) ? nav.languages.join(',') : '';
        const hardwareConcurrency = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency.toString() : '';
        const deviceMemory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory.toString() : '';
        const colorDepth = screen && typeof screen.colorDepth === 'number' ? screen.colorDepth.toString() : '';
        const screenWidth = screen && typeof screen.width === 'number' ? screen.width.toString() : '';
        const screenHeight = screen && typeof screen.height === 'number' ? screen.height.toString() : '';
        const timezone =
            typeof Intl !== 'undefined' && Intl.DateTimeFormat
                ? (Intl.DateTimeFormat().resolvedOptions().timeZone || '')
                : '';

        // 将所有字段按固定顺序拼接，减少不同浏览器下的不确定性
        const parts = [
            ua,
            uaDataBrand,
            platform,
            language,
            languages,
            hardwareConcurrency,
            deviceMemory,
            colorDepth,
            screenWidth,
            screenHeight,
            timezone
        ];

        const source = parts.join('||');
        return source || null;
    } catch {
        return null;
    }
};

// 生成或读取设备唯一 ID（基于浏览器指纹 + 本地缓存）
export const getDeviceId = (): string | null => {
    if (typeof window === 'undefined') return null;

    try {
        // v2 版本的键名，避免和之前纯随机方案混淆
        const keyV2 = 'poll_device_id_v2';
        const keyLegacy = 'poll_device_id';

        // 1. 优先使用新的 v2 ID
        const existingV2 = window.localStorage.getItem(keyV2);
        if (existingV2) return existingV2;

        // 2. 兼容旧的随机 ID（如果存在，则沿用）
        const existingLegacy = window.localStorage.getItem(keyLegacy);
        if (existingLegacy) {
            // 同时写入 v2 键，后续统一走 v2
            window.localStorage.setItem(keyV2, existingLegacy);
            return existingLegacy;
        }

        // 3. 尝试使用浏览器指纹生成稳定 ID
        const fingerprintSource = buildFingerprintSource();
        if (fingerprintSource) {
            const id = hashString(fingerprintSource);
            window.localStorage.setItem(keyV2, id);
            return id;
        }

        // 4. 指纹获取失败时，退回到随机 ID（与旧逻辑一致）
        const raw = crypto.getRandomValues(new Uint8Array(16));
        const randomId = Array.from(raw)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        window.localStorage.setItem(keyV2, randomId);
        return randomId;
    } catch {
        // 某些极端环境下（隐私模式等）localStorage/crypto 可能不可用，直接返回 null
        return null;
    }
};

// 创建投票（带选项）
// - 通过 Supabase RPC：create_poll_with_options 完成原子性操作
// - Supabase 端负责：频次限制、积分扣除、插入 poll + options 数据
export const createPoll = async (params: {
    title: string;
    description?: string;
    options: string[];
    maxChoices: number;
    expiresAt?: string | null;
    creatorUserId?: string | null;
    creatorDeviceId?: string | null;
}): Promise<PollWithOptions> => {
    const { title, description, options, maxChoices, expiresAt, creatorUserId, creatorDeviceId } =
        params;

    const { data, error } = await supabase.rpc('create_poll_with_options', {
        p_title: title,
        p_description: description ?? null,
        p_options: options,
        p_max_choices: maxChoices,
        p_expires_at: expiresAt ?? null,
        p_creator_user_id: creatorUserId ?? null,
        p_creator_device_id: creatorDeviceId ?? null
    });

    if (error) throw error;

    // create_poll_with_options 返回的结构与 PollWithOptions 对齐
    return data as PollWithOptions;
};

// 根据 poll_id 查询单个投票（含所有选项与票数）
// - 对应视图：polls_view
// - 视图中通过 json_agg 聚合出 options 数组
export const getPollById = async (pollId: string): Promise<PollWithOptions | null> => {
    const { data, error } = await supabase
        .from('polls_view')
        .select('*')
        .eq('poll_id', pollId)
        .maybeSingle();

    if (error) throw error;
    return data as PollWithOptions | null;
};

// 对投票进行投票
// - optionIds 支持多选，由后端根据 max_choices 做校验
// - Supabase 端保证“一人（设备/用户）一票”与并发安全
export const voteOnPoll = async (params: {
    pollId: string;
    optionIds: string[];
    voterUserId?: string | null;
    voterDeviceId?: string | null;
}): Promise<void> => {
    const { pollId, optionIds, voterUserId, voterDeviceId } = params;

    const { error } = await supabase.rpc('vote_on_poll', {
        p_poll_id: pollId,
        p_option_ids: optionIds,
        p_voter_user_id: voterUserId ?? null,
        p_voter_device_id: voterDeviceId ?? null
    });

    if (error) throw error;
};

// 检查今天是否已经创建过投票（游客 + 登录用户）
// - 后端通过创建时间 created_at::date = current_date 来判断
export const hasCreatedPollToday = async (params: {
    creatorUserId?: string | null;
    creatorDeviceId?: string | null;
}): Promise<boolean> => {
    const { creatorUserId, creatorDeviceId } = params;
    const { data, error } = await supabase.rpc('has_created_poll_today', {
        p_creator_user_id: creatorUserId ?? null,
        p_creator_device_id: creatorDeviceId ?? null
    });

    if (error) throw error;
    return Boolean(data);
};

// 检查是否已经对某个投票投过票
// - 依据 user_id 或 device_id 判断
export const hasVotedOnPoll = async (params: {
    pollId: string;
    voterUserId?: string | null;
    voterDeviceId?: string | null;
}): Promise<boolean> => {
    const { pollId, voterUserId, voterDeviceId } = params;
    const { data, error } = await supabase.rpc('has_voted_on_poll', {
        p_poll_id: pollId,
        p_voter_user_id: voterUserId ?? null,
        p_voter_device_id: voterDeviceId ?? null
    });

    if (error) throw error;
    return Boolean(data);
};

