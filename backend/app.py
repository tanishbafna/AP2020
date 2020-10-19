from flask import Flask, request, Response
import firebase_admin
from firebase_admin import credentials, auth
from functools import wraps
from flask_cors import CORS
import requests
import pyrebase
import json

app = Flask(__name__)
CORS(app)

# Initialize connection to firebase
pb = pyrebase.initialize_app(json.load(open('backend/fbconfig.json')))
authCnx = pb.auth()

# Admin SDK
cred = credentials.Certificate(json.load(open('backend/fbAdminConfig.json')))
default_app = firebase_admin.initialize_app(cred)

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
            decoded_token = auth.verify_id_token(token) 
            userId = decoded_token['uid']
        except:
            return Response(status=401)
        
        authDict = {'userId':userId, 'token':request.headers['Authorization']}

        return f(authDict, *args, **kwargs)

    return decorated

# Index
@app.route('/')
@userId_required
def index():
    return "Works"

# NEW USER GIVEN USERID
@app.route('/signup', methods=["POST"])
def addUser():

    try:
        email = request.form["email"]
        password = request.form["password"]
    except:
        return Response(status=400)

    try:
        user = authCnx.create_user_with_email_and_password(email, password)
    except:
        return Response(status=401)

    return json.dumps({'idToken':user['idToken']})

# LOGIN ROUTE
@app.route('/login', methods=["POST"])
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

# LOGOUT ROUTE
@app.route('/logout', methods=["GET"])
@userId_required
def logout(authDict):

    userId = authDict.get('userId')
    auth.revoke_refresh_tokens(userId)
    return Response(status=200)

if __name__ == "__main__":
    app.run(debug=True)