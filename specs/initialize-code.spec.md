Let's write a node.js typescript application. The application will manage an AI newsroom, where AI agents are the reporters and the editor.

# Data storage
The primary data storage strategy will be Redis, running on the standard port with the standard username and password.
We need the following pieces of data:
* There's one editor, who has a bio and a prompt (both text)
* There are many reporters, who each have several beats (string) and one prompt (string)
* Each reporter periodically writes articles, each of which has a headline and a body (each string) and a generation time (in milliseconds since epoch)

Determine a data storage strategy (types, keys, etc) and write it to "./data.spec.md".

# Scheduling
Use the 'cron' package to register time-based cron jobs:
* Every 15 minutes, each reporter should write a new set of articles based on their beats and their data sources, and save them to the data storage.
* Every 3 hours, the editor should generate a newspaper edition. He does this by looking at the last 3 hours of stories from each reporter and deciding which ones are the most newsworthy to print. This should be saved to the data storage along with its generation time.
* Every 24 hours, the editor should generate a "Daily Edition" by reviewing the last 24 hours worth of editions