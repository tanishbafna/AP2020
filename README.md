# E-Commerce Website (AP2020)

## Project Details

 - [Deployed Application](https://ummazone.herokuapp.com/aps) : Serverless deployment to Heroku (See Github Actions)
 - [REST API Docs](https://ummazone.herokuapp.com/docs) : Backend is set up as a REST API. (Documented by team on Swagger)

## Stack

 - Backend: [Python-Flask](https://flask.palletsprojects.com/)
 - Frontend: [React + Typescript](https://github.com/facebook/create-react-app)
 - Databse: [Firebase Realtime Database](https://firebase.google.com/docs/database)
 - Deployment: [Heroku](https://www.heroku.com/)

## Local Run
**Note: only possible for developers who have `fbAdminConfig.json` and `env.sample` (included in zip)**

 1) Make `.env.sample` a `.env` file
 2) `cd` into directory and install dependencies using `pip3 install -r requirements.txt`
 3) Run `application.py`. Confirm that it serves on `http://127.0.0.1:5000/`
 4) `cd` into `Frontend` and run `yarn`. **(yarn should be installed)**
 5) Run `yarn start`
 6) Access application at `http://127.0.0.1:3000` or at localhost with specified port

## Look out for

 - Fuzzy Search
 - Recommendation Engine
 - Bearer Token Auth
 - Cache-Control
 - Single Page Application

## Citation 

 - [Amazon Data API](https://rapidapi.com/logicbuilder/api/amazon-product-reviews-keywords) : Getting actual products.
 - [Swagger UI Editor](https://editor.swagger.io) : API documenting tool.
 - [Create React App](https://github.com/facebook/create-react-app) : Project bootstrapped with this. 
