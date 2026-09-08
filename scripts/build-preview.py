from pathlib import Path
r=Path(__file__).resolve().parents[1]
css=(r/'apps/web/style.css').read_text()
c=(r/'apps/web/client.js').read_text().replace('export ','')
u=(r/'apps/web/academic-ui.js').read_text().replace('export ','')
a=(r/'apps/web/app.js').read_text().replace("import {api,preview} from './client.js';",'').replace("import {icon,renderAcademicView} from './academic-ui.js';",'')
u='const {icon,renderAcademicView}=(()=>{'+u+';return {icon,renderAcademicView};})();'
out='<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dershane · Yeni öğrenci deneyimi</title><style>'+css+'</style></head><body><div id="root"></div><div id="toast" role="status"></div><script type="module">globalThis.DESIGN_PREVIEW=true;'+c+'\n'+u+'\n'+a+'</script></body></html>'
(r/'design').mkdir(exist_ok=True)
(r/'design/preview.html').write_text(out)
