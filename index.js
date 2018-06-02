let superagent = require('superagent');
const cheerio = require('cheerio');
// extend with Request#proxy()
superagent = require('superagent-proxy')(superagent);

let $; // html节点的 cheerio 对象
const BASE_URL = 'https://www.douban.com/group/topic/15592087/?start=';
let isNextUrl = true;
let TITLE = ''; // 标题
const allContent = {}; // 评论内容 { name: '', profileUrl:'', motto: '', avatar: '', time: '', comment: '' }

let count = 0;

// 节点
const ELEMENTS = {
  titEl: '#content h1', // 标题
  commentEl: '.topic-reply', // 所有人评论的容器节点
  commentItemEl: '.comment-item', // 个人评论的容器节点
  profileEl: '.user-face a', // 个人的简介网址
  avatarEl: '.user-face a img', // 头像
  contentEl: '.reply-doc', // 评论内容节点容器
  headerEl: '.reply-doc .bg-img-green', // 包裹个人信息的容器节点
  nameEl: '.reply-doc .bg-img-green a', // 姓名
  timeEl: '.reply-doc .bg-img-green .pubtime', // 评论时间
  quoteEl: '.reply-doc .reply-quote'
}

const reqHeader = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36',
  'Cookie': 'bid=Xu9V42vYivs; __yadk_uid=jQQTuaChQACdvH5pHku0dODxoBzQENyw; ll="118172"; __utmv=30149280.14313; _vwo_uuid_v2=14BEED06F99DC3261673DD6187D54D64|be14237c76c93b967488b3e3bee1c483; gr_user_id=91ef7c59-860f-4b03-8547-b407f3e4b9f4; __utmc=30149280; __ads_session=0Jbb1eq3FwlWpP8LLAA=; viewed="4242172_6082808_10763902_26356948_20427187"; ap=1; ct=y; ps=y; push_noty_num=0; push_doumail_num=0; _pk_ref.100001.8cb4=%5B%22%22%2C%22%22%2C1527967332%2C%22https%3A%2F%2Fwww.baidu.com%2Flink%3Furl%3DB3ah31uagv_1v1oky6ACroN9pFL5XAHin1TV6R2K_dY9LgyYS9YlYm_6Exsw1GnU%26wd%3D%26eqid%3De2e27db50001323b000000035b12ee60%22%5D; _pk_ses.100001.8cb4=*; __utma=30149280.223311855.1508518241.1527960726.1527967334.67; __utmz=30149280.1527967334.67.46.utmcsr=baidu|utmccn=(organic)|utmcmd=organic; __utmt=1; dbcl2="143139100:azeesk1OqKI"; ck=MA7P; _pk_id.100001.8cb4=bd0e6af9c969d2cf.1508518240.35.1527967742.1527964321.; __utmb=30149280.32.5.1527967742360'
}

// 请求页面数据
function getUrl(url) {
  superagent.get(url)
  .set(reqHeader)
  .then(getUrlSuc)
  .catch(getUrlErr);
}

// 请求页面成功
function getUrlSuc(res) {
  $ = cheerio.load(res.text);

  // 获得标题
  const titEl = $(ELEMENTS.titEl)[0];
  const title = $(titEl).text();
  if (!TITLE && title) {
    TITLE = title;
    console.log('title=', title)
  }

  // 获得回答
  const commitEls = $(ELEMENTS.commentEl).map((parentIndex, parentEl) => {
    const itemEls = $(ELEMENTS.commentItemEl, parentEl)
      
    itemEls.map((indexChild, childEl) => {
      parseInfo(childEl);
    })
  })
}

// 解析个人信息
function parseInfo(childEl) {
  const quoteEl = $(childEl).find(ELEMENTS.quoteEl)
  if (quoteEl.length) {
    count++;
    console.log('count---', count)
  }
  if (quoteEl.length) return; // 去除评论他人的内容 

  const profileUrl = $(ELEMENTS.profileEl, childEl).attr('href'); // 简介地址
  const avatar = $(ELEMENTS.avatarEl, childEl).attr('src'); // 头像

  const contentEl = $(ELEMENTS.contentEl, childEl);
  const headEl = $(ELEMENTS.headerEl, childEl);
  const name = $(ELEMENTS.nameEl, childEl).text(); // 姓名
  const time = $(ELEMENTS.timeEl, childEl).text(); // 评论时间

  const headContent = headEl.text();
  let motto = '';
  try {
    const firstMatchIdx = headContent.indexOf('(');
    const lastMatchIdx = headContent.indexOf(')');
    if ((firstMatchIdx > -1) && (lastMatchIdx > -1)) { // 存在座右铭
      motto = headContent.slice(firstMatchIdx + 1, lastMatchIdx); // 座右铭
    }
  } catch(e) {
    console.log('e=', e)
  }

  const comment = contentEl.children('p').text(); // 评论

  allContent[profileUrl] = { // 保存数据
    name, 
    profileUrl, 
    motto, 
    avatar, 
    time, 
    comment, 
  }
}

// 请求页面失败
function getUrlErr(err) {
  console.log('err=', err)
  isNextUrl = false;
}

// 初始化
async function init() {
  let page = 0;
  let pageUrl = `${BASE_URL}${page}`;
  let initRes;
  try {
    initRes = await superagent.get(pageUrl).set(reqHeader);
    $ = cheerio.load(initRes.text);
    const lastPageUrl = $('.paginator').children('a').last().attr('href');
    const timer = setInterval(() => {
      pageUrl = `${BASE_URL}${page}`
      getUrl(pageUrl);
      if (pageUrl === lastPageUrl) { // 所有页面加载结束
        console.log('page=', page)
        clearInterval(timer);
        return;
      }
      page += 100;
    }, 3000)
  } catch (e) {
    console.log('e====', e)
  }
}

init();


