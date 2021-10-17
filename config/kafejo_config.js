const config = require("config");
const kafejo_config = config.util.getEnv('NODE_ENV');
process.env.NODE_ENV = kafejo_config;



