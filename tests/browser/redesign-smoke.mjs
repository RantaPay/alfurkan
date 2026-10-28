/* Run against the local preview with PLAYWRIGHT_MODULE pointing to an external Playwright installation.
   Every API request is intercepted before navigation. No production credentials or records are used. */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const loadPlaywright = createRequire(import.meta.url);
const { chromium } = loadPlaywright(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:3100';
const artifacts = process.env.SMOKE_ARTIFACTS || '/tmp/alfurqan-redesign-results';
const student = { id:'fixture-maryam', fullName:'Maryam Ishaq Eniola (SR)', regNumber:'JS201', class:'JSS 1 A', gender:'Female', parentName:'Ishaq Eniola', parentPhone:'08000000000', totalTermBill:30000, totalPaid:61500, balanceRemaining:13500, status:'PARTIAL', createdAt:'2026-10-28', paidBanks:['Jaiz Bank'], paymentBank:'Jaiz Bank' };
const staff = { id:'fixture-admin', name:'Fixture Accountant', email:'accountant@example.test', role:'Admin', pin:'', title:'Accountant' };
const fees = [{ classLevel:'JSS 1', tuitionFee:60000, booksFee:27000, uniformFee:18000, sportsWearFee:0, totalBill:105000 }];
const school = { name:'Alfurqan International Academy', shortName:'Alfurqan', motto:'Knowledge and Guidance', address:'Bauchi', email:'accounts@example.test', phone:'08000000000', currentTerm:'1st Term', currentSession:'2026/2027 Session', bankName:'Jaiz Bank', accountNumber:'0000000000', accountName:'School accounts', accountantName:staff.name, logoUrl:'/logo.png', receiptPrefix:'AFIA/', receiptFooterNote:'Fixture receipt', defaultReceiptFormat:'traditional', showStamp:true, bankAccounts:[{id:'fixture-bank',bankName:'Jaiz Bank',accountNumber:'0000000000',accountName:'School accounts',isDefault:true}], feeStructure:fees, feeScheduleHistory:[], concessions:{preNurseryNurseryPb:0,basic:20000,jss1_2:30000,jss3:40000,ss1:40000,ss2_3:50000,dualSrYr:0,adf:0} };
const receipt = { id:'fixture-receipt',receiptNumber:'AFIA/FIXTURE/001',studentId:student.id,regNumber:student.regNumber,studentName:student.fullName,studentClass:student.class,parentName:student.parentName,parentPhone:student.parentPhone,amountPaid:64000,totalTermBill:75000,previousTotalPaid:0,newTotalPaid:61500,balanceRemaining:13500,paymentStatus:'PARTIAL',paymentMethod:'Bank Transfer',bankName:'Jaiz Bank',items:[{name:'Textbooks',category:'Books',amount:19000},{name:'Notebook',category:'Books',amount:8000},{name:'School Uniform',category:'Uniform',amount:18000},{name:'Tuition / School Fees',category:'Tuition',amount:16500,chargeAmount:30000,chargeBalance:13500},{name:'Previous Term Debt',category:'Other',amount:2500}],term:'1st Term',session:school.currentSession,date:'28 October 2026',timestamp:'2026-10-28T10:00:00Z',issuedBy:staff.name,securityHash:'fixture-only' };
const voided = {...receipt,id:'fixture-voided',receiptNumber:'AFIA/FIXTURE/002',isVoided:true,voidReason:'Fixture cancellation',voidedBy:staff.name};
const external = {...receipt,id:'fixture-external',receiptNumber:'AFIA/FIXTURE/003',studentId:null,studentName:'Bello Sani',regNumber:'N/A',studentClass:'General',items:[{name:'Hall rent',category:'Other',amount:64000}],paymentStatus:'FULL',balanceRemaining:0};
const summary = { period:'1st Term',totalStudents:1,expectedRevenue:75000,collectedRevenue:64000,outstandingDebt:13500,collectionRate:82,fullPaymentCount:0,partialPaymentCount:1,unpaidCount:0,bankReconciliation:[{bankName:'Jaiz Bank',totalAmount:64000,receiptCount:1,percentage:100}] };
(async () => {
 fs.mkdirSync(artifacts,{recursive:true});
 const browser = await chromium.launch({headless:true});
 setTimeout(() => { console.error('Smoke suite deadline exceeded'); browser.close(); process.exit(1); }, 180000).unref();
 const context = await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,permissions:['clipboard-read','clipboard-write']});
 let authenticated=true, failReceipts=false, duplicate=false; const writes=[], unknown=[], errors=[];
 await context.route('**/api/**', async route => {
  const request=route.request(),url=new URL(request.url()),path=url.pathname,method=request.method(); let body;
  if (method!=='GET'){let body;try{body=request.postDataJSON();}catch{body={multipart:true};}writes.push({path,method,body});}
  if(path==='/api/auth/me')body={success:authenticated,user:authenticated?staff:null};
  else if(path==='/api/auth/login'){authenticated=true;body={success:true,user:staff};}
  else if(path==='/api/auth/logout'){authenticated=false;body={success:true};}
  else if(path==='/api/settings')body={success:true,school};
  else if(path==='/api/staff')body={success:true,users:[staff]};
  else if(path==='/api/classes')body={success:true,classes:['JSS 1 A']};
  else if(path==='/api/reports')body={success:true,school,students:[student],summary};
  else if(path==='/api/students/import')body={success:true,result:{students:[student],classes:[{name:student.class,count:1}],totalStudents:1,warningCount:0,warnings:[]},insertedCount:1,classesCount:1};
  else if(path==='/api/students')body={success:true,students:[student],student,updatedCount:1,breakdown:[]};
  else if(path==='/api/receipts/check-duplicate')body={success:true,isDuplicate:duplicate,duplicate:duplicate?{...receipt,feePurpose:'School fees'}:null};
  else if(path==='/api/receipts/void')body={success:true,receipt:voided};
  else if(path==='/api/receipts'){
   if(failReceipts)return route.fulfill({status:503,json:{success:false,error:'Fixture connection failure'}});
   body=method==='GET'?url.searchParams.has('number')?{success:true,receipt:url.searchParams.get('number').includes('002')?voided:receipt}:{success:true,receipts:[receipt,voided,external]}:{success:true,receipt};
  } else {unknown.push(path);return route.fulfill({status:501,json:{success:false,error:'Unmocked fixture route'}});}
  await route.fulfill({json:body});
 });
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 const visit=async path=>{await page.goto(base+path);await page.waitForLoadState('networkidle',{timeout:15000}); console.log('Visited',path);};
 const screenshot=async name=>page.screenshot({path:`${artifacts}/${name}.png`,fullPage:true});
 const noOverflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Viewport overflow');
 await visit('/');await page.getByRole('heading',{name:'Overview',exact:true}).waitFor();await screenshot('overview-desktop');await page.getByRole('button',{name:'Collapse navigation'}).click();assert(await page.getByRole('complementary',{name:'Sidebar',includeHidden:true}).evaluate(element=>element.inert));await page.getByRole('button',{name:'Expand navigation'}).click();
 await page.getByRole('searchbox',{name:'Search students'}).fill('Maryam');await page.getByRole('button',{name:/Maryam Ishaq/}).click();await page.getByRole('dialog',{name:'Issue receipt',exact:true}).waitFor();
 await page.locator('#receipt-payment-period').selectOption('2nd Term');assert.equal(await page.locator('#receipt-payment-period').inputValue(),'2nd Term');
 await screenshot('receipt-desktop');await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
 for(const path of ['/receipts','/reports','/settings']){
  await visit(path);await page.getByRole('button',{name:/Issue receipt/i}).first().click();await page.getByRole('dialog',{name:'Issue receipt',exact:true}).waitFor();await page.keyboard.press('Escape');
 }

 await visit('/?action=issue');
 let form=page.getByRole('dialog',{name:'Issue receipt',exact:true});
 await form.locator('#receipt-payment-period').waitFor();
 await form.getByRole('textbox',{name:'Search students'}).fill('Maryam');
 await form.getByRole('button',{name:/Maryam Ishaq/}).click();
 await form.locator('#receipt-payment-period').selectOption('2nd Term');
 await form.getByRole('spinbutton',{name:'Amount for fee item 1'}).fill('1000');
 await form.getByLabel('Bank reference (optional)').fill('FIXTURE-REF');
 duplicate=true;await form.getByRole('button',{name:'Issue Receipt',exact:true}).click();
 let warning=page.getByRole('dialog',{name:'Possible duplicate receipt'});await warning.waitFor();
 for(let index=0;index<8;index++){await page.keyboard.press('Tab');assert(await warning.evaluate(element=>element.contains(document.activeElement)));}
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),1);assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');
 await form.getByRole('button',{name:'Issue Receipt',exact:true}).click();await warning.getByRole('button',{name:'Continue Anyway'}).click();
 await page.waitForURL('**/receipts/fixture-receipt');
 assert(writes.some(write=>write.path==='/api/receipts'&&write.body.term==='2nd Term'&&write.body.amountPaid===1000&&write.body.bankReference==='FIXTURE-REF'));
 duplicate=false;

 await visit('/?action=issue');form=page.getByRole('dialog',{name:'Issue receipt',exact:true});await form.getByRole('button',{name:'External Payer',exact:true}).click();
 await form.getByRole('textbox',{name:/Payer name/}).first().fill('Bello Sani');await form.getByRole('combobox',{name:'Others'}).first().selectOption('Hall rent');await form.getByRole('spinbutton',{name:'Amount for fee item 1'}).fill('25000');await form.getByRole('button',{name:'Issue Receipt',exact:true}).click();await page.waitForURL('**/receipts/fixture-receipt');
 assert(writes.some(write=>write.path==='/api/receipts'&&write.body.studentId===null&&write.body.studentName==='Bello Sani'&&write.body.amountPaid===25000));
 await visit('/students');await screenshot('students-desktop');await page.getByRole('button',{name:/Edit/}).first().click();await page.getByRole('dialog',{name:'Edit student'}).waitFor();assert.equal(await page.getByRole('textbox',{name:/Full Name/i}).inputValue(),student.fullName);await page.getByRole('button',{name:'Delete',exact:true}).click();await page.getByRole('dialog',{name:'Confirm action'}).waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),1);assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.body.style.overflow),'');

 await page.getByRole('button',{name:'Enroll Student',exact:true}).click();let enrollment=page.getByRole('dialog',{name:'Add student'});await enrollment.getByRole('textbox',{name:'Student Full Name'}).fill('Amina Bello');await enrollment.getByRole('textbox',{name:'Parent / Guardian Name'}).fill('Bello Sani');await enrollment.getByRole('textbox',{name:'Parent Phone Number'}).fill('08000000000');await enrollment.getByRole('button',{name:'Enroll Student',exact:true}).click();await enrollment.getByText(/successfully/i).first().waitFor();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Upload List',exact:true}).click();let importer=page.getByRole('dialog',{name:'Import students'});await importer.locator('input[type=file]').setInputFiles({name:'fixture.csv',mimeType:'text/csv',buffer:Buffer.from('Student Name,Class\nMaryam,JSS 1 A')});await importer.getByRole('button',{name:'Review Student List'}).click();await importer.getByRole('button',{name:/Confirm.*Save/}).click();await importer.getByRole('heading',{name:/Uploaded Successfully/}).waitFor();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Promote',exact:true}).click();let promotion=page.getByRole('dialog',{name:'Promote students'});assert(await promotion.getByRole('button',{name:/Auto-Promote All/}).isDisabled());await promotion.getByRole('checkbox').check();await promotion.getByRole('button',{name:/Auto-Promote All/}).click();await promotion.getByRole('heading',{name:'Session Rollover Completed Successfully!'}).waitFor();await page.keyboard.press('Escape');
 await visit('/settings');await page.getByRole('button',{name:/Bank Accounts/}).click();await page.getByRole('button',{name:'Add Bank Account'}).click();await page.getByRole('dialog',{name:'Bank account'}).waitFor();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Class Fee Schedule',exact:true}).click();await page.getByRole('heading',{name:/Special Category Fees/}).waitFor();await screenshot('settings-fees');
 await page.getByRole('button',{name:/Administrators \(/}).click();await page.getByRole('button',{name:'Add Administrator',exact:true}).click();await page.getByRole('dialog',{name:'Staff account'}).waitFor();await page.keyboard.press('Escape');await page.getByRole('button',{name:'Reset Password',exact:true}).click();await page.getByRole('dialog',{name:'Reset password'}).waitFor();await page.keyboard.press('Escape');
 await screenshot('settings-desktop');
 await visit('/reports');await screenshot('reports-desktop');const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:/CSV|Excel/}).click();const download=await downloadPromise;await download.saveAs(`${artifacts}/report.csv`);
 assert(fs.readFileSync(`${artifacts}/report.csv`,'utf8').includes('Maryam'));const pdfDownload=page.waitForEvent('download');await page.getByRole('button',{name:/Download PDF|Export PDF/}).click();await(await pdfDownload).saveAs(`${artifacts}/report.pdf`);
 await visit('/receipts/fixture-receipt');await page.locator('#printable-receipt').waitFor();await screenshot('receipt-view');for(const [name,file] of [['POS Thermal Roll','thermal'],['Standard Slip','traditional'],['Detailed Statement','statement']]){await page.getByRole('button',{name:new RegExp(name)}).click();await page.emulateMedia({media:'print'});await page.pdf({path:`${artifacts}/${file}.pdf`,format:'A4'});await page.emulateMedia({media:'screen'});}assert((await page.getByRole('link',{name:'Send to Parent WhatsApp'}).getAttribute('href')).startsWith('https://wa.me/'));await page.getByRole('button',{name:'Copy Link',exact:true}).click();await page.getByRole('button',{name:'Link Copied!'}).waitFor();await page.emulateMedia({media:'print'});await page.pdf({path:`${artifacts}/receipt-print.pdf`,format:'A4'});await page.emulateMedia({media:'screen'});
 await visit('/receipts/fixture-voided');await page.getByText('VOIDED',{exact:true}).first().waitFor();await visit('/receipts/fixture-external');await page.locator('#printable-receipt').getByText('Bello Sani',{exact:true}).first().waitFor();
 await visit('/verify/'+encodeURIComponent(voided.receiptNumber));await page.getByText('RECEIPT REVOKED',{exact:true}).waitFor();
 await visit('/verify/'+encodeURIComponent(receipt.receiptNumber));await screenshot('verification');
 failReceipts=true;await visit('/receipts');await page.getByRole('alert').filter({hasText:'Fixture connection failure'}).waitFor();failReceipts=false;await page.getByRole('button',{name:'Try again'}).click();await page.getByText(student.fullName).first().waitFor();
 await page.setViewportSize({width:390,height:844});for(const path of ['/','/students','/receipts','/reports','/settings']){await visit(path);await noOverflow();await screenshot((path==='/'?'overview':path.slice(1))+'-mobile');}
 await page.getByRole('button',{name:'Open navigation'}).click();await page.getByRole('dialog',{name:'Navigation',exact:true}).waitFor();await page.keyboard.press('Escape');assert(await page.getByRole('button',{name:'Open navigation'}).evaluate(element=>element===document.activeElement));
 authenticated=false;await context.clearCookies();await page.evaluate(()=>localStorage.clear());await visit('/login');await screenshot('login-mobile');await page.getByRole('textbox',{name:'Email Address'}).fill(staff.email);await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Show password'}).click();assert.equal(await page.getByLabel('Password',{exact:true}).getAttribute('type'),'text');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('heading',{name:'Overview',exact:true}).waitFor();
 assert.deepEqual(unknown,[]);assert.deepEqual(errors,[]);await browser.close();console.log(JSON.stringify({result:'PASS',artifacts,writeRoutes:writes.map(({path,method})=>({path,method})),errors,unknown},null,2));
})().catch(error=>{console.error(error);process.exit(1)});
