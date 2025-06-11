// 验证邮箱格式
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isPasswordComplex(password) {
    // 至少8位，含大写、小写、数字、特殊字符
    const lengthOk = password.length >= 8;
    const lower = /[a-z]/.test(password);
    const upper = /[A-Z]/.test(password);
    const number = /[0-9]/.test(password);
    const special = /[^a-zA-Z0-9]/.test(password);

    // 必须包含上述至少二类
    const count = [lower, upper, number, special].filter(Boolean).length;
    return lengthOk && count >= 2;
}


// 评估密码强度
export function evaluatePasswordStrength(password) {
    if (!password) return { score: 0, feedback: '' };

    let score = 0;
    let feedback = [];

    // 长度评分
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // 复杂度评分
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // 反馈信息
    if (password.length < 8) {
        feedback.push('密码太短');
    }

    if (!/[A-Z]/.test(password) && !/[a-z]/.test(password)) {
        feedback.push('建议添加字母');
    }

    if (!/[0-9]/.test(password)) {
        feedback.push('建议添加数字');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        feedback.push('建议添加特殊字符');
    }

    // 标准化分数到 0-100
    const normalizedScore = Math.min(100, Math.round((score / 6) * 100));

    return {
        score: normalizedScore,
        feedback: feedback.join('，')
    };
}

// 更新密码强度指示器
export function updatePasswordStrength(password) {
    const strengthBar = document.getElementById('password-strength');
    const feedbackElement = document.getElementById('password-feedback');

    if (!password) {
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = '#e9ecef';
        feedbackElement.textContent = '';
        return;
    }

    const { score, feedback } = evaluatePasswordStrength(password);

    // 更新强度条
    strengthBar.style.width = `${score}%`;

    // 根据分数设置颜色
    if (score < 30) {
        strengthBar.style.backgroundColor = '#dc3545'; // 弱
        feedbackElement.style.color = '#dc3545';
    } else if (score < 70) {
        strengthBar.style.backgroundColor = '#ffc107'; // 中
        feedbackElement.style.color = '#856404';
    } else {
        strengthBar.style.backgroundColor = '#28a745'; // 强
        feedbackElement.style.color = '#28a745';
    }

    // 更新反馈文本
    if (score < 30) {
        feedbackElement.textContent = `密码强度：弱 ${feedback ? '- ' + feedback : ''}`;
    } else if (score < 70) {
        feedbackElement.textContent = `密码强度：中 ${feedback ? '- ' + feedback : ''}`;
    } else {
        feedbackElement.textContent = `密码强度：强`;
    }
}

// 显示消息
export function showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    if (!container) return;

    container.innerHTML = `
        <div class="${type}-message">
            ${message}
        </div>
    `;
}

// 格式化日期
export function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}



export function getCursorLine(textarea) {
    const value = textarea.value;
    const selectionStart = textarea.selectionStart;

    // 截取到光标，统计有多少个换行符，就是光标所在行号
    return value.substring(0, selectionStart).split('\n').length - 1;
}

export function scrollPreviewToLine(lineNumber) {
    const anchor = document.querySelector(`#line-anchor-${lineNumber}`);
    if (anchor) {
        anchor.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
}

// 添加滚动结束检测
export function onScrollEnd(element, callback) {
    let timer;
    element.addEventListener('scroll', function () {
        // 清除之前的定时器
        clearTimeout(timer);
        // 设置新的定时器，滚动停止后执行回调
        timer = setTimeout(function () {
            callback();
        }, 300); // 300ms 无滚动视为滚动结束
    });
}

/**
 * 计算编辑框中可见的第一行行号
 * @param {HTMLTextAreaElement} textarea - 文本区域元素
 * @return {number} 可见的第一行行号（从0开始）
 */
export function getVisibleFirstLine(textarea) {
    // 获取文本框的滚动位置
    const scrollTop = textarea.scrollTop;
    
    // 获取文本框的样式
    const style = window.getComputedStyle(textarea);
    
    // 获取内边距
    const paddingTop = parseFloat(style.paddingTop) || 0;
    
    // 计算实际滚动位置（考虑内边距）
    const effectiveScrollTop = Math.max(0, scrollTop - paddingTop);
    
    // 获取行高
    let lineHeight;
    if (style.lineHeight === 'normal') {
        // 'normal'通常是字体大小的1.2倍左右
        const fontSize = parseFloat(style.fontSize) || 16;
        lineHeight = fontSize * 1.2;
    } else {
        lineHeight = parseFloat(style.lineHeight) || 18;
    }
    
    // 估算第一个可见行（从0开始）
    const firstVisibleLine = Math.floor(effectiveScrollTop / lineHeight);
    
    return firstVisibleLine;
}

export default {
    isValidEmail,
    isPasswordComplex,
    evaluatePasswordStrength,
    updatePasswordStrength,
    showMessage,
    formatDate,
    safeMarked,
    getCursorLine,
    renderPreviewByLine,
    scrollPreviewToLine,
    onScrollEnd,
    getVisibleFirstLine
  };