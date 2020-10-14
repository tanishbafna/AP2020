from flask import Flask, request, jsonify, Response, redirect
from flask_cors import CORS
import requests
import pyrebase
from dotenv import load_dotenv; load_dotenv()
from cerberus import Validator
from functools import wraps
import json
import os
from flask_swagger_ui import get_swaggerui_blueprint

# Setting up Flask

application = app = Flask(__name__)
app.url_map.strict_slashes = False
app.config['SECRET_KEY'] = os.urandom(24)

# Adding a CORS Policy
CORS(app)

pb = pyrebase.initialize_app(json.load(open('backend/fbconfig.json')))
db = pb.database()

APIKey=os.getenv('X-RapidAPI-Key')
country = "IN"

#==============================
# Setting up Swagger UI

SWAGGER_URL = '/docs'
API_URL = '/static/openapi.yaml'

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={'app_name': "E-Commerce AP20"})

app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

#==============================

# Token Auth
def userId_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization']
            try:
                token = token.split('Bearer ')[1]
            except:
                return Response(status=401)
        
        if not token:
            return Response(status=401)

        # Obtaining userID using token
        try:
            userId = token
        except:
            return Response(status=401)
        
        authDict = {'userId':userId, 'token':request.headers['Authorization']}

        return f(authDict, *args, **kwargs)

    return decorated

#=========================
# API PROXY
#=========================

# SEARCH PROXY
@app.route('/search', methods=["GET"])
def search():

    q = request.args.get('q', type=str, default=None)
    if q.isspace():
        return Response(status=400)
    else:
        q = q.strip()

    page = request.args.get('page-number', type=int, default=1)
    if page < 1:
        page = 1

    category = request.args.get('category', type=str, default=None)
    
    url = "https://rapidapi.p.rapidapi.com/product/search"
    querystring = {"keyword":q, "country":country, "page":page}

    if category is not None:
        category = category.strip()
        querystring['category'] = category

    headers = {'x-rapidapi-host': 'amazon-product-reviews-keywords.p.rapidapi.com', 'x-rapidapi-key':APIKey}
    response = requests.request("GET", url, headers=headers, params=querystring)

    dataResponse = response.json()
    if dataResponse is None or dataResponse == {}:
        return Response(status=204)

    return dataResponse

#=========================

# DETAILS PROXY
@app.route('/product/<string:idStr>', methods=["GET"])
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
        reviewData = json.loads(reviewData)
        reviewAvailable = True
    except:
        reviewData = {'rating': None, 'total_reviews': 0, 'answered_questions': 0}
        reviewAvailable = False

    try:
        currentRating = float(dataResponse.get('reviews').get('rating'))
        currentReviews = int(dataResponse.get('reviews').get('total_reviews'))
    except:
        dataResponse['reviews'] = reviewData
        return jsonify(dataResponse)

    if reviewAvailable:
        dataResponse['reviews']['total_reviews'] = reviewData['total_reviews'] + currentReviews
        dataResponse['reviews']['rating'] = ((currentRating * currentReviews) + reviewData['rating']) / (dataResponse['reviews']['total_reviews'])

    return jsonify(dataResponse)

#=========================

# REVIEWS PROXY
@app.route('/reviews/<string:idStr>', methods=["GET"])
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
        reviewData = json.loads(reviewData)
        reviewAvailable = True
    except:
        reviewAvailable = False

    if (dataResponse is None or dataResponse == {}) and reviewAvailable is False:
        return Response(status=204)
    
    if reviewAvailable:
        dataResponse['reviews'] = reviewData['comments'] + dataResponse['reviews']

    return jsonify(dataResponse)


#=========================
# CART = WISHLIST, ORDERS, INCART
#=========================

# ADDING TO CART
@app.route('/cart', methods=["PUT"])
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

    return Response(status=200)

#=========================

# VIEWING AND FILTERING CART
@app.route('/cart/<string:status>', methods=["GET"])
@userId_required
def cartView(authDict, status):

    userId = authDict.get('userId')

    if status not in ['orders', 'wishlist', 'incart']:
        return Response(status=400)

    data = db.child('userCart').child(userId).get().val() # currently sending back all
    # data = requests.get(f'https://ap2020-1.firebaseio.com/userCart/{userId}.json?orderBy=status').json()

    return jsonify(data)

#=========================

# EDITING CART STATUS
@app.route('/cart/<string:idStr>', methods=["PATCH"])
@userId_required
def cartEdit(authDict, idStr):

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
    data = db.child('userCart').child(userId).child(idStr).get().val()

    return jsonify(data)

#=========================

# REMOVING FROM CART
@app.route('/cart/<string:idStr>', methods=["DELETE"])
@userId_required
def cartRemove(authDict, idStr):

    userId = authDict.get('userId')

    db.child("userCart").child(userId).child(idStr).remove()

    return Response(status=200)


#=========================
# REVIEWS
#=========================

@app.route('/reviews/<string:idStr>', methods=["PUT"])
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
    db.child('reviews').child(idStr).child('comments').push(data)

    # also add verified purchase

    return Response(status=200)

#=========================
if __name__ == "__main__":
    app.run(debug=True)