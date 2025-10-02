@./initialize-code.spec.md
@./initialize-data.spec.md

Implement real openai calls in ai.service.ts. The api key will come from the env vars. The model used should be "gpt-5-nano".
Make the editor's API call use the response format found in @/schemas.ts
Add a schema for the response format of the reporters' api calls, similar to the daily editions schema.

@./frontend.spec.md

Add a login page with just an "admin password" field, which hits a new login endpoint that compares the field value to the environment variable "NEWSROOM_ADMIN_PASS".

On successful login, set a localstorage entry indicating that the user is admin. If the user is not admin, make the text fields on the editor page readonly, and disable the buttons, including on the backend.

Add a logout button if the user is logged in.

Create a page at /ads that displays a placeholder list of "ad entries" which each have an editable name, editable bid price, and "prompt content" textarea. Add it to the nav bar.

Hook up the /ads page to working backend routes to CRUD the ads. The ads entries in the data storage should contain a field "userId" which will contain a placeholder value of 1 for now.

When creating the structured article API call prompt, get the most recently created Ad from data storage. After every 20 message entries, insert the prompt text of the ad surrounded by two newlines on each side.

Add a JWT login mechanism on the backend. The password should be compared, salted and hashed, against the user's stored password in the database.

Replace the single field on the admin login page with a username and password page with a login button. The jwt should be stored in localstorage and sent with each api request to the backend.

Add a /users page that displays all users. The link and page should only be visible to users if their user.isAdmin value is true. Same with the backend endpoint, admin only.

Add a "Register" button on the login page that, instead of logging in with the provided credentials, registers an account with that username and password.

@./pricing.md