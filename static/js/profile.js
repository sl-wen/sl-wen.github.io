document.addEventListener('DOMContentLoaded', function () {

    const userProfileStr = sessionStorage.getItem('userProfile');
    // 解析 JSON 字符串
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;

    // 用户已登录，显示用户信息
    if (userProfile) {
        const leveldetail = document.getElementById('level-detail');
        const coinsdetail = document.getElementById('coins-detail');
        const experiencedetail = document.getElementById('experience-detail');
        const adressdetail = document.getElementById('adress-detail');

        if (leveldetail) {
            leveldetail.innerHTML = `<span id="level-detail" >${userProfile.level || 0}</span>`;
        }
        if (coinsdetail) {
            coinsdetail.innerHTML = `<span id="coins-detail" >${userProfile.coins || 0}</span>`;
        }
        if (experiencedetail) {
            experiencedetail.innerHTML = `<span id="experience-detail" >${userProfile.experience || 0}</span>`;
        }
        if (adressdetail) {
            adressdetail.innerHTML = `<span id="adress-detail" >${userProfile.adress || '未设置'}</span>`;
        }

    }
});