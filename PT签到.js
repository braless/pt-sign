/**
 *
 PT签到
 0 0,8,21 * * *PT签到.js
 */
const moment = require("moment")
const fs = require("fs")
const barkNotify = require("./barkPush");
const cloudCookie = require("./CookieCloudUtil");//云cookie
const axios = require("axios")
const cookie_cloud = true; //是否使用cookie云
let endmsg = "";
let msg = "";
var now = moment().locale('zh-cn').format('YYYY-MM-DD');
var day = moment(now).diff(moment("2021-05-01"), 'days');
run();

/**
 * 入口函数
 * @returns
 */
async function run() {
    try {
        console.log("当前使用的是Cookie来源是:", cookie_cloud ? "COOKIECLOUD" : "本地Cookie")
        let sites = cookie_cloud ? await cloudCookie.getCloudCookies() : JSON.parse(fs.readFileSync('./dataConfig.json'));
        let startTime = new Date().getTime();
        const tips = "本签到已运行:" + day + "天"
        console.log(tips)
        for (let i = 0; i < sites.length; i++) {
            //if (sites[i].siteName.match(/PT-Time/))
                await SIGN(sites[i], i + 1)
        }
        let endTime = new Date().getTime();
        let cost = "执行消耗时间:" + (endTime - startTime) / 1000 + "秒"
        console.log("\n")
        console.log("最终结果:")
        console.log(endmsg + "\n" + cost)
        //自己决定使用哪个推送
        if (new Date().getHours() < 8) {
            await barkNotify("PT签到", tips + "\n" + endmsg)
        } else {
            console.log("凌晨签到-------不发送通知-----")
        }

    } catch (err) {
        console.log("ERROR_0", err);
    }
}

async function SIGN(site, index) {
    var title = site.siteName;
    var url = site.url;
    var cookie = site.cookie;
    const proxy = site.proxy;
    const header = getHeader(cookie, url);
    let responseData;
    try {
        let body = await axios.get(url, header);
        if (body.data.toString().search("您今天已经签到过了") != -1) {
            title = title + "-已签过! "
        } else {
            title = title + "-模拟! "
        }
        //猫站
        if (title.search("猫站") != -1) {
            let msg = endmsg + "[" + index + "]" + "猫站-" + body.data.message;
            endmsg = msg + "\n";
            return
        }
        responseData = await removeHtmlLabels(body.data);
        let position = await getPosition(title, responseData)
        let start = position.start;
        let end = position.end;
        console.log("***********************************************")
        //console.log("起始位置"+start+",结束位置:"+end)
        let result = responseData.substring(start, end).replace("点对战版", "").replace("]", "").toString()
        // console.log("数据截取后的结果: "+result)
        let msg = "[" + index + "]" + title + "魔力值" + result.substring(result.indexOf(":")).replace(/\s+/g, "");
        endmsg = endmsg + msg + "\n";
        console.log(msg)
    } catch (err) {
        console.log("[" + index + "]" + title + " 模拟 签到失败~,进行使用代理签到...",);

    }
}

// prettier-ignore

function find(str, cha, num) {
    var x = str.indexOf(cha);
    for (var i = 0; i < num; i++) {
        x = str.indexOf(cha, x + 1);
    }
    return x;
}

//正则
function removeHtmlLabels(document) {
    var document = document.replace(/<[^>]+>|&[^>]+;/g, ''); //去除HTML Tag
    document = document.replace(/[|]*\n/, '') //去除行尾空格
    document = document.replace(/\s/g, '');//去掉所有的空格
    document = document.replace(/&npsp;/ig, ''); //去掉npsp
    document = document.replace(/[\n\t]/g, "");//去除换行符
    document = document.replace(/[a-z]*/g, "");//所有小写字母
    document = document.replace(/[{}=;\-+#||\/\/()_$'"]/g, '');//所有小写字母
    return document;
}

/**
 * 设置Header
 * @param cookie
 * @param url
 * @returns {{headers: {"sec-fetch-mode": string, referer: string, "sec-ch-ua": string, cookie, "sec-ch-ua-platform": string, authority: string, "content-type": string, dnt: string, "cache-control": string, "user-agent": string, accept: string}}}
 */
function getHeader(cookie, url) {
    let req_header = {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Cookie": cookie,
            "dnt": "1",
            "cache-control": "max-age=0",
            "sec-fetch-mode": "navigate",
            "sec-ch-ua-platform": "Windows",
            "sec-ch-ua": " Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Google Chrome\";v=\"98",
            "content-type": "text/html; charset=utf-8; Cache-control:private",
            "referer": url.substring(0, find(url, '/', 2)) + '/',
            "authority": url.substring(0, find(url, '/', 2)) + '/',
            "accept": "*/*"
        },
    };
    return req_header;
}

/**
 * 获取开始结束位置
 * @param title
 * @param data
 * @returns {Promise<{}>}
 */
async function getPosition(siteName, data) {
    let ret = {};
    let start = data.indexOf('魔力值');//起始位置
    let end = data.indexOf('邀请')//结束位置
    if (siteName.match(/1ptba/)) {
        end = data.indexOf('勋章') - 1
    }
    if (siteName.match(/小蚂蚁/)) {
        end = data.indexOf('勋章') - 1
    }
    if (siteName.match(/HdTime/)) {
        end = data.indexOf('邀请') - 4
    }
    if (siteName.match(/阿童木/)) {
        end = data.indexOf('勋章') - 1
    }
    if (siteName.match(/学校/)) {
        start = data.indexOf('使用')
    }
    if (siteName.match(/M-team/)) {
        end = data.indexOf("邀請");
    }
    if (siteName.match(/PT-Time/)) {
        start = data.indexOf("使用&说明")
        end = data.indexOf("详情") - 1;
    }
    if (siteName.search("HdHome") != -1) {
        end = data.indexOf("做种");
    }
    if (siteName.match(/烧包/)) {
        start = data.indexOf("用你的魔力值") + 6
        end = data.indexOf("换东东");
    }
    if (siteName.match(/52PT/)) {
        end = data.indexOf("邀请系统") - 10;
    }
    if (siteName.match(/老师站/)) {
        end = data.indexOf('勋章') - 1
    }
    if (siteName.match(/大青虫/)) {
        end = data.indexOf('勋章') - 1
    }
    if (siteName.match(/ubits/)) {
        end = data.indexOf('勋章') - 1
    }
    if (siteName.match(/肉丝/)) {
        end = data.indexOf('勋章') - 1
    }
    if (siteName.match(/Game/)) {
        start = data.indexOf('使用')
        end = data.indexOf('勋章') - 1
    }
    if (siteName.match(/象站/)) {
        start = data.indexOf('当前象草余额')
        end = data.indexOf('兑换奖励')
    }
    ret["start"] = start;
    ret["end"] = end;
    return ret;

}