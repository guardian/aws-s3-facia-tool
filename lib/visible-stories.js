const map = {
    'fixed/small/slow-IV': {
        mobile: 4,
        desktop: 4
    },
    'fixed/medium/fast-XII': {
        mobile: 6,
        desktop: 12
    },
    'fixed/small/slow-III': {
        mobile: 3,
        desktop: 3
    },
    'fixed/small/slow-V-third': {
        mobile: 5,
        desktop: 5
    },
    'fixed/small/slow-I': {
        mobile: 1,
        desktop: 1
    },
    'fixed/medium/slow-VI': {
        mobile: 6,
        desktop: 6
    },
    'fixed/large/slow-XIV': {
        mobile: 6,
        desktop: 14
    },
    'fixed/medium/fast-XI': {
        mobile: 6,
        desktop: 11
    },
    'fixed/medium/slow-XII-mpu': {
        mobile: 6,
        desktop: 9
    },
    'fixed/thrasher': {
        mobile: 1,
        desktop: 1
    },
    'fixed/video': {
        mobile: 3,
        desktop: 3
    },
    'fixed/medium/slow-VII': {
        mobile: 6,
        desktop: 7
    },
    'fixed/small/fast-VIII': {
        mobile: 6,
        desktop: 8
    },
    'fixed/small/slow-V-mpu': {
        mobile: 4,
        desktop: 4
    },
    'fixed/small/slow-V-half': {
        mobile: 5,
        desktop: 5
    },
    'dynamic/fast': {
        mobile: list => {
            const bigs = countBigs(list);
            if (bigs === 0) {
                return 12;
            } else if (bigs === 1) {
                return 10;
            } else if (bigs === 2) {
                return 8;
            } else if (bigs === 3) {
                return 6;
            } else {
                return 4;
            }
        },
        desktop: list => {
            const bigs = countBigs(list);
            if (bigs === 0) {
                return 12;
            } else if (bigs === 1) {
                return 10;
            } else if (bigs === 2) {
                return 8;
            } else if (bigs === 3) {
                return 6;
            } else {
                return 4;
            }
        }
    },
    'dynamic/slow': {
        mobile: list => {
            const bigs = countBigs(list);
            if (bigs === 0) {
                return 8;
            } else if (bigs === 1) {
                return 5;
            } else {
                return 7;
            }
        },
        desktop: list => {
            const bigs = countBigs(list);
            if (bigs === 0) {
                return 8;
            } else if (bigs === 1) {
                return 5;
            } else {
                return 7;
            }
        }
    },
    'dynamic/package': {
        mobile: list => {
            const bigs = Math.max(countBigs(list), 1);
            return bigs === 0 ? 4 : 5;
        },
        desktop: list => {
            const bigs = Math.max(countBigs(list), 1);
            return bigs === 0 ? 4 : 5;
        }
    },
    'dynamic/slow-mpu': {
        mobile: list => {
            const bigs = countBigs(list);
            if (bigs === 0) {
                return 4;
            } else {
                return 5;
            }
        },
        desktop: list => {
            const bigs = countBigs(list);
            if (bigs === 0) {
                return 4;
            } else {
                return 5;
            }
        }
    },
    'nav/list': {
        mobile: list => list.length,
        desktop: list => list.length
    },
    'nav/media-list': {
        mobile: list => list.length,
        desktop: list => list.length
    },
    'news/most-popular': {
        mobile: 10,
        desktop: 10
    }
};

function countBigs (list) {
    return list.filter(trail => trail.metadata && trail.metadata.group != '0').length;
}

export default function (type, list = []) {
    const maxValue = map[type];
    if (maxValue) {
        if (typeof maxValue.desktop === 'function') {
            return {
                desktop: Math.min(maxValue.desktop(list), list.length),
                mobile: Math.min(maxValue.mobile(list), list.length)
            };
        } else {
            return {
                desktop: Math.min(maxValue.desktop, list.length),
                mobile: Math.min(maxValue.mobile, list.length)
            };
        }
    }
}
