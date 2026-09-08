import {mkdirSync,writeFileSync} from 'node:fs';
import {Store,seed} from '../apps/api/src/store.ts';
mkdirSync('.local',{recursive:true,mode:0o700});const s=new Store('.local/app.sqlite');try{const data=seed(s);writeFileSync('.local/demo-credentials.json',JSON.stringify(data.credentials,null,2),{mode:0o600});console.log('Sentetik veri hazır. Giriş bilgileri: .local/demo-credentials.json');}finally{s.close();}
