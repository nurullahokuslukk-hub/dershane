import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {Store,seed} from '../apps/api/src/store.ts';
import {app} from '../apps/api/src/server.ts';
const db=new Store(),credentials=seed(db).credentials,server=app(db);
await new Promise(r=>server.listen(3100,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function login(login){await page.context().clearCookies();await page.goto('http://127.0.0.1:3100');const c=credentials.find(x=>x.tenant==='cizre-demo'&&x.login===login);await page.locator('[name=login]').fill(c.login);await page.locator('[name=password]').fill(c.password);await page.locator('#login button').click();await page.locator('#content').waitFor();}
try{
 await login('rehberlik');assert.equal(await page.locator('.app-row').count(),4);await page.locator('#category').selectOption({label:'Eğitim'});assert.equal(await page.locator('.app-row').count(),1);
 await page.locator('[data-tab=notes]').click();await page.locator('textarea').fill('Test <img src=x onerror=alert(1)>');await page.locator('#noteForm button').click();await page.waitForFunction(()=>document.querySelector('#section')?.textContent.includes('Test <img'));assert.equal(await page.locator('#section img').count(),0);
 await page.setViewportSize({width:390,height:844});await page.locator('#privacy').click();await page.locator('dialog').waitFor();await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'detached'});assert.equal(await page.locator('dialog').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.setViewportSize({width:1440,height:1000});await login('admin');const choices=await page.locator('.student-chip').evaluateAll(es=>es.map(e=>({id:e.dataset.id,name:e.textContent}))),ada=choices.find(x=>x.name.includes('Ada')),deniz=choices.find(x=>x.name.includes('Deniz'));
 await page.route('**/api/v1/students/*',async route=>{if(route.request().url().endsWith(ada.id))await new Promise(r=>setTimeout(r,400));await route.continue();});await page.locator(`[data-id="${ada.id}"]`).click();await page.locator(`[data-id="${deniz.id}"]`).click();await page.waitForTimeout(650);assert.equal(await page.locator('#content .person h2').textContent(),'Örnek Deniz');assert.equal(await page.locator('#content .avatar').textContent(),'ÖD');
 assert.deepEqual(errors,[]);console.log('Browser checks passed: filter, note/XSS, mobile modal, overflow, delayed profile race, initials.');
}finally{await browser.close();await new Promise(r=>server.close(r));db.close();}
