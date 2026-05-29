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

    // 기본 이모티콘
    const basic = await http.getEmoticons({
        cookie: client.cookie
    })
    client.basic = basic;
    client.emoticonMap = client.makeEmoticon(client.basic);

    // 시그널 이모티콘
    const signature = await http.getSignatureEmoticons(streamerId, {
        cookie: client.cookie
    })
    client.signature = signature;

    // OGQ 이모티콘
    const ogq = await http.postOgqList(streamerId, {
        cookie: client.cookie
    })
    client.ogq = ogq;

    const info = await http.getPrivateInfo({
        cookie: client.cookie
    });

    if (info.IS_LOGIN === 1) {
        log.warn(`[정보] ${info.LOGIN_NICK}(${info.LOGIN_ID}) 로그인`);
    } else {
        log.warn('[정보] 비로그인');
    }

    const live = await http.postLiveInfo(streamerId, {
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
        if (!user) return;

        const role = handler.userRole(user.flag);
        const tier = handler.subTier(user.flag);
        const badge = tier
            ? `${role}/${tier}`
            : role;

        if (type === 5) {
            log.error('[강퇴', `[${badge}]`, `${user.name}(${user.id})님이 블라인드 상태에서 탈출을 시도하여 강제퇴장 되었습니다.`);
            return;
        }
        else if (type > 0) {
//            log.debug('[입장]', `[${badge}]`, `${user.name}(${user.id})`);
        } else {
            if (user?.kick === 1) {
                const r = user.count > 0 ? ` (누적 ${user.count}회)` : '';
//                log.debug('[퇴장]', `[${badge}]`, `${user.name}(${user.id})${r}`);
                return;
            }
            log.error('[퇴장]', `[${badge}]`, `${user.name}(${user.id})님이 강퇴되었습니다. (누적 ${user.count}회)`);
        }
    });

    client.on('mission', ({ raw: mission, isChallenge }) => {
        const prefix = isChallenge ? '도전미션' : '대결미션';
        const { type, title = '', message = '', data, settle_count } = mission;

        const label = {
            CHALLENGE_GIFT: '후원',
            CHALLENGE_NOTICE: '알림',
            CHALLENGE_SETTLE: '정산',
        }[type];

        log.info(`[${prefix}]`, type, title || message, mission);

        if (!label) return;

        log.info(
            `[${prefix} ${label}]`,
            title,
            type === 'CHALLENGE_SETTLE' ? `${settle_count}개` : data
        );
    });

    client.on('nickname', data => {
        log.info(
            '[닉네임 변경]',
            `${data.oldNickname || data.userId} -> ${data.newNickname}`,
            `(${data.userId})`
        );
    });

    client.on('adconEffect', data => {
        const type = data.fromVod
            ? 'VOD 애드벌룬'
            : '방송국 애드벌룬';

        log.info(
            `[${type}]`,
            `${data.userName}(${data.userId})`,
            `${data.adconCount}개`,
            data.title,
            data.imageUrl
        );
    });

    client.on('chat', (data) => {
        const role = handler.userRole(data.userFlag);
        const tier = handler.subTier(data.userFlag);
        const badge = tier
            ? `${role}/${tier}`
            : role;
        
        if (client.original && data.message?.includes(client.original)) {
//            log.warn('[필터]', `[${badge}]`, `${data.userName}(${data.userId}): ${data.message}`);
//            return;
        }

        if (role === '일반' || role === '팬') {
            return;
        }

        const emoticons = client.findEmoticons(
            data.message,
            client.emoticonMap
        );

        for (const emoticon of emoticons) {
            log.info(
                '[이모티콘]',
                `${emoticon.keyword}`,
                emoticon.smallUrl
            );
        }

        if (tier > 0) {
            const t = client.makeTierUrl(tier, data.subMonth);
            log.load('[티어]', t);
        }
        log.info('[채팅]', `[${badge}]`, `${data.userName}(${data.userId}): ${data.message}`);
    });

    client.on('sticker', data => {
        log.info(
            '[스티커]',
            `${data.senderName}(${data.senderId})님이 스티커 ${data.count}개를 선물했습니다.`,
            data.imageUrl
        );

        if (data.supporterOrder > 0) {
            log.info(
                '[서포터]',
                `${data.senderName}님이 ${data.supporterOrder}번째 서포터가 되셨습니다.`
            );
        }
    });

    client.on('ogq', (data) => {
        const role = handler.userRole(data.userFlag);
        const tier = handler.subTier(data.userFlag);
        const badge = tier
            ? `${role}/${tier}`
            : role;
        const m = data.message ? `: ${data.message} ` : '';
        log.info('[OGQ]', `[${badge}]`,
            `${data.userName}(${data.userId})`, `${m}(${data.url})`
        );
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
        if (data.state === 1) {
            log.warn('[공지 켜짐]', data.message);
        } else {
            log.debug('[공지 꺼짐]', data.message);
        }
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

    client.on('adInBroad', (data) => {
        log.debug('[AD_IN_BROAD_JSON]', data);
        if (data.ad_in_room === 1) {
            log.warn('[알림]', '쉬는시간이 설정되었습니다.\n쉬는시간에도 채팅입력이 가능합니다.');
        } else {
            log.warn('[알림]', '쉬는시간이 종료되었습니다.');
        }
    });

    client.on('subscriptionItemEffect', data => {
        log.info(
            '[연속 구독]',
            `${data.sendNick}(${data.sendId})`,
            `${data.month}개월째 구독중`,
            `누적 ${data.accMonth}개월`,
            `티어${data.tier}`,
            data.imageUrl
        );
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
                names.push(
                    data.date > 0
                        ? `구독팬(${data.date}개월↑)`
                        : '구독팬'
                );
            }

            if (data.auth.isFanClubAllowed) {
                names.push(
                    data.count > 0
                        ? `팬클럽(${data.count}개↑)`
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

    client.on('balloon', (data) => {
        log.info(
            '[후원]',
            `${data.userName}(${data.userId})님이 별풍선 ${data.count}개 선물`,
            data.image
        );

        if (data.join > 0) {
            log.warn('[알림]', `${data.userName}(${data.userId})님이 ${data.join}번째 팬클럽이 되셨습니다.`);
        }
    });

    client.on('adcon', (data) => {
        log.info(
            '[애드벌룬]',
            `${data.userName}(${data.userId})`,
            data.message,
            data.imageUrl
        );

        if (data.defaultImageUrl) {
            log.info('[애드벌룬 효과]', data.defaultImageUrl);
        }

        if (data.fanOrder > 0) {
            log.warn('[알림]', `${data.userName}(${data.userId})님이 ${data.fanOrder}번째 팬클럽이 되셨습니다.`);
        }
    });

    client.on('dumb', (data) => {
        if (data.count > 2) {
            log.error('[채금]', `${data.userName}(${data.userId})님이 채팅금지 횟수 초과로 블라인드 처리 되었습니다.\n ${data.count}초 동안 채팅과 방송화면을 볼 수 없습니다.`);
            return;
        }

        log.error('[채금]', `${data.userName}(${data.userId})님이 채팅금지 ${data.count}회가 되었습니다. (${data.time}초)`, `처리자 ${data.managerId}`);
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
    await client.sendSubtitle(0);
})();

async function command(input) {
    const [raw, ...rest] = input.trim().split(/\s+/);

    switch (raw.toLowerCase()) {
    
    case '/이모지': {
        const index = Number(rest[0]);
        const subId = Number(rest[1]);
        const reulst = client.makeOgqUrl(index, subId);
        log.info(reulst);
        break;
        const message = rest.slice(0).join(' ');

        const result = await client.sendOgq(
            message,
            '64d5a4369f427',
            1
        );
        log.info(result);
        break;
    }
    
    case '/열혈': {
        const userId = rest[0];
        const flag = Number(rest[1]);
        const result = await http.postTopFan(
            userId,
            flag,
            {
                cookie: client.cookie
            }
        );
        log.info(result);
        break;
    }
    
    case '/취소': {
        const userId = rest[0];
        const userName = rest[1];
        const index = 1;
        const message = rest.slice(2).join(' ');
        await client.sendKick(userId, userName, index, message);
        break;
    }
    
    case '/강퇴': {
        const userId = rest[0];
        const userName = rest[1];
        const index = 0;
        const message = rest.slice(2).join(' ');
        await client.sendKick(userId, userName, index, message);
        break;
    }
    
    case '/채금': {
        const userId = rest[0];
        const message = rest.slice(1).join(' ');
        const result = await client.sendDumb(userId, message);
        log.debug(result);
        break;
    }
    
    case '/자막': {
        const r = rest[0];
        await client.sendSubtitle(Number(r));
        break;
    }
    
    case '/인원': {
        await client.sendKickList(client.channel?.BNO);
        break;
    }

    case '/개수': {
        const r = rest[0];
        const d = rest[1];
        const result = await client.sendIceOption(
            Number(r) || 0,
            Number(d) || 0
        );
        log.info(result);
        break;
        break;
    }
    
    case '/얼음': {
        const result = await client.sendIceMode({
            streamer: true,
            fanClub: true,
            supporter: true,
            subscriber: true,
            manager: true,
            setType: 'ice_on'
        });
        log.info(result);
        break;
    }
    
    case '/땡': {
        const r = rest[0];
        const result = await client.sendIceMode({
            setType: 'ice_off'
        });
        log.info(result);
        break;
    }

    case '/공지': {
        const catNo = Number(client.channel?.BNO) || 0;
        const state = Number(rest[0]);
        const message = rest.slice(1).join(' ');

        let result = await http.postChatNotice(catNo, message, state, {
            cookie: client.cookie
        });

        log.info('[공지]', result);
        break;
    }

    case '/번역': {
        const message = rest.join(' ');
        client.sendTranslation(message);
        break;
    }
    
    case '/투표': {
        if (!client.pollData) {
            log.info('진행 중인 투표가 없습니다.');
            break;
        }
        const userId = client.pollData.streamerId;
        const surveyNo = client.pollData.no;
        const message = rest[0];

        let result;
        if (!message) {
            result = await http.getVote(userId, surveyNo, {
                cookie: client.cookie,
            });
            log.info('[투표]', result);
            break;
        }
        result = await http.postVote(userId, surveyNo, message, {
            cookie: client.cookie,
        });
        log.info('[투표]', result);
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
        break;
    }

    case '/저속모드': {
        client.sendSlowMode(...rest);
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
//            log.warn('존재하지 않는 명령어입니다.');
//            break;
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
    if (!client.socket) {
        log.warn('서버에 연결되지 않았습니다.');
        prompt();
        return;
    }
    const cmd = input.trim();
    log.input(input);
    if (!cmd) {
        prompt();
        return;
    }
    await command(cmd);
});

rl.on('SIGINT', shutdown);