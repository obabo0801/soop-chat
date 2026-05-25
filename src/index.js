import { SoopClient } from '#soop/client';
import * as http from '#soop/http';

// 스트리머 아이디
const streamerId = 'honeys2';

// 필요하면 브라우저 쿠키 넣기
const cookie = 'a'

// 비밀번호 방송이면 입력
const password = '';

(async () => {
    const client = new SoopClient({
        cookie
    });

//    await client.login('', '@');

    const channl = await http.getBroad(streamerId, {
        cookie
//        cookie: client.cookie
    });

//    const channl = await http.getBroad(streamerId);
//    client.channel = channl;

//    await client.connect(streamerId);
})();