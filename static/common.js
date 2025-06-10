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
