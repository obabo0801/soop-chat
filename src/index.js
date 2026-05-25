import { SoopClient } from '#soop/client';
import * as http from '#soop/http';
import * as log from '#utils/log';

// 스트리머 아이디
const streamerId = 'uunjong';

// 필요하면 브라우저 쿠키 넣기
const cookie = ''

// 비밀번호 방송이면 입력
const password = 'a990519';

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

    client.on('open', () => {
        log.info('open!!!');
    });

    client.on('packet', data => {
        log.info('[PACKET]', data);
    });

    client.on('close', () => {
        log.info('close!!!');
    });


    client.on('error', error => {
        log.error('error!!!', error);
    });
    await client.connect(streamerId, password);
})();