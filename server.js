const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
if (cluster.isMaster) {
	console.log(`Number of CPUs is ${numCPUs}`);
	console.log(`Master ${process.pid} is running`);

	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	cluster.on("exit", function (worker, code, signal) {
		console.log("worker " + worker.process.pid + " died");
		console.log("Let's fork another worker!");
		cluster.fork();
	});
} else {
	console.log(`Worker ${process.pid} started`);
	require("events").EventEmitter.defaultMaxListeners = 0;
	require("dotenv").config();

	var useragent = require("express-useragent");
	const compression = require("compression");
	const express = require("express");
	const cors = require("cors");
	const rateLimit = require("express-rate-limit");
	const path = require("path");
	const helmet = require("helmet");
	const xss = require("xss-clean");
	const Redis = require("ioredis"); //https://github.com/MicrosoftArchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.msi

	const redis = new Redis();
	const maxNumberOfFailedLogins = 3;
	const timeWindowForFailedLogins = 60 * 60 * 1;

	const app = express();
	app.disable("x-powered-by");
	app.disable("etag");
	app.use(helmet());
	app.use(xss());
	app.use(
		cors({
			origin: ["http://localhost:8050"],
		})
	);
	app.use(useragent.express());
	app.use(
		rateLimit({
			windowMs: 1 * 60 * 1000, // 1 minutes
			max: 10, // Limit each IP to 10 requests per `window` (here, per 1 minutes)
			standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
			legacyHeaders: false, // Disable the `X-RateLimit-*` headers
			message: "Too many requests", // message to send
		})
	);
	app.use(express.json({ limit: "10kb" })); // Body limit is 10
	app.use(express.urlencoded({ extended: true }));
	app.use(compression());
	app.use("/files", express.static(path.join(__dirname, "public/files")));

	let server = app.listen(process.env.PORT, () => console.log(`Server is running on http://localhost:${process.env.PORT}`));

	app.get("/api/hello", async (req, res) => {
		let result = "Hello world!";
		res.send(result);
	});

	app.get("/api/cors-test", async (req, res) => {
		let result = "everything still works";
		res.send(result);
	});

	app.get("/api/login", async (req, res) => {
		let orgUsername = 'johny';
		let orgPassword = 'hellojohny';
		// check user is not attempted too many login requests
		let userAttempts = await redis.get(req.query.username) || 0;

		if (userAttempts > maxNumberOfFailedLogins)
			return res.status(429).send("Too Many Attempts try it one hour later");

		const loginResult = false
		// Let's check user
		if (req.query.username === orgUsername && req.query.password === orgPassword)
			return true

		// user attempt failed
		if (!loginResult) {
			await redis.set(req.query.username, ++userAttempts, "ex", timeWindowForFailedLogins);
			res.send("failed");
		} else {
			// successful login
			await redis.del(req.query.username);
			res.send("success");
		}
	});
}
