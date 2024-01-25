const axios = require("axios");
const qs = require("qs");
const fs = require("fs");

const userKey = "hQXCDKXKZGdLKqSJCg8EPG";
const password = "g8WDdmw84ZyuEYGuAtw1Sz";
const cookieCloudApi = "http://192.168.1.129:8088";
const generateFile=false
module.exports.getCloudCookies = async()=> {
    const data = await getCookieCloud();
    const cookieData = data.cookie_data;
    const allSites = Object.keys(cookieData);
    const configSites = await getConfigSites();
    const signConfigs = configSites.map(site => {
        const domain = site.url.split("/")[2];
        const remark = site.remark;
        const proxy= site.proxy
        if (allSites.includes(domain)) {
            const siteCookies = cookieData[domain];
            const siteCookie = siteCookies.map(cookie => `${cookie.name}=${cookie.value}`).join(";");
            return {url: site.url, siteName: remark, active: 1, cookie: siteCookie,proxy:proxy};
        }
        return null;
    }).filter(Boolean);
    if(generateFile){
        fs.writeFile('./dataConfig.json', JSON.stringify(signConfigs, null, "\t"), (err) => {
            if (err)throw err;
            console.log("签到配置文件生成成功...");
        });
    }else {
        console.log("签到配置文件默认不生成...");
    }
    console.log("一共获取到" + signConfigs.length + "个站点的签到配置")
    return signConfigs;
}

async function getCookieCloud() {
    const body = await axios.post(`${cookieCloudApi}/get/${userKey}`, qs.stringify({"password": password}));
    return body.data;
}

/**
 * 获取配置的站点
 * @returns {Promise<string[]>}
 */
async function getConfigSites() {
    //启用的站点
    const body = await axios.get("https://sites.bilin.eu.org/");
    return body.data.sites;
}





