import {
    DOMAIN,
    DELIMITER,
    SVC,
    USER_FLAG1,
    USER_FLAG2,
    ICE_AUTH,
} from '#soop/config';

import * as log from '#utils/log';

export const SUBTITLE_LANG = {
    [-1]: { label: 'OFF', code: 'off' },
    0: { label: '한국어', code: 'ko_KR' },
    1: { label: 'English', code: 'en_US' },
    2: { label: 'ไทย', code: 'th_TH' },
    3: { label: '中文 繁體', code: 'zh_TW' },
    4: { label: '中文 简体', code: 'zh_CN' },
    5: { label: '日本語', code: 'ja_JP' },
    6: { label: 'Tiếng Việt', code: 'vi_VN' },
    7: { label: 'Indonesia', code: 'id_ID' }
}

export function dispatch(soop, pkt) {
    const fields = pkt.fields;

    switch (pkt.service) {
    
    // 1
    case SVC.LOGIN: {
        soop.userId = fields[0];
        soop.userFlag = fields[1];

        soop.sendJoinChannel(soop.password);
        break;
    }

    // 2
    case SVC.JOIN_CHANNEL: {
        if (error(fields, 2)) {
            soop.emit('error', fields[0]);
            break;
        }

        const flag = checkFlag(fields[6]);

        soop.userFlag = fields[6];

        if (soop.cookie?.AuthTicket) {
            soop.sendUserFlag(soop.userFlag);
        }

        soop.emit('join', {
            chatNo: soop.channel.CHATNO,
            streamerId: soop.streamerId,
            userFlag: soop.userFlag
        });
        break;
    }

    // 3
    case SVC.QUIT_CHANNEL: {
        soop.emit('quit', {
            type: Number(fields[2]),
            count: Number(fields[3]),
            adminName: fields[4]
        });

        soop.disconnect();
        break;
    }

    // 4
    case SVC.CHUSER: {
        const users = userList(soop, fields);

        if (users.length > 1) {
            soop.emit('userList', users);
            break;
        }

        soop.emit('chuser', {
            type: Number(fields[0]),
            user: users[0]
        });
        break;
    }
    
    // 5
    case SVC.CHAT: {
        if (error(fields, 2)) {
            soop.emit('error', fields[0]);
            break;
        }

        soop.emit('chat', {
            message: fields[0],
            userId: fields[1],
            userName: fields[5],
            subMonth: Number(fields[7]),
            userFlag: fields[6],
            ...userInfo(fields[6])
        });
        break;
    }

    // 7
    case SVC.SET_BJ_STAT: {
        break;
    }

    // 9
    case SVC.DIRECT_CHAT: {
        if (error(fields, 2)) {
            soop.emit('error', fields[0]);
            break;
        }

        soop.emit('directChat', {
            message: fields[0],
            toId: fields[1],
            fromId: fields[2],
            type: Number(fields[3]),
            fromName: fields[5],
            toName: fields[6],
            userFlag: fields[7],
            ...userInfo(fields[7])
        });
        break;
    }

    // 12
    case SVC.SET_USER_FLAG: {
        if (error(fields, 2)) {
            soop.emit('error', fields[0]);
            break;
        }

        soop.emit('userFlag', {
            flag: checkFlag(fields[0]),
            userId: fields[1],
            userName: fields[2]
        })
        break;
    }

    // 13
    case SVC.SET_SUB_BJ: {
        soop.emit('subBj', {
            flag: checkFlag(fields[1]),
            userId: fields[0],
            userName: fields[3]
        })
        break;
    }

    // 14
    case SVC.SET_NICKNAME: {
        const result = {
            userFlag: checkFlag(fields[3]),
            userId: fields[0],
            newName: fields[1],
            type: Number(fields[2]),
            oldName: fields[4]
        }

        const user = soop.userList.get(result.userId);

        if (user) {
            user.name = result.newName;
        }

        soop.emit('nickName', result);
        break;
    }

    // 19
    case SVC.ICE_MODE: {
        break;
    }

    // 22
    case SVC.ICE_MODE_EX: {
        soop.emit('iceMode', {
            index: Number(fields[0]),
            choice: Number(fields[1]),
            auth: parseIceAuth(fields[2]),
            count: Number(fields[3]),
            date: Number(fields[4])
        })
        break;
    }

    // 23
    case SVC.SLOW_MODE: {
        if (error(fields, 2)) {
            soop.emit('error', fields[0]);
            break;
        }

        soop.emit('slowMode', {
            count: Number(fields[1])
        });
        break;
    }

    // 26
    case SVC.MANAGER_CHAT: {
        if (error(fields, 2)){
            soop.emit('error', fields[0]);
            break;
        }

        soop.emit('managerChat', {
            message: fields[0],
            userId: fields[1],
            userName: fields[4],
            userFlag: fields[5],
            ...userInfo(fields[5])
        });
        break;
    }

    // 54
    case SVC.BAN_WORD: {
        soop.before = fields[0];
        soop.after = fields[1]
            .split(DELIMITER.ACK);

        soop.emit('banWord', {
            before: soop.before,
            after: soop.after
        })
        break;
    }

    // 58
    case SVC.SEND_ADMIN_NOTICE: {
        soop.emit('adminNotice', {
            message: fields[0]
        })
        break;
    }

    // 88
    case SVC.CLOSE_BROAD: {
        soop.disconnect();
        break;
    }

    // 90
    case SVC.KICK_MSG_STATE: {
        soop.emit('kickState', {
            index: Number(fields[1])
        });
        break;
    }
``
    // 94
    case SVC.TRANSLATION_STATE: {
        soop.emit('translationState', {
            index: Number(fields[0])
        });
        break;
    }

    // 104
    case SVC.BJ_NOTICE: {
        if (error(fields, 2)) {
            soop.emit('error', fields[0]);
            break;
        }

        soop.emit('notice', {
            state: Number(fields[1]),
            message: fields[3]
        })
        break;
    }

    // 109
    case SVC.OGQ_EMOTICON: {
        const ogqId = fields[2];
        const subId = fields[3];

        const ext = Number(
            fields[17]
        ) === 1 ? 'webp' : 'png';

        const url = new URL(
            `/sticker/${ogqId}/${subId}.${ext}`,
            DOMAIN.ogq
        );

        soop.emit('ogq', {
            message: fields[1],
            ogqId,
            subId,

            subMonth: Number(fields[12]),
            imageUrl: url.href,

            userId: fields[5],
            userName: fields[6],
            userFlag: fields[7],
            ...userInfo(fields[7])
        })
        break;
    }

    // 110
    case SVC.PUNGASI_START_JSON: {
        break;
    }

    // 119
    case SVC.AD_IN_BROAD_JSON: {
        let data = null;

        try {
            data = JSON.parse(packet.fields[0]);
        } catch (error) {
            soop.emit('error', error);
        }

        soop.emit('adInBroad', data);
        break;
    }

    // 127
    case SVC.CHUSER_EXTEND: {
        const user = soop.userList.get(fields[0]);
        Object.assign(user, parseMonth(fields[1]));

        soop.userList.set(fields[0], user);
        break;
    }

    // 136
    case SVC.GLOBAL_SUBTITLE: {
        const index = Number(fields[2]);

        soop.emit('subtitle', {
            streamerId: fields[0],
            index,
            lang: SUBTITLE_LANG[index],
            message: fields[3]
        });
        break;
    }

    // 137
    case SVC.USER_LANG_SET: {
        const index = Number(fields[0]);

        soop.emit('userLang', {
            index,
            lang: SUBTITLE_LANG[index]
        });
        break;
    }

    default:
        soop.emit('packet', pkt);
        break;
    }
}

export function error(fields, length) {
    if (fields.length < length) {
        return true;
    } else {
        return false;
    }
}

export function userList(soop, fields = []) {
    const type = Number(fields[0]);
    const users = [];

    if (type === 1) {
        for (let i = 1; i < fields.length; i += 3) {
            const id = fields[i];
            const name = fields[i + 1];
            const flag = fields[i + 2];

            if (!id) continue;

            const user = {
                id,
                name,
                flag,
                ...userInfo(flag)
            };

            soop.userList.set(id, user);
            users.push(user);
        }

        return users;
    }

    if (type === -1) {
        const id = fields[1];
        const name = fields[2];
        const kick = Number(fields[3])
        const count = Number(fields[4])
        const flag = fields[5];

        if (!id) return users;

        const user = {
            id,
            name,
            kick,
            count,
            flag,
            ...userInfo(flag)
        }

        soop.userList.delete(id);
        users.push(user);

        return users;
    }

    return users;
}

export function splitFlag(flag = '0|0') {
    const [
        flag1 = 0, flag2 = 0
    ] = String(flag).split('|');

    return {
        flag1: Number(flag1) || 0,
        flag2: Number(flag2) || 0
    };
}

export function hasFlag(value = 0, flag = 0) {
    return (value & flag) === flag;
}

export function checkFlag(flag = '0|0') {
    const {
        flag1, flag2
    } = splitFlag(flag);

    return {
        flag1,
        flag2,
        ...checkFlag1(flag1),
        ...checkFlag2(flag2),
    };
}

export function checkFlag1(flag1 = 0) {
    flag1 = Number(flag1) || 0;
    return {
        isAdmin: hasFlag(flag1,
            USER_FLAG1.ADMIN
        ),
        isHidden: hasFlag(flag1,
            USER_FLAG1.HIDDEN
        ),
        isBJ: hasFlag(flag1,
            USER_FLAG1.BJ
        ),
        isGuest: hasFlag(flag1,
            USER_FLAG1.GUEST
        ),
        isFanClub: hasFlag(flag1,
            USER_FLAG1.FANCLUB
        ),
        isManager: hasFlag(flag1,
            USER_FLAG1.MANAGER
        ),
        isMobile: hasFlag(flag1,
            USER_FLAG1.MOBILE
        ),
        isTopFan: hasFlag(flag1,
            USER_FLAG1.TOP_FAN
        ),
        isRealName: hasFlag(flag1,
            USER_FLAG1.REAL_NAME
        ),
        isQuickView: hasFlag(flag1,
            USER_FLAG1.QUICKVIEW
        ),
        isMobileWeb: hasFlag(flag1,
            USER_FLAG1.MOBILE_WEB
        ),
        isNightBot: hasFlag(flag1,
            USER_FLAG1.NIGHTBOT
        ),
        isBlock: hasFlag(flag1,
            USER_FLAG1.BLOCK
        )
    };
}

export function checkFlag2(flag2 = 0) {
    flag2 = Number(flag2) || 0;
    return {
        isGlobalPc: hasFlag(flag2,
            USER_FLAG2.GLOBAL_PC
        ),
        isClan: hasFlag(flag2,
            USER_FLAG2.CLAN
        ),
        isTopClan: hasFlag(flag2,
            USER_FLAG2.TOP_CLAN
        ),
        isTop20: hasFlag(flag2,
            USER_FLAG2.TOP_20
        ),
        isEmployee: hasFlag(flag2,
            USER_FLAG2.EMPLOYEE
        ),
        isCleanAti: hasFlag(flag2,
            USER_FLAG2.CLEAN_ATI
        ),
        isPolice: hasFlag(flag2,
            USER_FLAG2.POLICE
        ),
        isAdminChat: hasFlag(flag2,
            USER_FLAG2.ADMIN_CHAT
        ),
        isPc: hasFlag(flag2,
            USER_FLAG2.PC
        ),
        isSpecify: hasFlag(flag2,
            USER_FLAG2.SPECIFY
        ),
        isTier1: hasFlag(flag2,
            USER_FLAG2.FOLLOW_TIER1
        ),
        isTier2: hasFlag(flag2,
            USER_FLAG2.FOLLOW_TIER2
        ),
        isTier3: hasFlag(flag2,
            USER_FLAG2.FOLLOW_TIER3
        )
    };
}

export function parseIceAuth(mask = 0) {
    mask = Number(mask) || 0;

    return {
        isStreamerAllowed: hasFlag(mask,
            ICE_AUTH.STREAMER
        ),
        isFanClubAllowed: hasFlag(mask,
            ICE_AUTH.FAN_CLUB
        ),
        isSupporterAllowed: hasFlag(mask,
            ICE_AUTH.SUPPORTER
        ),
        isTopFanAllowed: hasFlag(mask,
            ICE_AUTH.TOP_FAN
        ),
        isSubscriberAllowed: hasFlag(mask,
            ICE_AUTH.SUBSCRIBER
        ),
        isManagerAllowed: hasFlag(mask,
            ICE_AUTH.MANAGER
        ),
    };
}

export function userInfo(flag = '0|0') {
    const info = checkFlag(flag);

    let role = '일반';

    if (info.isBJ) role = '스트리머';
    else if (info.isManager) role = '매니저';
    else if (info.isTopFan) role = '열혈';
    else if (info.isTier1
        || info.isTier2
        || info.isTier3) role = '구독';
    else if (info.isFanClub) role = '팬';
    else if (info.isNightBot) role = '봇';
    else if (info.isAdmin
        || info.isAdminChat) role = '운영자';

    let tier = 0;

    if (info.isTier3) tier = 3;
    else if (info.isTier2) tier = 2;
    else if (info.isTier1) tier = 1;

    return { role, tier, ...info };
}

function parseMonth(value = '') {
    const p = new URLSearchParams(value);
    const fw = Number(p.get('fw'));
    const afw = Number(p.get('afw'));

    return {
        fw: fw > 0 ? fw : 0,
        afw: afw > 0 ? afw : 0
    }
}