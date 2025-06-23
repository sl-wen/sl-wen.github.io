// 导入 Supabase 客户端
import { formatDateALL } from './common.js';
import { getusertasks, gettasks, gettasktypes, gettaskrewardhistory, } from './task.js';

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
                    const taskdata = await gettasks(usertasksdata.task_id);
                    const tasktypesdata = await gettasktypes(taskdata.tasktype_id);
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${tasktypesdata.description}</td>
                        <td>${taskdata.task_name}</td>
                        <td>${taskdata.task_description}</td>
                        <td>${taskdata.action_type}</td>
                        <td>${usertasksdata.current_count}</td>
                        <td>${taskdata.required_count}</td>
                        <td>${taskdata.coins_reward}</td>
                        <td>${taskdata.exp_reward}</td>
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
                    const taskdata = await gettasks(taskrewardhistorydata.task_id);
                    const tasktypesdata = await gettasktypes(taskdata.type_id);
                    const tr = document.createElement('tr');
                    const formattedDate = formatDateALL(taskrewardhistorydata.claimed_at);
                    tr.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${tasktypesdata.description}</td>
                        <td>${taskdata.task_name}</td>
                        <td>${taskdata.task_description}</td>
                        <td>${taskdata.action_type}</td>
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
