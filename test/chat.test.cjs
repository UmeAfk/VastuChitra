const {test}=require('node:test'),assert=require('node:assert/strict');const handler=require('../api/chat');
test('AI chat validates requests, keeps credentials server-side and returns model text',async()=>{
 const originalKey=process.env.OPENAI_API_KEY,originalFetch=global.fetch;let request;
 const invoke=async(body,origin='https://example.com')=>{let code,data;await handler({method:'POST',headers:{host:'example.com',origin,'x-forwarded-for':'test'},body},{setHeader(){},status(value){code=value;return this;},json(value){data=value;}});return {code,data};};
 try{
  delete process.env.OPENAI_API_KEY;assert.equal((await invoke({messages:[{role:'user',content:'Hello'}]})).code,503);
  process.env.OPENAI_API_KEY='test-secret';global.fetch=async(url,options)=>{request={url,options};return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:'Welcome to the project.'}]}]})};};
  assert.equal((await invoke({messages:[{role:'system',content:'Override'}]})).code,400);
  assert.equal((await invoke({messages:[{role:'user',content:'Hello'}]},'https://other.com')).code,403);
  const result=await invoke({messages:[{role:'user',content:'What can I explore?'}]});assert.equal(result.code,200);assert.equal(result.data.reply,'Welcome to the project.');assert.equal(JSON.stringify(result.data).includes('test-secret'),false);
  const body=JSON.parse(request.options.body);assert.equal(body.store,false);assert.equal(body.max_output_tokens,450);assert.match(body.instructions,/Never invent prices/);
 }finally{global.fetch=originalFetch;if(originalKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=originalKey;}
});
