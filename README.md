# OinkBrew

## Setup for development

1. Setup docker

   For the backend we need the PostgreSQL database. The project root folder contains a docker compose file that helps with setup the environemnt.

   If you have docker desktop already installed you can do the following steps:

   - VSCode Docker Extensions

     Right mouse click on the docker-compose.yml file and select `Compose Up - Selected Services`.
     VSCode provides you with a selecion, select `postgresql`

   - Command line

     Open a terminal and make sure you are in the root of the repo.
     Run the following command:

     `docker-compose -f docker-compose.yml up -d postgresql`

2. Initialise Database

   The project uses Prisma for initialising and keeping the database schema up to date.

   - Create a .env file

     Use the environment variables from the `docker-compose.yml` file to create your `.env` file in the **backend** folder of the repo.

- Initialise Db

  Open a terminal and set working dorectory to `./backend` and run the following commands

  ```
  npm install

  npx prisma db push
  ```

3. Start the api server

   Open a terminal and set working dorectory to `./backend` and run the following commands

   ```
   npm run start-dev
   ```

4. Run sample http request to demonstrate the api server

   Open the postman file and run the following commands

   - SignUp

   - SignIn

   - Logout

   - Refresh
