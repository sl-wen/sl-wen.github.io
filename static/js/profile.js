document.addEventListener('DOMContentLoaded', function () {

    const userProfile = sessionStorage.getItem('userProfile');

    // 用户已登录，显示用户信息
    if (userProfile) {
        const leveldetail = document.getElementById('level-detail');
        const coinsdetail = document.getElementById('coins-detail');
        const experiencedetail = document.getElementById('experience-detail');
        const adressdetail = document.getElementById('adress-detail');
        const usernamedetail = document.getElementById('username-detail');
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
        if (usernamedetail) {
            usernamedetail.value = userProfile?.username || userSession?.user.email;
        }
    }
});