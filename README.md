# Cloud security

## 1. Limit concurrent requests using a middleware

DOS attacks are very popular and relatively easy to conduct. Implement rate limiting using a rate limiting middleware (express-rate-limit package).  
Rate limiting should be implemented in your application to protect a Node.js application from being overwhelmed by too many requests at the same time.

-- In this project, we have Limited each IP to 10 requests per `window` (here, per 1 minutes). After 10 requests/minute, all incoming requests will be blocked by server.  
-- It will Return rate limit info in the `RateLimit-*` headers  
-- Disable the `X-RateLimit-*` headers  
-- It will show `Too many requests` if request limit exceeds

```javascript
rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minutes
	max: 10, // Limit each IP to 10 requests per `window` (here, per 1 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	message: "Too many requests", // message to send
});
```  
![dDos](https://raw.githubusercontent.com/ashisdeveloper/cloud-security/main/files/ddos.jpg)  


## 2. Disable X-Powered-By header and etag

X-Powered-By header is a common non-standard HTTP response header used by many scripting languages as a default option. This header reveals the technology used in app development and permits attackers to exploit various security vulnerabilities associated with that particular technology.  
-- So disable the technology information by adding the following code in express server  

```javascript
app.disable("x-powered-by");
app.disable("etag");
```  
![dDos](https://raw.githubusercontent.com/ashisdeveloper/cloud-security/main/files/header.jpg)  

## 3. Brute Forcing one specific user from different IPs

In this scenario, the attacker is trying to brute force the user’s password by sending requests from different proxies, so we cannot recognize this brute force by just focusing on IP.  

The solution is having a limited number of login attempts.  

-- We have used redis cache management system to store user login attempt.  
-- Here we have set the maximum login attempt `maxNumberOfFailedLogins` is 3 and expiration time `timeWindowForFailedLogins` is 1 hour.  
-- At first, it will check user is not attempted too many login requests. If this number is bigger than `maxNumberOfFailedLogins` do not let users try to login. 	
-- Then check user's login credentials are correct or not.  
-- If failed login, increment the `maxNumberOfFailedLogins` and store the new invalid login attempt in Redis cache.  
-- On successful attempt delete the user attempt from Redis cache and send the successful response.  

![dDos](https://raw.githubusercontent.com/ashisdeveloper/cloud-security/main/files/brute-force.jpg)  


## 4. Implementation of Cross-origin resource sharing (CORS) mechanism 

Cross-origin resource sharing (CORS) is a mechanism that allows a client application to request restricted resources hosted on server from a different origin. CORS defines a way in which a browser and server can interact to determine whether it is safe to allow the cross-origin request. If an application running on different domain tries to make a XMLHttpRequest to a different domain, it will be blocked by same-origin policy.  

![same-origin](https://raw.githubusercontent.com/ashisdeveloper/cloud-security/main/files/same-origin.jpg)  
The client and the server have the same origin. In this example, accessing resources will be successful. You’re trying to access resources on your server, and the same server handles the request.  

![diffrent-origin](https://raw.githubusercontent.com/ashisdeveloper/cloud-security/main/files/diffrent-origin.jpg)  
The client and server have a different origin from each other, i.e., accessing resources from a different server. In this case, trying to make a request to a resource on the other server will fail.

This is a security concern for the browser. CORS comes into play to disable this mechanism and allow access to these resources. CORS will add a response header access-control-allow-origins and specify which origins are permitted. CORS ensures that we are sending the right headers.  

-- First of all, install calls on your server-side app by running the command  
-- Then you can add it as a middleware like this and add your allowed origins in the array.  
```javascript
const app = express();
app.use(
	cors({
		origin: ["http://localhost:3000"],
	})
);
```
-- Allow requests from all domains by adding `origin: "*"`  


## 5. Adjust the HTTP response headers for enhanced security

Your application should be using secure headers to prevent attackers from using common attacks like cross-site scripting (XSS), clickjacking and other malicious attacks. These can be configured easily using modules like helmet, xss-clean.  

```javascript
const app = express();
app.use(xss());
app.use(helmet());
```
