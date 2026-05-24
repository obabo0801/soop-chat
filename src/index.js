import * as config from '#soop/config';

// 스트리머 아이디
const BJ_ID = 'niniming';

// 필요하면 브라우저 쿠키 넣기
const COOKIE = ''

// 비밀번호 방송이면 입력
const PASSWORD = '';


async function getLiveInfo(bjId) {
    const url = `${config.DOMAIN.live}/afreeca/player_live_api.php?bjid=${bjId}`;

    const body = new URLSearchParams({
        bid: bjId,
        bno: '0',
        pwd: PASSWORD,
        ...config.BODY
    });

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(COOKIE ? { Cookie: COOKIE } : {}),
    }

    const res = await fetch(url, {
        method: 'POST',
        headers,
        body
    });

    if (!res.ok) {
        return fakse;
    }

    return res.json();
}

(async () => {
    const data = await getLiveInfo(BJ_ID);

    console.log(data.CHANNEL?.RESULT);
    console.log(data.CHANNEL?.BNO);
    console.log(data.CHANNEL?.CHATNO);
    console.log(data.CHANNEL?.CHDOMAIN);
    console.log(data.CHANNEL?.FTK);
})();