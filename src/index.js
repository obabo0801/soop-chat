import { SoopClient } from '#soop/client';
import * as http from '#soop/http';

// 스트리머 아이디
const streamerId = 'maribyeol';

// 필요하면 브라우저 쿠키 넣기
const cookie = ''

// 비밀번호 방송이면 입력
const password = '';

(async () => {
    const client = new SoopClient({
        cookie
    });

    const r = await http.getPrivateInfo({
        cookie: client.cookie
    });

    const live = await http.getLiveInfo(streamerId, password, {
        cookie: client.cookie
    })
    client.channel = live;

    await client.connect(streamerId);
})();