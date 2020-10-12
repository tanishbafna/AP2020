from flask import Flask, request, jsonify, Response, redirect
from flask_cors import CORS
import requests
import pyrebase
from dotenv import load_dotenv; load_dotenv()
from cerberus import Validator
from functools import wraps
import json
import os

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

# Decorator function for userId goes here
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

# SEARCH PROXY
@app.route('/search', methods=["GET"])
def search():

    q = request.args.get('q', type=str, default=None)
    if q.isspace():
        return Response(status=400)
    else:
        q = q.strip()

    category = request.args.get('category', type=str, default=None)
    
    url = "https://rapidapi.p.rapidapi.com/product/search"
    querystring = {"keyword":q,"country":country}

    if category is not None:
        category = category.strip()
        querystring['category'] = category

    headers = {'x-rapidapi-host': 'amazon-product-reviews-keywords.p.rapidapi.com', 'x-rapidapi-key':APIKey}
    response = requests.request("GET", url, headers=headers, params=querystring)

    dataResponse = response.json()
    if dataResponse is None or dataResponse == {}:
        return Response(status=204)

    return response.json()

# DETAILS PROXY
@app.route('/product/<string:idStr>', methods=["GET"])
def details(idStr):

    url = "https://rapidapi.p.rapidapi.com/product/details"
    querystring = {"asin":idStr,"country":country}

    headers = {'x-rapidapi-host': 'amazon-product-reviews-keywords.p.rapidapi.com', 'x-rapidapi-key':APIKey}
    response = requests.request("GET", url, headers=headers, params=querystring)

    dataResponse = response.json()
    if dataResponse is None or dataResponse == {}:
        return Response(status=204)

    return response.json()


# CART = WISHLIST, ORDERS, INCART

# ADDING TO CART
@app.route('/cart', methods=["PUT"])
@userId_required
def cartAdd(authDict):

    userId = authDict.get('userId')

    data = request.get_json()
    addSchema = {
        'asin': {'type':'string', 'required':True, 'nullable':False, 'empty':False},
        'status': {'type':'string', 'required':True, 'allowed':['orders', 'wishlist', 'outcart']}, 
        'name': {'type':'string', 'required':True, 'empty':False, 'nullable':False}, 
        'price':{'type':'number', 'nullable':False, 'required':True},
        'quantity':{'type':'number', 'nullable':False, 'required':True}
        }

    if data is None:
        return Response(status=400)
    v = Validator(addSchema)
    try:
        if not v.validate(data):
            print(v.errors)
            return Response(status=400)
    except:
        return Response(status=400)

    db.child('user_cart').child(userId).child(data.get('asin')).set(data)

    return redirect(f'/cart/{data.get("status")}', code=200)

# VIEWING AND FILTERING CART
@app.route('/cart/<string:status>', methods=["GET"])
@userId_required
def cartView(authDict, status):

    userId = authDict.get('userId')

    if status not in ['orders', 'wishlist', 'outcart']:
        return Response(status=404)

    data = db.child('user_cart').child(userId).get().val() # currently sending back all
    # data = requests.get(f'https://ap2020-1.firebaseio.com/user_cart/{userId}.json?orderBy=status').json()

    return jsonify(data)

# EDITING CART STATUS
@app.route('/cart/<string:idStr>', methods=["PATCH"])
@userId_required
def cartEdit(authDict, idStr):

    userId = authDict.get('userId')

    data = request.get_json()
    editSchema = {
        'asin': {'type':'string', 'required':True, 'nullable':False, 'empty':False},
        'status': {'type':'string', 'required':True, 'allowed':['orders', 'wishlist', 'outcart']}, 
        'name': {'type':'string', 'required':True, 'empty':False, 'nullable':False}, 
        'price':{'type':'number', 'nullable':False, 'required':True},
        'quantity':{'type':'number', 'nullable':False, 'required':True}
        }

    if data is None:
        return Response(status=400)
    v = Validator(editSchema)
    try:
        if not v.validate(data):
            print(v.errors)
            return Response(status=400)
    except:
        return Response(status=400)

    db.child("user_cart").child(userId).child(idStr).update(data)

    return Response(status=200)

# REMOVING FROM CART
@app.route('/cart/<string:idStr>', methods=["DELETE"])
@userId_required
def cartRemove(authDict, idStr):

    userId = authDict.get('userId')

    db.child("user_cart").child(userId).child(idStr).remove()

    return Response(status=200)


if __name__ == "__main__":
    app.run(debug=True)