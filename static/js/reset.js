// 导入supabase客户端
import { supabase } from './supabase-config.js';
import common from './common.js';

const resetForm = document.getElementById('reset-password-form"');
if (resetForm) {
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // 阻止表单默认提交行为
    const newpassword = document.getElementById('new-password').value;
    const confirmpassword = document.getElementById('confirm-password').value;

    // 验证输入不为空
    if (!newpassword || !confirmpassword) {
      common.showMessage('新密码和确认密码不能为空', 'error');
      return;
    }
    // 验证两次密码输入是否一致
    if (newpassword !== confirmpassword) {
      common.showMessage('两次输入的密码不一致', 'error');
      return;
    }

    if (!common.isPasswordComplex(newpassword)) {
      common.showMessage('密码需至少8位，且包含大写、小写、数字、特殊字符中的最少两种', 'error');
      return;
    }

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (!accessToken) {
      common.showMessage('无效的密码重置链接，请重新申请密码重置', 'error');
      document.getElementById('reset-password-form').style.display = 'none';
      return;
    }

    try {
      const { error: updateerror } = await supabase.auth.updateUser({
        password: newpassword
      });

      if (updateerror) throw updateerror;

      const { data, error:sessionerror } = await supabase.auth.getSession();
      const session = data?.session;
      sessionStorage.setItem('userSession', JSON.stringify(session));

      common.showMessage('密码重置成功！即将跳转到登录页面...', 'success');
      setTimeout(() => {
        window.location.href = '/pages/login.html';
      }, 2000);
    } catch (error) {
      common.showMessage(error.message || '更新密码失败', 'error');
    }

  });
}