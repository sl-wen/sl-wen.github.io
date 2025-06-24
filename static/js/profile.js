// 导入 Supabase 客户端
import { formatDateALL } from './common.js';
import { getusertasks, gettaskrewardhistory, } from './task.js';

document.addEventListener('DOMContentLoaded', async () => {

    const userProfileStr = localStorage.getItem('userProfile');
    // 解析 JSON 字符串
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;

    // 用户已登录，显示用户信息
    if (userProfile) {
        const leveldetail = document.getElementById('level-detail');
        const coinsdetail = document.getElementById('coins-detail');
        const experiencedetail = document.getElementById('experience-detail');
        const adressdetail = document.getElementById('adress-detail');

        if (leveldetail) {
            leveldetail.innerHTML = `<span>${userProfile.level || 0}</span>`;
        }
        if (coinsdetail) {
            coinsdetail.innerHTML = `<span>${userProfile.coins || 0}</span>`;
        }
        if (experiencedetail) {
            experiencedetail.innerHTML = `<span>${userProfile.experience || 0}</span>`;
        }
        if (adressdetail) {
            adressdetail.innerHTML = `<span>${userProfile.adress || '未设置'}</span>`;
        }
        const usertasksdatas = await getusertasks(userProfile.user_id);

        // 添加任务进度
        if (usertasksdatas && usertasksdatas.length > 0) {
            const usertaskscontainer = document.querySelector('.user_tasks-container tbody');
            usertaskscontainer.innerHTML = ''; // 清空默认内容
            usertasksdatas.forEach(async (usertasksdata) => {
                try {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td title="${usertasksdata.description}">${usertasksdata.description}</td>
                        <td title="${usertasksdata.task_name}">${usertasksdata.task_name}</td>
                        <td title="${usertasksdata.task_description}">${usertasksdata.task_description}</td>
                        <td title="${usertasksdata.action_type}">${usertasksdata.action_type}</td>
                        <td title="${usertasksdata.current_count}">${usertasksdata.current_count}</td>
                        <td title="${usertasksdata.required_count}">${usertasksdata.required_count}</td>
                        <td title="${usertasksdata.coins_reward}">${usertasksdata.coins_reward}</td>
                        <td title="${usertasksdata.exp_reward}">${usertasksdata.exp_reward}</td>
                    `;
                    usertaskscontainer.appendChild(tr);
                } catch (error) {
                    console.log('添加任务进度失败', error);
                }
            });
        }

        const taskrewardhistorydatas = await gettaskrewardhistory(userProfile.user_id);
        // 添加任务历史
        if (taskrewardhistorydatas && taskrewardhistorydatas.length > 0) {
            const historycontainer = document.querySelector('.history-container tbody');
            historycontainer.innerHTML = ''; // 清空默认内容
            taskrewardhistorydatas.forEach(async (taskrewardhistorydata) => {
                try {
                    const tr = document.createElement('tr');
                    const formattedDate = formatDateALL(taskrewardhistorydata.claimed_at);
                    tr.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${taskrewardhistorydata.description}</td>
                        <td>${taskrewardhistorydata.task_name}</td>
                        <td>${taskrewardhistorydata.task_description}</td>
                        <td>${taskrewardhistorydata.action_type}</td>
                        <td>${taskrewardhistorydata.coins_gained}</td>
                        <td>${taskrewardhistorydata.experience_gained}</td>
                    `;
                    historycontainer.appendChild(tr);
                } catch (error) {
                    console.log('添加任务历史失败', error);
                }
            });
        }

    }
});
