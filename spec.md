@./initialize-code.spec.md
@./initialize-data.spec.md
@./additional-prompts.spec.md
@./frontend.spec.md

Add a login page with just an "admin password" field, which hits a new login endpoint that compares the field value to the environment variable "NEWSROOM_ADMIN_PASS".

On successful login, set a localstorage entry indicating that the user is admin. If the user is not admin, make the text fields on the editor page readonly, and disable the buttons, including on the backend.

Add a logout button if the user is logged in.