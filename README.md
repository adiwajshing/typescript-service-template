# Typescript Service Template

## Prerequisites

1. Familiarity with NodeJS & Typescript
2. Basic familiarity with Mongo
3. Familiarity with writing basic backend code (express perhaps?)
4. Docker on your system (if you want to run mongo easily)

## General Tools being used in the template

1. [Typescript](https://www.typescriptlang.org) -- Javascript with type safety -- type safety prevents bugs that could've easily been avoided & makes for more easily understandable code
2. [Serverless](https://www.serverless.com) -- framework to run auto-scaling code in the cloud without a running server
	- Deploys to API Gateway + Lambda on AWS
	- Azura functions
3. [OpenAPI Backend](https://www.npmjs.com/package/openapi-backend) -- framework that generates route listeners, and request (and optionally response) validation from an OpenAPI file
4. [OpenAPI Typescript](https://www.npmjs.com/package/openapi-typescript) -- Framework that generates types for all schemas and routes from an OpenAPI spec
5. [Pino](https://www.npmjs.com/package/pino) -- A really great JSON logger, capable of generating child loggers for specific contexts
6. [ESLint](https://eslint.org) -- Linting tool for javascript/typescript, helps keep our code clean and prevents dumb mistakes on the part of individual programmers
7. [Open Telemetry](https://opentelemetry.io) -- Open source protocol/framework to add visibility & insights to the inner workings of our services
8. [Boom](https://www.npmjs.com/package/@hapi/boom) -- A great tiny library that enable us to throw Errors with enough information to transform them to valid HTTP responses. Helps us write nice functional code where we don't worry about returning an express response or such
9. [GitHub Actions](https://github.com/features/actions) -- Great, simple tool to write automated workflows
10. [Docker](https://www.docker.com) -- Optional, but great way to run containerized applications. Containerized apps help your code run the same way across different deployments on various platforms, reducing the probability of unexpected bugs, makes pipelines more efficent & some other great advantages
11. [Chance](https://chancejs.com) -- A great tool to generate different sorts of random data (names, phone numbers, urls etc), very useful when creating tests

## Setup

1. Clone the repository
2. Run `npm i`
	- you could use `yarn` instead, but v1 is considered legacy & v3 has a bunch of issues
	- hence, sticking with `npm` here
3. Run mongo via Docker (you could give yourself pain by installing it directly on your system too, up to you)
	- Command I use to run locally:
	```
	docker run --name some-mongo -d mongo:latest
	```
	- Alse see their [official docker page](https://hub.docker.com/_/mongo)
4. Run tests to verify everything is working correctly via `yarn test`

## Type safety & TS Config

1. Having type safety in your code base reduces the probability of bugs tremendously because you can find issues before your app even hits testing
2. Knowing the types each function expects and outputs makes for more collaborative development, since others know exactly how to use your function and what they can expect it to output
3. [Good read](https://softwareengineering.stackexchange.com/questions/215482/what-are-the-safety-benefits-of-a-type-system)
4. Given the above, the ts config for this project is configured to be quite strict -- to catch as many bugs at compile time as possible.

## Linting

1. Linting is critical for teams to work productively & to reduce the number of lines of code changed in a patch

[Very good read](https://sourcelevel.io/blog/what-is-a-linter-and-why-your-team-should-use-it)

## Code Generation & Design Driven Development

1. We auto generate the typescript client from the OpenAPI spec
2. The auto generated client can be used to communicate with the server
3. It also provides a simple way to provide type safety to our server side code as well

## Authentication

1. We're not using an auth system in this example, though any token based authentication should be easy to implement. All you'd have to do is implement the `authenticate` function in `src/utils/auth-controller`

1. In this example, we use short lived (a few minutes to an hour) JWT tokens whose security relies upon public key encryption
2. JWT tokens are a great way to implement stateless authentication
3. This means, any server can verify that the token sent is genuine and extract any information it needs without needing to query a centralised database
4. Typically, such tokens are exchanged for opaque (like random bytes, or UUIDs) long lived refresh tokens

## Logging

1. In a production environment, it's critical to be able to trace the logs for a single event or request. Also, there will often be times where you need to find logs for a particiular user or object -- having logs mention these IDs can make your life far easier.
2. It's also equally important to log just the right information at the right times, but also be able to query the information quickly
3. We use `pino` in this template to solve for the above mentioned issues
	- We create a child logger with a unique request ID for every request
	- The child logger also contains the ID of the user
	- Every line that is logged with this logger -- will contain the user ID & reuqest ID
	- This child logger is passed to the request handler, and passed to every utility henceforth
	- Now, when we search for a user ID or a request that occurred -- we can immediately trace everything that happened during its execution

## Traceability

1. Sometimes, logs aren't enough to find out critical pieces of information about your app. They're great for finding issues if you know they exist -- but to find out issues occurring in real time & even potential issues -- we need tracing
2. What tracing can tell you:
	- Which requests are taking the longest on average?
	- Is my server suddenly sending a lot of 500 status codes? (internal server errors)
	- Which part of a certain type of request takes the longest? JSON serialization, DB querying, post processing?
3. A popular framework for traceability is called [Open Telemetry]()
4. It provides an open-source way for you to trace exactly what's happening in your application
5. We use [SigNoz](https://signoz.io/docs/instrumentation/nodejs/) with open-telemetry in our app to observe what's going on in our app
	- Setup [SigNoz](https://signoz.io/docs/install/docker/) here

## Being Framework Agnostic

1. [OpenAPI Backend](https://www.npmjs.com/package/openapi-backend) is framework agnostic tool -- you could run it with Serverless, Express, Hapi or any other framework of your choice & retain all the good features it provides
2. If tomorrow serverless doesn't suit your needs and you need a constantly running server -- you could simply inject the OpenAPI backend into express or hapi (see the tests for example).
3. This of course, significantly reduces turnaround time whenever you choose to make architectural shifts

## Environment Config

1. Environment files let us configure specific parameters for our service to run with
2. In this template, we create separate files for each environment (`test`, `development` & `production`)
3. This helps us quickly switch out our config and run the service as it would in a specific environment
4. Eg. `NODE_ENV=production npm run start` -- will start your server using your production config (including DB credentials) 

Note: ensure your `.env.production` is git ignored -- it's best to not push credentials to git!

## Deployment

1. Configure AWS credentials on your local machine
	- Basically store th
2. Run `NODE_ENV=production npm run deploy` 
	- specify `production` envrionment as we don't want to deploy our development config to our servers!

## CI/CD

1. SSHing into your instance and copying/pasting code is probably not a great idea. It's not scalable with team size, neither does it offer any checks and balances you need in a production environment
2. Having a simple CI/CD pipeline to build, test & deploy your code upon pushes to a branch or any other event solves the above problem
3. You can reliably deploy your code and sleep a little easier knowing that your code was tested well before being deployed
	- Of course, the caveat is that your tests must also cover all bases!
4. A simple CI pipeline has been added to this template that runs for free via [GitHub Actions](https://github.com/features/actions)

## Microservices

This template could be used to write a monolith backend or build multiple microservices out of as well that speak to each other via HTTP. Some good videos on microservices:

1. https://www.youtube.com/watch?v=j6ow-UemzBc
2. https://www.youtube.com/watch?v=zzMLg3Ys5vI

## General

1. the "get users" route in this sample uses cursor based pagination over general offset based pagination, this choise is made primarily for efficiency -- though there are other advantages too. Cursor based pagination offers practically constant time fetch for all pages (provided your cursor and corresponding indexes are setup correctly)
	- [Good read](https://betterprogramming.pub/building-apis-a-comparison-between-cursor-and-offset-pagination-88261e3885f8)
	- Read on the caveats when implementing [this](https://medium.com/swlh/how-to-implement-cursor-pagination-like-a-pro-513140b65f32)