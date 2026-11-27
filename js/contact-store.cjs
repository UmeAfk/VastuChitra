const crypto=require('node:crypto');
function validateContact(input={}){
 const name=String(input.name||'').trim(),email=String(input.email||'').trim().toLowerCase(),phone=String(input.phone||'').trim();
 if(name.length<2||name.length>100)throw new Error('Please enter your name (2–100 characters).');
 if(email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Please enter a valid email address.');
 if(!/^[+\d() .-]+$/.test(phone)||phone.replace(/\D/g,'').length<7||phone.replace(/\D/g,'').length>15)throw new Error('Please enter a valid phone number.');
 return {name,email,phone};
}
function encryptContact(record,secret){const key=Buffer.from(secret||'','base64');if(key.length!==32)throw new Error('Private enquiry storage is not configured.');const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);const data=Buffer.concat([cipher.update(JSON.stringify(record),'utf8'),cipher.final()]);return {iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')};}
function decryptContact(value,secret){const decipher=crypto.createDecipheriv('aes-256-gcm',Buffer.from(secret,'base64'),Buffer.from(value.iv,'base64'));decipher.setAuthTag(Buffer.from(value.tag,'base64'));return JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.data,'base64')),decipher.final()]).toString('utf8'));}
module.exports={validateContact,encryptContact,decryptContact};
