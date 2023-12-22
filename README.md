# Lidz-Test by José Andrés Galdames
## Intro
The test was made using Node.js, Koa, postgreSQL and Prisma to manage models and migrations.

## Setup
Let's make sure we have Postgres installed before we continue:
```bash
psql --version
```
If it's not installed, please do so.
Also, create the database you want to use. For example, once inside postgres with user and password:
```bash
CREATE DATABASE lidztest
```

Now, let's continue by installing all packages:
```bash
npm install
```
## Prisma
Prisma needs a **`.env`** file in the main folder containing the database connection as follows:
```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DBNAME?schema=public"
```
Where USER is your postgresql Username and PASSWORD the corresponding password for that user.
PostgreSQL runs by default on port 5432 when running local.
DBNAME is the Database name you want to connect. **`lidztest`** in the example.

With that ready, we have to migrate our Models to our DB. We'll do that with Prisma. Each migration will need a unique name, we'll call this migration init:
```bash
npx prisma migrate dev --name init
```

## Run
Now we have our databases prepared so it's time to run our server
```bash
node index.js
```
With that, we can test our endpoints with requests to **`http://127.0.0.1:8000/`**:

Endpoints:
- POST /clients
- GET /clients
- GET /clients/:id
- GET /clients-to-do-follow-up
- GET /clients/:id/score

## Score Calculation
First of all, in the file **`params.js`** we can change the `price` of the property, the `upfront` value, `interest` rate and `ufvalue`. 
`price` and `upfront` are expected in UF; `interest` as a float (0.05 for example); `ufvalue` in CLP to convert `price` and `upfront` to CLP as client's salary and savings.

The reasoning behind calculating the score is as follows:
- We have 3 big categories to qualify the client, each with set maximum points that sum up to 100: 
    - purchasing power (60 pts)
    - interest (20 pts)
    - trustworth (20 pts)

The most important category is the first one, because the client can be interested and be trustworthy but if he hasn't got the purchasing power to acquire the property then he can't be a client.

All scores follow a lineal relationship with upper or lower limits.

Inside each category there are different scores.
### Purchasing Power (60 pts)
Mortgage credits are usually paid in 10 to 20 years, or 120 to 240 monthly fees.
Total credit calculated by `(price - upfront) * (1 + interest) * ufvalue` to get it from UF to CLP. 
We give score based on the ability of the client to pay for the upfront and if he earns enough salary to pay he's mortgages fees. I assume 30% of the salary goes to paying mortgage.

- upfrontScore (20 pts): Perfect score if client's savings are 1.2 times the upfront cost. This way we make sure he has the money to pay the upfront cost.
- salary120Score (25 pts): Perfect score if 30% of the client's salary is enough to pay for a monthly fee on a 10 year mortgage.
- salary240Score (15 pts): Perfect score if 30% of the client's salary is enough to pay for a monthly fee on a 20 year mortgage.

### Interest (20 pts)
Interest is measured with the client's messages. For simplicity we check when was the latest message and how many messages has the client sent.

- messageDayScore (10 pts): Perfect score if latest message is from today or yesterday, 0 points at 90 days or later.
- messageQScore (10 pts): Perfect score if client has sent 8 or more messages, showing interest in acquiring a property.

### Trustworth
A client that doesn't pay is a bad client so we have to check he's debts. Here we check for two things, his oldest debt and if the total debt amount is payable in the short term by him.
- debtDayScore (10 pts): Perfect score if none of the debts are more than 1 year old; 0 pts if a debt is 5 was due 5 years ago.
- debtScore (10 pts): Perfect score it the client can pay his debts with 2 or less salaries, payable in the short term; 0 pts if the debt is greater than 12 times his salary.