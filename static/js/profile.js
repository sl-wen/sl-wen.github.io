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
            const usertaskscontainer = document.querySelector('.user_tasks-container tbody tr');
            usertasksdatas.forEach(async (usertasksdata) => {
                try {
                    const taskdata = await gettasks(usertasksdata.task_id);
                    const tasktypesdata = await gettasktypes(taskdata.type_id);
                    const usertasksth = document.createElement('th');
                    usertasksth.className = 'usertasksdetail';
                    usertasksth.innerHTML = `
                    <th>${tasktypesdata.description}</th>
                    <th>${taskdata.task_name}</th>
                    <th>${taskdata.task_description}</th>
                    <th>${taskdata.action_type}</th>
                    <th>${usertasksdata.current_count}</th>
                    <th>${taskdata.required_count}</th>
                    <th>${taskdata.coins_reward}</th>
                    <th>${taskdata.exp_reward}</th>
                    `
                    usertaskscontainer.appendChild(usertasksth);
                } catch (error) {
                    console.log('添加任务进度失败', error);
                }

            });
        }
        const taskrewardhistorydatas = await gettaskrewardhistory(userProfile.user_id);

        // 添加任务历史
        if (taskrewardhistorydatas && taskrewardhistorydatas.length > 0) {
            const historycontainer = document.querySelector('.history-container tbody tr');
            taskrewardhistorydatas.forEach(async (taskrewardhistorydata) => {
                try {
                    const taskdata = await gettasks(taskrewardhistorydata.task_id);
                    const tasktypesdata = await gettasktypes(taskdata.type_id);
                    const userhistoryssth = document.createElement('th');
                    userhistoryssth.className = 'userhistorysdetail';
                    const formattedDate = formatDateALL(taskrewardhistorydata.claimed_at);
                    userhistoryssth.innerHTML = `
                    <th>${formattedDate}</th>
                    <th>${tasktypesdata.description}</th>
                    <th>${taskdata.task_name}</th>
                    <th>${taskdata.task_description}</th>
                    <th>${taskdata.action_type}</th>
                    <th>${taskrewardhistorydata.coins_gained}</th>
                    <th>${taskrewardhistorydata.experience_gained}</th>
                    `
                    historycontainer.appendChild(userhistoryssth);
                } catch (error) {
                    console.log('添加任务历史失败', error);
                }

            });
        }

    }
});
