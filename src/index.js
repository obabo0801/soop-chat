import { SoopClient } from '#soop/client';
import * as http from '#soop/http';

// 스트리머 아이디
const streamerId = 'honeys2';

// 필요하면 브라우저 쿠키 넣기
const cookie = ''

// 비밀번호 방송이면 입력
const password = '';

(async () => {
    const client = new SoopClient({
        cookie
    });

    await client.login('', '@', '@');
    
    let channl = await http.getBroad(streamerId, '', {
        cookie: client.cookie
    });
    
    channl = await http.getBroad(streamerId, '', {
        cookie: client.cookie
    });
    client.channel = channl;

    console.log(channl?.UNICK);

//    await client.connect(streamerId);
})();