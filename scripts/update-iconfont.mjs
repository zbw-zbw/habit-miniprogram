import fs from 'fs-extra';
import fetch from 'node-fetch';
import unzipper from 'unzipper';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取 __dirname 替代
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🟡 替换为你的下载地址
const ICONFONT_URL =
  'https://www.iconfont.cn/api/project/download.zip?spm=a313x.manage_type_myprojects.i1.d7543c303.70393a81oEdNzc&pid=4934226&ctoken=iCnhu9_-kaPHYMFuTsVg9WQi';

// 🟡 设置 Cookie（从 curl 提取）
const COOKIE =
  'EGG_SESS_ICONFONT=Hu68kBY7XO7C6Udp3T99M1asKmUZ0gxjps8xjTrjx4aHaXwoIsDX25rpXZ2zp9tczibClyXdTQqv_kqXliYYcfk5APBExDCOOHENSugdiSSBJ4hAcTBXdqE5ICCmvFdzSLtZNSoe3IVZPsODuO2-_o2UehZ4AA5AudwZYya7UflQ2QT4pwKIwmc_75QPB0BgWTeMTOIH7Z8DtPClC2areQLzEHe1sknNeGOIwHkg8DL5VtB_b8kRAps3xPpofoE091_1VMAomlMKyZGEE_2ZI4U0NOEkxsHOjbXJpJNXDnsdx68OQPQ3yXTV-RnVSQJb; ctoken=iCnhu9_-kaPHYMFuTsVg9WQi; u=14389306; u.sig=N2xJaYfXs1mYU6Yq7QkFcliEWAvHNEBWZjXmPLJUaUE; xlly_s=1; tfstk=gVCEnIv_sWFF6NKpK1Orb_ftkodpbQrfZ_tWrabkRHxnOXilQMsJALaJOT8kbgpWxwwdUQSc0HbCPuhrrBC1dbtQvQ7lcQrbcSNfJwd9ZoZbpDNxcIYnE0mWxcDMNU-CfvgNJwd-WViuhObKzey49pAlqCvMueAk-bxu7dYXrQcHEXDijhKMZUvkxAAMkELHrejlSP8Jj3AkKgAg7UH1tgjK_hJ3yOmBCxuu0nKc-hlogqLDK5LSF4g7ZFvwmdciabzJ8p-c-hqYJnlJIapPw4hyUwXA2Ejnxo9drOSw8QPsKIbNEi8OtSieW9_GlhbqojbpTUJDZduoZNRp4dfBiSmwWObCE6IEzbYdOs9yDdzowLOGGKXcY4UASBYl2KC7DXKhrZCAhIPsKIbNEiWP4LnJS0CVw9ooUpY97naa7ZgQpxtkql_seYpaBF-bkrH-epY97naa7YHJQ1LwcrUA.';

// 路径
const OUTPUT_DIR = path.resolve(__dirname, 'assets/fonts/iconfont');
const TEMP_ZIP = path.resolve(__dirname, 'iconfont_temp.zip');

async function downloadAndExtractIconfont() {
  console.log('⏬ 正在下载 iconfont.zip...');

  const res = await fetch(ICONFONT_URL, {
    headers: {
      cookie: COOKIE,
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    console.error('❌ 下载失败：', res.statusText);
    return;
  }

  const fileStream = fs.createWriteStream(TEMP_ZIP);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });

  console.log('📦 下载完成，正在解压到：', OUTPUT_DIR);

  await fs.emptyDir(OUTPUT_DIR);

  await fs
    .createReadStream(TEMP_ZIP)
    .pipe(unzipper.Extract({ path: OUTPUT_DIR }))
    .promise();

  await fs.remove(TEMP_ZIP);

  console.log('🎉 iconfont 文件已更新成功！');
}

downloadAndExtractIconfont().catch((err) => {
  console.error('❌ 更新失败：', err);
});
