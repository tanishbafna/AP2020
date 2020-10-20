from flask import Flask, request, Response, redirect
from flask_cors import CORS
import requests
import pyrebase
from dotenv import load_dotenv; load_dotenv()
from cerberus import Validator
from functools import wraps
import firebase_admin
from firebase_admin import auth, credentials
import json
import os
from flask_swagger_ui import get_swaggerui_blueprint
from datetime import datetime, timedelta
import random
import gunicorn

# Setting up Flask

application = app = Flask(__name__, static_url_path='', static_folder='static')
app.url_map.strict_slashes = False
app.config['SECRET_KEY'] = os.urandom(24)

# Adding a CORS Policy
CORS(app)

pb = pyrebase.initialize_app(json.load(open('fbconfig.json')))
db = pb.database()
authCnx = pb.auth()

# Admin SDK
cred = credentials.Certificate(json.load(open('fbAdminConfig.json')))
default_app = firebase_admin.initialize_app(cred)

APIKey=os.getenv('X-RapidAPI-Key')
country = "IN"

#==============================
# Setting up Swagger UI

SWAGGER_URL = '/docs'
API_URL = '/openapi.yaml'

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={'app_name': "E-Commerce AP20"})

app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)


@app.errorhandler(404)
def page_not_found(e):
    return app.send_static_file('static/index.html'), 200

def docache(minutes=5, content_type='application/json; charset=utf-8'):
    """ Flask decorator that allow to set Expire and Cache headers. """
    def fwrap(f):
        @wraps(f)
        def wrapped_f(*args, **kwargs):
            r = f(*args, **kwargs)
            then = datetime.now() + timedelta(minutes=minutes)
            rsp = Response(r, content_type=content_type)
            rsp.headers.add('Expires', then.strftime("%a, %d %b %Y %H:%M:%S GMT"))
            rsp.headers.add('Cache-Control', 'public')
            rsp.headers.add('Cache-Control', 'max-age=%d' % int(60 * minutes))
            rsp.headers.add('Vary', '')
            return rsp
        return wrapped_f
    return fwrap
#==============================

# Token Auth
def userId_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        try:
            token = request.headers['Authorization']
            token = token.split('Bearer ')[1]
        except:
            return Response(status=401)

        # Obtaining userID using token
        try:
            decodeToken = auth.verify_id_token(token)
            userId = decodeToken['email']
            name = decodeToken.get ('name') or ''
        except:
            return Response(status=401)
        
        authDict = {'userId':userId, 'token':token, 'name': name}

        return f(authDict, *args, **kwargs)

    return decorated

#=========================
# AMAZON DATA
#=========================

# HOME
@app.route('/api', methods=["GET"])
@docache(20)
def home():

    q = request.args.get('q', type=str, default=None)

    if q is None or q.isspace() or q == '':
        q = 'e'#random.choice(['a','s','p'])

    q = q.strip()

    page = request.args.get('page-number', type=int, default=1)
    if page < 1:
        page = 1

    url = "https://rapidapi.p.rapidapi.com/product/search"
    querystring = {"keyword":q, "country":country, "page":page}

    category = request.args.get('category', type=str, default=None)
    if category is not None:
        category = category.strip()
        querystring['category'] = category

    headers = {'x-rapidapi-host': 'amazon-product-reviews-keywords.p.rapidapi.com', 'x-rapidapi-key':APIKey}
    response = requests.request("GET", url, headers=headers, params=querystring)

    dataResponse = response.json()
    if dataResponse is None or dataResponse == {}:
        return Response(status=204)

    return json.dumps(dataResponse, indent=4)

#=========================

# DETAILS
@app.route('/api/product/<string:idStr>', methods=["GET"])
@docache(60)
def details(idStr):

    url = "https://rapidapi.p.rapidapi.com/product/details"
    querystring = {"asin":idStr,"country":country}

    headers = {'x-rapidapi-host': 'amazon-product-reviews-keywords.p.rapidapi.com', 'x-rapidapi-key':APIKey}
    response = requests.request("GET", url, headers=headers, params=querystring)

    dataResponse = response.json().get('product')
    if dataResponse is None or dataResponse == {}:
        return Response(status=404)
    
    try:
        dataResponse.pop('variants')
    except:
        pass

    try:
        reviewData = db.child('reviews').child(idStr).get().val()
        try:
            reviewData = json.loads(reviewData)
        except:
            reviewData = dict(reviewData)
        reviewAvailable = True
    except:
        reviewData = {'rating': None, 'total_reviews': 0}
        reviewAvailable = False

    try:
        currentRating = float(dataResponse.get('reviews').get('rating'))
        currentReviews = int(dataResponse.get('reviews').get('total_reviews'))
    except:
        dataResponse['reviews'] = reviewData
        return json.dumps(dataResponse, indent=4)

    if reviewAvailable:
        dataResponse['reviews']['total_reviews'] = reviewData['total_reviews'] + currentReviews
        dataResponse['reviews']['rating'] = ((currentRating * currentReviews) + (reviewData['rating'] * reviewData['total_reviews'])) / (dataResponse['reviews']['total_reviews'])

    return json.dumps(dataResponse, indent=4)

#=========================

# REVIEWS
@app.route('/api/reviews/<string:idStr>', methods=["GET"])
@docache(2)
def reviews(idStr):

    page = request.args.get('page-number', type=int, default=1)
    if page < 1:
        page = 1

    filterStar = request.args.get('stars', type=int, default=None)
    filterStar = 1 if filterStar is not None and filterStar < 1 else filterStar
    filterStar = 5 if filterStar is not None and filterStar > 5 else filterStar
    
    url = "https://rapidapi.p.rapidapi.com/product/reviews"
    querystring = {"asin":idStr,"country":country, "page":page}

    if filterStar is not None:
        querystring['filter_by_star'] = filterStar

    headers = {'x-rapidapi-host': 'amazon-product-reviews-keywords.p.rapidapi.com', 'x-rapidapi-key':APIKey}
    response = requests.request("GET", url, headers=headers, params=querystring)

    dataResponse = response.json()

    try:
        reviewData = db.child('reviews').child(idStr).get().val()
        reviewData = dict(reviewData)
        reviewAvailable = True
    except:
        reviewAvailable = False

    if (dataResponse is None or dataResponse == {}) and reviewAvailable is False:
        return Response(status=204)
    
    if reviewAvailable:
        reviewList = []
        reviewData.pop('total_reviews')
        reviewData.pop('rating')

        if filterStar is None:
            for v in reviewData.values():
                reviewList.append(v)
        else:
            for v in reviewData.values():
                if v['rating'] == filterStar:
                    reviewList.append(v)
    
        dataResponse['reviews'] = reviewList + dataResponse['reviews']

    return json.dumps(dataResponse, indent=4)

#=========================

@app.route('/api/categories', methods=["GET"])
@docache(30)
def categories():

    url = "https://rapidapi.p.rapidapi.com/categories"
    querystring = {"country":country}

    headers = {'x-rapidapi-host': 'amazon-product-reviews-keywords.p.rapidapi.com', 'x-rapidapi-key':APIKey}
    response = requests.request("GET", url, headers=headers, params=querystring)

    data = []
    for v in response.json().values():
        data.append(v)
    
    return json.dumps(data, indent=4)

#=========================
# CART = WISHLIST, ORDERS, INCART
#=========================

# ADDING TO CART
@app.route('/api/cart', methods=["PUT"])
@userId_required
def cartAdd(authDict):

    userId = authDict.get('userId')

    data = request.get_json()
    addSchema = {
        'asin': {'type':'string', 'required':True, 'nullable':False, 'empty':False},
        'status': {'type':'string', 'required':True, 'allowed':['orders', 'wishlist', 'incart']}, 
        'name': {'type':'string', 'required':True, 'empty':False, 'nullable':False}, 
        'price':{'type':'number', 'nullable':False, 'required':True},
        'quantity':{'type':'number', 'nullable':False, 'required':True}
        }

    if data is None:
        return Response(response={'error': 'no data sent'}, status=400)
    v = Validator(addSchema)
    try:
        if not v.validate(data):
            print(v.errors)
            return Response(response=v.errors, status=400)
    except:
        return Response(status=400)

    db.child('userCart').child(userId).child(data.get('asin')).set(data)

    prevData = db.child('userProfile').child(userId).get().val()
    prevData[data['status']] += 1
    db.child('userProfile').child(userId).update(prevData)

    data = db.child('userCart').child(userId).child(data.get('asin')).get().val()

    return json.dumps(data, indent=4)

#=========================

# VIEWING AND FILTERING CART
@app.route('/api/cart/<string:status>', methods=["GET"])
@userId_required
def cartView(authDict, status):

    userId = authDict.get('userId')

    if status not in ['orders', 'wishlist', 'incart']:
        return Response(status=400)

    listResponse = []
    data = db.child('userCart').child(userId).get().val()

    if data is None or data == {}:
        return Response(status=204)
    
    for v in data.values():
        if v['status'] == status:
            listResponse.append(v)

    return json.dumps(listResponse, indent=4)

#=========================

# EDITING CART STATUS
@app.route('/api/cart/<string:status>/<string:idStr>', methods=["PATCH"])
@userId_required
def cartEdit(authDict, status, idStr):

    userId = authDict.get('userId')

    data = request.get_json()
    editSchema = {
        'status': {'type':'string', 'required':True, 'allowed':['orders', 'wishlist', 'incart']},
        'quantity':{'type':'number', 'nullable':False, 'required':True}
        }

    if data is None:
        return Response(response={'error': 'no data sent'}, status=400)
    v = Validator(editSchema)
    try:
        if not v.validate(data):
            print(v.errors)
            return Response(response=v.errors, status=400)
    except:
        return Response(status=400)

    db.child("userCart").child(userId).child(idStr).update(data)
    
    prevData = db.child('userProfile').child(userId).get().val()
    prevData[status] -= 1
    prevData[data['status']] += 1
    db.child('userProfile').child(userId).update(prevData)

    data = db.child('userCart').child(userId).child(idStr).get().val()

    return json.dumps(data, indent=4)

#=========================

# REMOVING FROM CART
@app.route('/api/cart/<string:status>/<string:idStr>', methods=["DELETE"])
@userId_required
def cartRemove(authDict, status, idStr):

    userId = authDict.get('userId')

    db.child("userCart").child(userId).child(idStr).remove()
    prevData = db.child('userProfile').child(userId).get().val()
    prevData[status] -= 1
    db.child('userProfile').child(userId).update(prevData)

    return Response(status=200)


#=========================
# REVIEWS
#=========================

@app.route('/api/reviews/<string:idStr>', methods=["PUT"])
@userId_required
def addReview(authDict, idStr):

    userId = authDict.get('userId')
    
    data = request.get_json()
    addSchema = {
        "name": {'type':'string', 'required':True, 'empty':False, 'nullable':False},
        "rating": {'type':'number', 'required':True, 'nullable':False, 'min': 1.0, 'max': 5.0},
        "review": {'type':'string', 'required':True, 'empty':False, 'nullable':False},
        "title": {'type':'string', 'required':True, 'empty':False, 'nullable':False, 'maxlength': 50}
        }

    if data is None:
        return Response(response={'error': 'no data sent'}, status=400)
    v = Validator(addSchema)
    try:
        if not v.validate(data):
            print(v.errors)
            return Response(status=400)
    except:
        return Response(response=v.errors, status=400)

    data['id'] = userId

    # also add verified purchase

    try:
        prevReviews = db.child('reviews').child(idStr).child('total_reviews').get().val()
        prevRating = db.child('reviews').child(idStr).child('rating').get().val()
    except:
        # creating first entry
        db.child('reviews').child(idStr).set({
            'total_reviews': 1,
            'rating': data['rating']
        })
        db.child('reviews').child(idStr).child(userId).set(data)

        return Response(status=200)
    
    if prevRating is None or prevReviews is None:
        # creating first entry
        db.child('reviews').child(idStr).set({
            'total_reviews': 1,
            'rating': data['rating']
        })
        db.child('reviews').child(idStr).child(userId).set(data)

        return Response(status=200)
    
    newRating = ((prevRating['rating'] * prevReviews['total_reviews']) + data['rating']) / (prevReviews['total_reviews'] + 1)
    db.child('reviews').child(idStr).child(userId).set(data)
    db.child('reviews').child(idStr).update({
            'total_reviews': prevReviews['total_reviews'] + 1,
            'rating': newRating
    })

    return Response(status=200)

#=========================
# PROFILE SECTION
#=========================

# NEW USER GIVEN USERID
@app.route('/api/signup', methods=["POST"])
def addUser():

    try:
        email = request.form["email"]
        password = request.form["password"]
        name = request.form["name"]
        address = request.form["address"]
    except:
        return Response(status=400)

    data = {}
    data['name'] = name
    data['address'] = address
    data['orders'] = 0
    data['wishlist'] = 0
    data['incart'] = 0

    addSchema = {
        "name": {'type':'string', 'required':True, 'empty':False, 'nullable':False},
        "address": {'type':'string', 'required':True, 'empty':False, 'nullable':False}
        }

    v = Validator(addSchema)
    v.allow_unknown = True
    try:
        if not v.validate(data):
            print(v.errors)
            return Response(status=400)
    except:
        return Response(response=v.errors, status=400)

    try:
        user = authCnx.create_user_with_email_and_password(email, password)
        userId = user['localId']
    except requests.exceptions.HTTPError as err:
        return Response(response=str(err),status=400)

    # Creating db entry for user
    db.child('userProfile').child(userId).set(data)

    return json.dumps({'idToken':user['idToken']})

# LOGIN ROUTE
@app.route('/api/login', methods=["POST"])
def login():

    try:
        email = request.form["email"]
        password = request.form["password"]
    except:
        return Response(status=400)

    try:
        user = authCnx.sign_in_with_email_and_password(email, password)
        user = authCnx.refresh(user['refreshToken'])
    except:
        return Response(status=401)

    return json.dumps({'idToken':user['idToken']})

# NEW USER GIVEN GOOGLE
@app.route('/api/google-signup', methods=["PUT"])
@userId_required
def addGUser(authDict):

    userId = authDict.get('userId')
    existing = db.child('userProfile').child(userId).get().val()

    if existing is None: # if user already exists
        return Response(status=200)

    data = {}
    data['name'] = authDict.get ('name') or '...'
    data['address'] = ' '
    data['orders'] = 0
    data['wishlist'] = 0
    data['incart'] = 0

    # Creating db entry for user
    db.child('userProfile').child(userId).set(data)

    return Response(status=200)

# LOGOUT ROUTE
@app.route('/api/logout', methods=["GET"])
@userId_required
def logout(authDict):

    userId = authDict.get('userId')
    auth.revoke_refresh_tokens(userId)
    return Response(status=200)

# VIEW PROFILE
@app.route('/api/profile', methods=["GET"])
@userId_required
def viewUser(authDict):

    userId = authDict.get('userId')
    data = db.child('userProfile').child(userId).get().val()

    if data is None or data == {}:
        return Response(status=404)

    return json.dumps(data, indent=4)

# EDIT PROFILE
@app.route('/api/profile', methods=["PATCH"])
@userId_required
def editUser(authDict):

    userId = authDict.get('userId')

    data = request.get_json()
    addSchema = {
        "name": {'type':'string', 'required':False, 'empty':False, 'nullable':False},
        "address": {'type':'string', 'required':False, 'empty':False, 'nullable':False}
    }

    if data is None:
        return Response(response={'error': 'no data sent'}, status=400)
    v = Validator(addSchema)
    try:
        if not v.validate(data):
            print(v.errors)
            return Response(status=400)
    except:
        return Response(response=v.errors, status=400)

    db.child("userProfile").child(userId).update(data)
    data = db.child('userProfile').child(userId).get().val()

    return json.dumps(data, indent=4)

#=========================
if __name__ == "__main__":
    app.run(debug=False)