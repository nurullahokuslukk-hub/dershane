import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {Store,seed} from '../apps/api/src/store.ts';
import {app} from '../apps/api/src/server.ts';
const db=new Store(),fixture=seed(db),server=app(db);
await new Promise(r=>server.listen(3100,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})}),page=await browser.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function login(role){await page.context().clearCookies();await page.goto('http://127.0.0.1:3100');const c=fixture.credentials.find(c=>c.tenant==='cizre-demo'&&c.login===role);await page.locator('[name=login]').fill(c.login);await page.locator('[name=password]').fill(c.password);await page.locator('#login button').click();await page.locator('#section').waitFor();}
try{
 await login('ogretmen');await page.locator('[data-tab=exams]').click();await page.locator('[data-action=new-exam]').click();await page.locator('dialog [name=title]').fill('Konu notu QA');await page.locator('dialog fieldset').first().locator('summary').click();await page.locator('[name=topic0]').fill('Paragraf');await page.locator('[name=topicBlank0]').fill('2');await page.locator('dialog [type=submit]').click();await page.locator('dialog').waitFor({state:'detached'});await page.locator('.topic-list').waitFor();assert.match(await page.locator('.topic-list').textContent(),/Paragraf/);
 await page.setViewportSize({width:390,height:844});await login('ogrenci');await page.locator('[data-tab=exams]').click();await page.locator('.topic-list').scrollIntoViewIfNeeded();assert.match(await page.locator('.topic-list').textContent(),/0 yanlış · 2 boş/);
 const geometry=await page.evaluate(()=>{const w=document.querySelector('.workspace').getBoundingClientRect(),nav=document.querySelector('.main-nav').getBoundingClientRect();return {contentBottom:w.bottom,navTop:nav.top,overflow:document.documentElement.scrollWidth>innerWidth};});assert.equal(geometry.overflow,false);assert.ok(geometry.contentBottom<=geometry.navTop+1,'dock must not obscure scrollable content');assert.deepEqual(errors,[]);console.log('Topic annotation persists from teacher form to student analysis; mobile dock reserves content space.');
}finally{await browser.close();await new Promise(r=>server.close(r));db.close();}
