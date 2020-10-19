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
auth1 = pb.auth()

# Admin SDK
cred = credentials.Certificate(json.load(open('backend/fbAdminConfig.json')))
default_app = firebase_admin.initialize_app(cred)

def userId_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization']
            try:
                token = token.split(' ').pop()
                decoded_token = auth.verify_id_token(token) 
            except:
                return Response(status=401)
        
        if not token:
            return Response(status=401)

        # Obtaining userID using token
        try:
            userId = decoded_token['uid']
        except:
            return Response(status=401)
        
        authDict = {'userId':userId, 'token':request.headers['Authorization']}

        return f(authDict, *args, **kwargs)

    return decorated

# Index
@app.route('/')
def index():
    return "Index"

# route to sign a new user up  
@app.route('/signup', methods=["POST"])
def signup():
    if request.method:
        email = request.form["signup_email"]
        password = request.form["signup_password"]
        try:
            user = auth1.create_user_with_email_and_password(email, password)
        except:
            return Response(status=401)
    return Response(status=200)

@app.route('/login', methods=["POST"])
def login():
    if request.method:
        email = request.form["login_email"]
        password = request.form["login_password"]
        try:
            user = auth1.sign_in_with_email_and_password(email, password)
            user = auth1.refresh(user['refreshToken'])
            user_id = user['idToken']
        except:
            return Response(status=400)
    return Response(status=200)

@app.route('/home')
@userId_required
def home():
    pass

if __name__ == "__main__":
    app.run(debug=True)