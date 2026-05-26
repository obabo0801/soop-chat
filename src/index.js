import { SoopClient } from '#soop/client';
import * as http from '#soop/http';
import * as log from '#utils/log';

// 스트리머 아이디
const streamerId = '';

// 필요하면 브라우저 쿠키 넣기
const cookie = ''

// 비밀번호 방송이면 입력
const password = '';

(async () => {
    const client = new SoopClient({
        cookie
    });

    const info = await http.getPrivateInfo({
        cookie: client.cookie
    });

    if (info.IS_LOGIN === 1) {
        log.warn(`[INFO] ${info.LOGIN_NICK}(${info.LOGIN_ID}) 로그인`);
    } else {
        log.warn('[INFO] 비로그인');
    }

    const live = await http.getLiveInfo(streamerId, {
        cookie: client.cookie
    })
    client.channel = live;

    if (live?.TITLE) {
        log.info(`[TITLE] ${live.TITLE}`);
        log.info(`[HOST] ${live.BJNICK}(${live.BJID})`);
        if (live.BPWD) {
            log.warn(`[BPWD] ${live.BPWD}`);
        }
    }

    client.on('open', () => {
        log.info('[OPEN]');
    });

    client.on('packet', data => {
        log.info('[PACKET]', {
            CODE: data.service,
            SIZE: data.length,
            FLAG: data.flag,
            DATA: data.fields
        });
    });

    client.on('close', () => {
        log.info('[CLOSE]');
    });


    client.on('error', error => {
        log.error('[ERROR]', error);
    });

    await client.connect(streamerId, password);
})();