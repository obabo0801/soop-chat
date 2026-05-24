import { SoopClient } from '#soop/client';
import * as html from '#soop/html';

// 스트리머 아이디
const streamerId = 'niniming';

// 필요하면 브라우저 쿠키 넣기
const cookie = ''

// 비밀번호 방송이면 입력
const password = '';

(async () => {
    const client = new SoopClient({
        cookie
    });

    const channl = await html.getLive(streamerId);
    client.channel = channl;

    await client.connect(streamerId);
})();