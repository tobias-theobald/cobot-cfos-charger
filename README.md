# Getting Started with the Code

## Expose your local development environment

You will need a way to expose your local development environment to the internet. You can use a service like [ngrok](https://ngrok.com/) for this. Take note of the URL that service provides you, we will call it APP_BASE_URL, you'll need it in the next step. It should look like `https://whatever.ngrok.io`.

## Register an OAuth application with Cobot

Register an OAuth application under https://dev.cobot.me/oauth2_clients (You need to have a Cobot account already).

* **Name**: Anything you like such as "Electric Car Charging"
* **Name within a space**: Anything you like such as "Electric Car Charging"
* **Scopes**: As they might change, please check out `src/constants.ts`. The scopes should be space-separated.
* **Main Application URL**: `APP_BASE_URL`
* **Redirect URI**: `APP_BASE_URL/api/oauth/callback`

After registering, you will get a client ID and a client secret. Take note of these, we will need them in the next step.

## Set up your local environment variables

Create a file `.env` in the root of your project and add the following variables:

```env
# Get these values from the previous step
COBOT_CLIENT_ID=...
COBOT_CLIENT_SECRET=...

# Get these values from the wallboxes. 
# The production base URL will probably look like http://admin:password@192.168.1.42
CFOS_BASE_URL=...
# The RFID ID will be the one you use to authenticate with the wallbox, probably an 8-digit hex number IIRC.
CFOS_RFID_ID=...
# In the absence of actual wallboxes, we can use a mock endpoint to simulate the wallbox API. This is not tested very well!
# If you want to use this, set CFOS_BASE_URL=http://mockuser:mockpassword@localhost:3000/api/cfos-mock and CFOS_RFID_ID=abcdef01
ENABLE_CFOS_MOCK_ENDPOINT=false

# Generate this value randomly by running `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` in your terminal
IRON_PASSWORD=...

# DB_URI will change when we switch to a different database
DB_URI=file:./database.json
```

See also src/env.ts for the environment variables that are used in the code.

## Run the application

```shell
# Install dependencies
yarn install

# Start the application in dev mode
yarn dev
```

The app should now be running on `http://localhost:3000`, but you need to expose it to the internet using ngrok!

## Register a Cobot Space for development

Register a Cobot space under https://www.cobot.me/space_users/new_space

Give it a name, take note of the subdomain you'll choose.

## Install the app in your Cobot space

This operation has to be performed as space admin.

Go to `BASE_URL` and enter your Cobot space subdomain. This will redirect you to the Cobot OAuth page, where you can authorize the app. After authorizing, you will be redirected back to your app with a code in the URL.

This corresponds to opening `src/pages/index.tsx`, being redirected to `src/pages/api/oauth/init-install` where we encrypt the space subdomain and put it in the state so we can be sure this is secure and that we can call the API later at the correct endpoint. Then we redirect the user to the Cobot OAuth consent page for installing the app into their space. 

Afterwards, the user is returned to `src/pages/api/oauth/callback`, where we decrypt the state and get the space subdomain back. In `src/oauthHandlers/installedOauthHandler.ts` we then use the code from the URL to get an access token from Cobot, which we store in the database. We also register our entrypoints at this point. Lastly, we redirect the user to our space admin iframe.

## Visit an iframe

Since Cobot does not provide a way of authenticating our iframes to our backend and since storing data in a cookie does not work very well with third party iframes these days, when visiting an iframe, the app will initiate an OAuth consent flow inside the iframe for this user to get a user-scoped access token for the user accessing the iframe. The callback will encrypt / wrap (using iron) the access token and send it in the query sting to the browser after the OAuth flow. That way, our frontend then has a way of identifying itself to our backend and our backend has a stateless way of acquiring the access token for the user.

For communication between our backend and our frontend we use TRPC (API endpoint in `src/pages/api/[trpc]/trpc.ts` with the router located at `src/trpc-server`). TRPC provides typechecking and immediate and proper typing of the endpoints (note that we still use TRPC v10 here), as well as the capability to use chainable middlewares for authentication.

## Caveats

* When you change scopes, you'll have to reinstall the app in your Cobot space so that the app gets a new access token with the new scopes. 

# Next steps

Right now the app only consists of an admin iframe that shows pretty much the raw values we get from the wallbox and allows us to start and stop charging. The next steps are to implement the following features:

* Make a user-facing iframe that allows users to start and stop charging sessions with charges going to their Cobot account
* Make sure it is production-ready

Achieving these goals likely necessitates steps like these:

* Verify with the actual hardware:
  * if stopping the charging session works properly (as this was not tested while we had hardware access)
  * what the evseWallboxState and chargingEnabled values are and how they play together. Adjust Code in ChargerCard and chargingSessionService accordingly.
* Implement charging session history
  * Do this with the Cobot Bookings API. The idea is to add the chargers as bookable resources in Cobot and then use the Bookings API to create bookings for the charging sessions. This way, we can keep track of the charging sessions and their costs.
  * Keep track of current charging sessions
  * Consider how to know when the charging session ends when it is not stopped via our API (regular polling?)
* Implement regularly scheduled job to check if a charger is still connected
* Polish
  * Error handling
  * All the TODOs in the code

# Further reading

* [Cobot API documentation](https://dev.cobot.me/api-docs/)
* [CFOS API documentation](https://www.cfos-emobility.de/en/cfos-power-brain/http-api.htm)