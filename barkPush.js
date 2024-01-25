const axios = require("axios")
module.exports = {barkPush, pushBeer};

async function barkPush(title, desc) {
    try {
        let url = encodeURI('https://api.day.app/Y3pFpzvTtfhyaJxeAQtXGR/' + title + '/' + desc + '/?icon=https://cdn.jsdelivr.net/gh/braless/site_logo/Bittorrent.png')
        let res = await axios.get(url)
        if (res.data.code == 200) {
            console.log('server酱:发送成功')
        } else {
            console.log('server酱:发送失败')
        }
    } catch (err) {
        console.log(err);
    }
}

async function pushBeer(msg) {
    try {
        let url = encodeURI('https://api2.pushdeer.com/message/push?pushkey=PDU17098T0SfVBbsmumpg1pIwNTQpkL5GfgZHNqkv&text=' + msg)
        let res = await axios.get(url)
        if (res.data.code == 200) {
            console.log('Pushdeer酱:发送成功')
        } else {
            console.log('Pushdeer酱:发送失败')
            console.log(res.data)
        }
    } catch (err) {
        console.log(err);
    }
}