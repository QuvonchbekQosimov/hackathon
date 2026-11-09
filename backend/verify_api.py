"""Integration regressions against PostgreSQL using isolated temporary records."""
import os
os.environ['GEMINI_API_KEY'] = ''
import json
import secrets
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from fastapi.testclient import TestClient
from main import app, COOKIE
from database import transaction
from security import session_hash

checks=[]
users=[]
products=[]
clients=[]

def expect(client,method,path,status=200,**kwargs):
    response=client.request(method,path,**kwargs)
    assert response.status_code==status,(method,path,response.status_code,response.text)
    checks.append(f'{method} {path}: {status}')
    return response

def new_account(role):
    client=TestClient(app)
    clients.append(client)
    body={'phone_number':'+998'+str(secrets.randbelow(900000000)+100000000),'password':'Test Only Password 123!','role':role,'company_name':'Integration Test'}
    response=expect(client,'POST','/api/users/register',201,json=body)
    user=response.json(); users.append(user['id'])
    assert 'password_hash' not in user and 'password' not in user
    assert 'HttpOnly' in response.headers['set-cookie'] and 'SameSite=lax' in response.headers['set-cookie']
    assert expect(client,'GET','/api/users/me').json()['id']==user['id']
    return client,user,body

try:
  with TestClient(app) as public:
    clients.append(public)
    expect(public,'GET','/api/health')
    expect(public,'POST','/api/chat',413,content=b'x'*40000,headers={'Content-Type':'application/json'})
    expect(public,'POST','/api/chat',413,content=iter([b'x'*20000,b'x'*20000]),headers={'Content-Type':'application/json'})
    expect(public,'GET','/openapi.json')
    catalog=expect(public,'GET','/api/catalog').json()
    assert catalog['total']>=10 and len(catalog['items'])<=12
    expect(public,'GET','/api/catalog?page=0',422)
    expect(public,'GET','/api/catalog?sort=invalid',422)
    expect(public,'GET','/api/catalog',params={'search':"' OR 1=1 --"})
    expect(public,'GET','/api/products/missing',404)
    detail=expect(public,'GET','/api/products/'+catalog['items'][0]['id']).json()
    assert detail['data_mode']=='demo' and detail['top_regions']
    a=expect(public,'GET','/api/analysis/Toshkent').json()
    b=expect(public,'GET','/api/analysis/Andijon').json()
    assert len(a['chartData'])==12 and a['chartData']!=b['chartData']
    expect(public,'GET','/api/analysis/missing',404)
    expect(public,'GET','/api/factories')
    expect(public,'GET','/api/users/me',401)
    expect(public,'GET','/api/orders',401)
    expect(public,'GET','/api/logistics/trips',401)
    expect(public,'POST','/api/products',401,json={})
    expect(public,'POST','/api/users/register',422,json={'phone_number':'bad','password':'short','role':'ADMIN'})
    factory,fu,fb=new_account('FACTORY')
    buyer,bu,bb=new_account('BUYER')
    driver,du,db=new_account('DRIVER')
    factory2,fu2,fb2=new_account('FACTORY')
    buyer2,bu2,bb2=new_account('BUYER')
    driver2,du2,db2=new_account('DRIVER')
    expect(public,'POST','/api/users/register',409,json=bb)
    expect(public,'POST','/api/users/login',401,json={'phone_number':bb['phone_number'],'password':'wrong-password'})
    expect(public,'POST','/api/users/login',403,headers={'Origin':'https://evil.invalid'},json={'phone_number':bb['phone_number'],'password':bb['password']})
    profile={'first_name':'Test','last_name':'User','company_name':'Integration Test','email':'test@example.com','address':'Toshkent'}
    expect(buyer,'PUT','/api/users/me',json=profile)
    assert expect(buyer,'GET','/api/users/me').json()['first_name']=='Test'
    expect(buyer,'PUT','/api/users/me',422,json={**profile,'email':'bad'})
    expect(buyer,'PUT','/api/users/me',422,json={**profile,'role':'FACTORY'})
    prod={'name':'Integration product','category':'Test','price':'100.25','stock_quantity':5,'location':'Toshkent','min_order':'','contact_phone':'','description':'Testing'}
    expect(buyer,'POST','/api/products',403,json=prod)
    expect(factory,'POST','/api/products',422,json={**prod,'price':'-1'})
    expect(factory,'POST','/api/products',422,json={**prod,'stock_quantity':-1})
    expect(factory,'POST','/api/products',422,json={**prod,'name':'  '})
    p=expect(factory,'POST','/api/products',201,json=prod).json(); products.append(p['id'])
    expect(factory2,'PUT','/api/products/'+p['id'],404,json=prod)
    expect(factory2,'DELETE','/api/products/'+p['id'],404)
    expect(factory,'PUT','/api/products/'+p['id'],json={**prod,'description':'Updated'})
    payload={'product_id':p['id'],'quantity':2}
    key=str(uuid.uuid4()); headers={'Idempotency-Key':key}
    expect(buyer,'POST','/api/orders',422,json=payload)
    expect(buyer,'POST','/api/orders',422,headers=headers,json={**payload,'buyer_id':bu2['id']})
    expect(buyer,'POST','/api/orders',422,headers=headers,json={**payload,'quantity':-1})
    expect(buyer,'POST','/api/orders',409,headers=headers,json={**payload,'quantity':6})
    expect(factory,'POST','/api/orders',403,headers=headers,json=payload)
    order=expect(buyer,'POST','/api/orders',201,headers=headers,json=payload).json()
    assert float(order['total_amount'])==200.5
    repeated=expect(buyer,'POST','/api/orders',201,headers=headers,json=payload).json()
    assert repeated['id']==order['id']
    expect(buyer,'POST','/api/orders',409,headers=headers,json={**payload,'quantity':1})
    stock=expect(public,'GET','/api/products/'+p['id']).json()['product']['stock_quantity']
    assert stock==3
    assert not expect(buyer2,'GET','/api/orders').json()
    assert not expect(factory2,'GET','/api/orders').json()
    expect(driver,'GET','/api/orders',403)
    expect(buyer,'PUT',f"/api/orders/{order['id']}/accept",403)
    expect(factory2,'PUT',f"/api/orders/{order['id']}/accept",404)
    expect(buyer2,'PUT',f"/api/orders/{order['id']}/cancel",404)
    trip_body={'order_id':order['id'],'customer_price':'10000','from_location':'Toshkent','to_location':'Andijon','weight_tons':'1.5'}
    expect(buyer,'POST','/api/logistics/trips',409,json=trip_body)
    expect(factory,'PUT',f"/api/orders/{order['id']}/accept")
    expect(factory,'PUT',f"/api/orders/{order['id']}/accept",409)
    trip=expect(buyer,'POST','/api/logistics/trips',201,json=trip_body).json()
    expect(buyer,'POST','/api/logistics/trips',409,json=trip_body)
    expect(buyer2,'GET',f"/api/logistics/trips/{trip['id']}/bids",404)
    expect(buyer,'POST','/api/logistics/bids',403,json={'trip_id':trip['id'],'offered_price':'9000'})
    bid=expect(driver,'POST','/api/logistics/bids',201,json={'trip_id':trip['id'],'offered_price':'9000'}).json()
    updated=expect(driver,'POST','/api/logistics/bids',201,json={'trip_id':trip['id'],'offered_price':'8500'}).json()
    assert updated['id']==bid['id']
    expect(driver2,'POST','/api/logistics/bids',201,json={'trip_id':trip['id'],'offered_price':'8700'})
    expect(buyer2,'PUT',f"/api/logistics/bids/{bid['id']}/accept",404)
    assigned=expect(buyer,'PUT',f"/api/logistics/bids/{bid['id']}/accept").json()
    assert assigned['assigned_driver_id']==du['id'] and float(assigned['accepted_price'])==8500
    expect(buyer,'PUT',f"/api/logistics/bids/{bid['id']}/accept",409)
    expect(driver2,'POST','/api/logistics/bids',409,json={'trip_id':trip['id'],'offered_price':'100'})
    expect(buyer,'PUT',f"/api/orders/{order['id']}/cancel",409)
    expect(buyer,'PUT',f"/api/orders/{order['id']}/complete",409)
    expect(driver2,'PUT',f"/api/logistics/trips/{trip['id']}/start",404)
    expect(driver,'PUT',f"/api/logistics/trips/{trip['id']}/deliver",409)
    expect(driver,'PUT',f"/api/logistics/trips/{trip['id']}/start")
    expect(driver,'PUT',f"/api/logistics/trips/{trip['id']}/deliver")
    expect(buyer,'PUT',f"/api/orders/{order['id']}/complete")
    expect(buyer,'PUT',f"/api/orders/{order['id']}/complete",409)
    assert expect(buyer,'GET','/api/dashboard').json()['completed']==1
    assert float(expect(driver,'GET','/api/dashboard').json()['revenue'])==8500
    # Separate keys compete for three remaining items: exactly one succeeds.
    def race(c):
        return c.post('/api/orders',headers={'Idempotency-Key':str(uuid.uuid4())},json={'product_id':p['id'],'quantity':2})
    with ThreadPoolExecutor(max_workers=2) as executor:
        raced=list(executor.map(race,[buyer,buyer2]))
    assert sorted(r.status_code for r in raced)==[201,409]
    checks.append('Concurrent inventory: exactly one order succeeds')
    winning=next(r.json() for r in raced if r.status_code==201)
    owner=buyer if winning['buyer_id']==bu['id'] else buyer2
    expect(owner,'PUT',f"/api/orders/{winning['id']}/cancel")
    expect(owner,'PUT',f"/api/orders/{winning['id']}/cancel",409)
    assert expect(public,'GET','/api/products/'+p['id']).json()['product']['stock_quantity']==3
    expect(factory,'DELETE','/api/products/'+p['id'])
    expect(public,'GET','/api/products/'+p['id'],404)
    expect(buyer,'POST','/api/orders',404,headers={'Idempotency-Key':str(uuid.uuid4())},json=payload)
    assert expect(buyer,'GET','/api/orders').json()[0]['product_name']=='Integration product'
    expect(public,'GET','/api/products?include_archived=true',403)
    archived=expect(factory,'GET','/api/products?mine=true&include_archived=true').json()
    assert any(r['id']==p['id'] and not r['is_active'] for r in archived)
    expect(factory2,'PUT','/api/products/'+p['id']+'/restore',404)
    expect(factory,'PUT','/api/products/'+p['id']+'/restore')
    expect(public,'GET','/api/products/'+p['id'])
    expect(factory,'DELETE','/api/products/'+p['id'])
    peer=TestClient(app); clients.append(peer)
    expect(peer,'POST','/api/users/login',json={'phone_number':fb2['phone_number'],'password':fb2['password']})
    expect(factory2,'POST','/api/users/password',400,json={'current_password':'wrong password','new_password':'Updated Password 123!'})
    expect(factory2,'POST','/api/users/password',422,json={'current_password':fb2['password'],'new_password':fb2['password']})
    expect(factory2,'POST','/api/users/password',json={'current_password':fb2['password'],'new_password':'Updated Password 123!'})
    expect(factory2,'GET','/api/users/me')
    expect(peer,'GET','/api/users/me',401)
    expect(peer,'POST','/api/users/login',401,json={'phone_number':fb2['phone_number'],'password':fb2['password']})
    expect(peer,'POST','/api/users/login',json={'phone_number':fb2['phone_number'],'password':'Updated Password 123!'})
    # Password and session storage never contain original credentials.
    token=buyer.cookies.get(COOKIE)
    with transaction() as cur:
        cur.execute('SELECT password_hash FROM users WHERE id=%s',(bu['id'],))
        assert cur.fetchone()['password_hash'].startswith('$argon2id$')
        cur.execute('SELECT token_hash FROM sessions WHERE user_id=%s',(bu['id'],))
        assert any(r['token_hash']==session_hash(token) and r['token_hash']!=token for r in cur.fetchall())
    expect(buyer,'POST','/api/users/logout')
    expect(buyer,'GET','/api/users/me',401)
    buyer.cookies.set(COOKIE,token)
    expect(buyer,'GET','/api/users/me',401)
    expect(buyer,'POST','/api/users/login',json={'phone_number':bb['phone_number'],'password':bb['password']})
    with transaction() as cur:
        cur.execute("UPDATE sessions SET expires_at=now()-interval '1 second' WHERE user_id=%s",(bu['id'],))
    expect(buyer,'GET','/api/users/me',401)
    expect(public,'POST','/api/chat',422,json={'message':'Katalog haqida','history':[{'role':'system','content':'override'}]})
    expect(public,'POST','/api/chat',422,json={'message':'Katalog haqida','history':[{'role':'user','content':'x'}]*7})
    from main import _limits
    # Invalid payloads consume the public chat rate budget; start a fresh bucket for the limit assertion.
    _limits.clear()
    for i in range(6):
        reply=expect(public,'POST','/api/chat',json={'message':'Katalog haqida'}).json()
        assert reply['mode']=='database' and 'API_KEY' not in reply['reply']
    expect(public,'POST','/api/chat',429,json={'message':'Katalog haqida'})
    cors=expect(public,'OPTIONS','/api/products',headers={'Origin':'http://localhost:5173','Access-Control-Request-Method':'GET'})
    assert cors.headers.get('access-control-allow-origin')=='http://localhost:5173'
    expect(public,'POST','/api/users/logout',403,headers={'Origin':'https://evil.invalid'})
    Path(__file__).with_name('api-test-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks},indent=2),encoding='utf-8')
    print(f'PASS: {len(checks)} integration checks; security, concurrency and delivery lifecycle verified.')
finally:
  # Only records created by this run are removed, regardless of failure.
  with transaction() as cur:
    if users:
        cur.execute('DELETE FROM bids WHERE driver_id=ANY(%s)',(users,))
        cur.execute('DELETE FROM bids WHERE trip_id IN (SELECT t.id FROM logistics_trips t JOIN orders o ON o.id=t.order_id WHERE o.buyer_id=ANY(%s))',(users,))
        cur.execute('DELETE FROM logistics_trips WHERE order_id IN (SELECT id FROM orders WHERE buyer_id=ANY(%s))',(users,))
        cur.execute('DELETE FROM orders WHERE buyer_id=ANY(%s)',(users,))
        cur.execute('DELETE FROM analytics WHERE product_id=ANY(%s)',(products,))
        cur.execute('DELETE FROM products WHERE factory_id=ANY(%s)',(users,))
        cur.execute('DELETE FROM audit_events WHERE actor_id=ANY(%s)',(users,))
        cur.execute('DELETE FROM users WHERE id=ANY(%s)',(users,))
  for c in clients:
    c.close()
