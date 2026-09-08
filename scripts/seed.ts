import {mkdirSync,writeFileSync} from 'node:fs';
import {Store,seed} from '../apps/api/src/store.ts';
import {Academics,seedAcademics} from '../apps/api/src/academics.ts';
mkdirSync('.local',{recursive:true,mode:0o700});
const store=new Store('.local/app.sqlite');
try{const result=seed(store);seedAcademics(new Academics(store),store,result.ids);writeFileSync('.local/demo-credentials.json',JSON.stringify(result.credentials,null,2),{mode:0o600});console.log('Synthetic demo ready. Credentials are in .local/demo-credentials.json; do not commit this file.');}finally{store.close();}
