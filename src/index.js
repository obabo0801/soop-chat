import { SoopClient } from '#soop/client';

// 스트리머 아이디
const BJ_ID = 'niniming';

// 필요하면 브라우저 쿠키 넣기
const COOKIE = ''

// 비밀번호 방송이면 입력
const PASSWORD = '';

(async () => {
    const client = new SoopClient({
        cookie: COOKIE
    });

    const data = await client.getLiveInfo(BJ_ID)

    console.log(data.CHANNEL?.RESULT);
    console.log(data.CHANNEL?.BNO);
    console.log(data.CHANNEL?.CHATNO);
    console.log(data.CHANNEL?.CHDOMAIN);
    console.log(data.CHANNEL?.FTK);
})();