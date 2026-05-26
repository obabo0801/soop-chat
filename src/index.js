import { SoopClient } from '#soop/client';
import * as http from '#soop/http';
import * as log from '#utils/log';
import * as handler from '#handler';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''}
);

// 스트리머 아이디
const streamerId = '';

// 필요하면 브라우저 쿠키 넣기
const cookie = ''

// 비밀번호 방송이면 입력
const password = '';

const client = new SoopClient({
    cookie, password
});

(async () => {

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

    client.on('alarm', (data) => {
        log.info('[ALARM]', data);
    });

    client.on('chuser', (type, user) => {
        const role = handler.userRole(user.flag);
        const tier = handler.subTier(user.flag);
        const badge = tier
            ? `${role}/${tier}`
            : role;

        if (type > 0) {
            log.info('[입장]', `[${badge}]`, `${user.name}(${user.id})`);
        } else {
            log.info('[퇴장]', `[${badge}]`, `${user.name}(${user.id})`);
        }
    });

    client.on('chat', (data) => {
        const role = handler.userRole(data.userFlag);
        const tier = handler.subTier(data.userFlag);
        const badge = tier
            ? `${role}/${tier}`
            : role;

        log.info('[채팅]', `[${badge}]`, `${data.userName}(${data.userId}): ${data.message}`);
    });

    client.on('mchat', (data) => {
        const role = handler.userRole(data.userFlag);
        const tier = handler.subTier(data.userFlag);
        const badge = tier
            ? `${role}/${tier}`
            : role;

        log.info('[매니저 채팅]', `[${badge}]`, `${data.userName}(${data.userId}): ${data.message}`);
    });

    client.on('dchat', (data) => {
        log.info('[귓속말]', `[${badge}]`, `${data.receiverName}(${data.receiverId})님에게 귓말 ${data.message}`);
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
        console.log(error);
//        log.error('[ERROR]', error);
    });

    await client.connect();
})();

async function command(input) {
    const [raw, ...rest] = input.trim().split(/\s+/);

    switch (raw.toLowerCase()) {

    case '/슬로우': {
        client.sendslowMode(...rest);
        break;
    }

    case '/새로고침': {
        client.sendUserList();
        break;
    }

    case '/매니저': {
        client.sendManagerChat(...rest);
        break;
    }

    case '/': {
        log.warn('존재하지 않는 명령어입니다.');
        break;
    }

    default:
        client.sendChat(input);
    }

}

export function prompt() {
    if (!rl.closed) rl.prompt();
}

export function pause() {
    if (!rl.closed) rl.pause();
}

export function close() {
    if (!rl.closed) rl.close();
}

rl.on('line', async (input) => {
    const cmd = input.trim();
    log.input(input);
    if (!cmd) {
        prompt();
        return;
    }
    await command(cmd);
});