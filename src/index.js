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
        log.warn(`[정보] ${info.LOGIN_NICK}(${info.LOGIN_ID}) 로그인`);
    } else {
        log.warn('[정보] 비로그인');
    }

    const live = await http.getLiveInfo(streamerId, {
        cookie: client.cookie
    })
    client.channel = live;

    if (live?.TITLE) {
        log.info(`[제목] ${live.TITLE}`);

        if (live.RESULT === 1) {
            log.info(`[스트리머] ${live.BJNICK}(${live.BJID})`);
        } else {
            log.warn(`[스트리머] ${live.RESULT}`);
        }
        if (live.BPWD) {
            log.warn(`[비밀번호] ${live.BPWD}`);
        }
    } else {
        log.warn('[정보] 방송 정보 없음');
    }

    client.on('open', () => {
        log.debug('[연결]');
    });

    client.on('alarm', (data) => {
        log.warn('[알림]', data);
    });

    client.on('chuser', (type, user) => {
        const role = handler.userRole(user.flag);
        const tier = handler.subTier(user.flag);
        const badge = tier
            ? `${role}/${tier}`
            : role;

        if (type > 0) {
            log.debug('[입장]', `[${badge}]`, `${user.name}(${user.id})`);
        } else {
            if (user?.kick < 0) {
                log.error('[퇴장]', `[${badge}]`, `${user.name}(${user.id})님이 강퇴되었습니다. (누적 ${user.count}회)`);
                return;
            }
            log.debug('[퇴장]', `[${badge}]`, `${user.name}(${user.id})`);
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

        log.load('\x1b[91m[매니저 채팅]\x1b[0m', `[${badge}]`, `${data.userName}(${data.userId}): ${data.message}`);
    });

    client.on('dchat', (data) => {
        if (data.type === 1) {
            log.load('[귓속말]', `${data.fromName}(${data.fromId})님의 귓말 님에게 귓말 ${data.message}`);
        } else {
            log.load('[귓속말]', `${data.toName}(${data.toId})님에게 귓말 ${data.message}`);
        }
    });

    client.on('notice', (data) => {
        log.info('[공지]', data.message);
    });

    client.on('poll', async (data, result) => {
        result = await http.getVote(data.streamerId, data.no, {
            cookie: client.cookie,
        });
        let text = result.list;

        if (text) {
            text = text.map(item => `${item.answer_no}. ${item.answer_title} (${item.answer_total}표)`).join('\n');
        }

        switch (data.status) {
        case 1:
            log.info('[투표] 새로운 투표가 시작되었습니다', `\n${result.title}\n${text}`);
            break;
        case 2:
            log.info('[투표] 투표가 종료되었습니다.');
            client.pollData = null;
            break;
        case 3:
            log.info('[투표] 투표가 마감되었습니다.', `\n${result.title}\n${text}`);
            break;
        case 4:
            log.info('[투표] 투표 결과가 공개되었습니다.', `\n${result.title}\n${text}`);
            break;
        default:
            log.info('[투표] 알 수 없는 투표 상태입니다.');
        }
    });

    client.on('ice', (data) => {
        if (data.index === 0) {
            log.info('[알림] 채팅을 녹였습니다.');
        } else {
            const names = [];

            if (data.auth.isStreamerAllowed) {
                names.push('스트리머');
            }

            if (data.auth.isTopFanAllowed) {
                names.push('열혈팬');
            }

            if (data.auth.isSubscriberAllowed) {
                names.push('구독팬');
            }

            if (data.auth.isFanClubAllowed) {
                names.push(
                    data.money > 0
                        ? `팬클럽(${data.money}개↑)`
                        : '팬클럽'
                );
            }

            if (data.auth.isSupporterAllowed) {
                names.push('서포터');
            }

            if (data.auth.isManagerAllowed) {
                names.push('매니저');
            }
            log.info('[얼음] 채팅을 얼렸습니다.', `${names.join(', ')}`);
        }
    });

    client.on('mission', (data) => {
        log.warn('[미션]', data);
    });

    client.on('dumb', (data) => {
        log.error('[채금]', `${data.userName}(${data.userId})님이 채금되었습니다.`, data);
    });

    client.on('subtitle', (data) => {
        log.info('\x1b[91m[자막]\x1b[0m', `\x1b[1m${data.message}\x1b[0m`);
    });

    client.on('packet', data => {
        log.list('[패킷]', {
            CODE: data.service,
            SIZE: data.length,
            FLAG: data.flag,
            DATA: data.fields
        });
    });

    client.on('close', () => {
        log.debug('[종료]');
    });


    client.on('error', error => {
        log.error('[에러]', error);
    });

    await client.connect();
})();

async function command(input) {
    const [raw, ...rest] = input.trim().split(/\s+/);

    switch (raw.toLowerCase()) {
    
    case '/인원': {
        await client.sendKickUserList(client.channel?.BNO);
        break;
    }

    case '/개수': {
        const r = rest[0];
        const result = await client.sendIceOption(
            Number(r) || 0
        );
        console.log(result);
        break;
        break;
    }
    
    case '/얼음': {
        const r = rest[0];
        const result = await client.sendIceMode({
            streamer: true,
            fanClub: true,
            supporter: true,
            subscriber: true,
            manager: true,
            setType: 'ice_on'
        });
        console.log(result);
        break;
    }
    
    case '/땡': {
        const r = rest[0];
        const result = await client.sendIceMode({
            setType: 'ice_off'
        });
        console.log(result);
        break;
    }

    case '/테스트': {
        const result = await http.startVote('테스트 투표', {
            cookie: client.cookie
        });
        console.log('[테스트]', result);
        break;
    }

    case '/공지': {
        const catNo = Number(client.channel?.BNO) || 0;
        const message = rest.join(' ');

        let result = await http.setChatNotice(catNo, message, 1, {
            cookie: client.cookie
        });

        console.log('[공지]', result);
        break;
    }

    case '/번역': {
        const message = rest.join(' ');
        client.sendTranslation(message);
        break;
    }
    
    case '/투표': {
        if (!client.pollData) {
            console.log('진행 중인 투표가 없습니다.');
            break;
        }
        const userId = client.pollData.streamerId;
        const surveyNo = client.pollData.no;
        const message = rest[0]

        let result;
        if (!message) {
            result = await http.getVote(userId, surveyNo, {
                cookie: client.cookie,
            });
            console.log('[투표]', result);
            break;
        }
        result = await http.setVote(userId, surveyNo, message, {
            cookie: client.cookie,
        });
        console.log('[투표]', result);
        break;
    }

    case '/to': {
        const userId = rest[0];
        const message = rest.slice(1).join(' ');

        if (!userId || !message) {
            log.warn('사용법: /to [유저 아이디] [메시지]');
            break;
        }

        client.sendDirectChat(message, userId);
    }

    case '/저속모드': {
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

    default:
        if (input.slice(0, 1) === '/') {
            log.warn('존재하지 않는 명령어입니다.');
            break;
        }

        client.sendChat(input);
    }

}

export function shutdown() {
    pause();
    close();
    client.disconnect();
    process.exit(0);
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

rl.on('SIGINT', shutdown);