from flask import Flask, request
import pyrebase
import json

app = Flask(__name__)

# Initialize connection to firebase
pb = pyrebase.initialize_app(json.load(open('backend/fbconfig.json')))
auth = pb.auth()

# Index
@app.route('/')
def index():
    pass

# route to sign a new user up 
@app.route('/signup')
def signup():
    if True:
        email = "email"
        password = "pass"
        auth.create_user_with_email_and_password(email, password)
        return "User created"
    return "ERROR"


if __name__ == "__main__":
    app.run(debug=True)

