# Serverless auction

A small project built using Serverless Framework.
An auction Platform built using AWS services, namely, API Gateway, Lambda, SQS, DynamoDB.
User can create new Auctions. Other users can bid on that Item. The Auction is sold to the highest Bidder.

## Getting started

As per the Architecture the Backend Services are hosted on AWS and Web App is built on NodeJS.

Below are the Steps for Deploying Backend Service:

1. [Deploy Auth Service] (https://github.com/3l-d1abl0/Serverless-auction/tree/main/auth-service)
2. [Deploy Notification Service] (https://github.com/3l-d1abl0/Serverless-auction/tree/main/notification-service)
3. [Deploy Auction Service] (https://github.com/3l-d1abl0/Serverless-auction/tree/main/service-en-auction)
4. [Deploy Frontend Service] (https://github.com/3l-d1abl0/Serverless-Auction-Frontend)
5. Access web app at port 3000

*Notification Sevice must be deployed before Auction Service as it references Notification Service when deploying.

