This is the NodeJs progect used to collect data from TfGM traffic counters via the Drakewell API.

* get_data.js contains the actual code for data collection. The code iteratively at regular time intervals

* get_past_data.js is used occasionaly to recover data that was not collected due to outaged of the third party data provider (Drakewell), or outages of the serviced that runs get_data.js


* package-lock.json contains the dependencies that need to be downloaded for the Node project to run

# How to run the node project

After downloading the project on your local machine cd into the project folder and run `npm install`. This will downmload and install all the dependencies as specified in package-lock.json
