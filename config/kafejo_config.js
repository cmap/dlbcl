var fs = require('fs');

var config = require("config");
var kafejo_config = config.util.getEnv('NODE_ENV');

process.env.NODE_ENV = kafejo_config;
var homedir = "";
try {
    var osenv = require('osenv');
    homedir = osenv.home();
}catch(ex){

}

//set the process config directory if it exist
var configDir = homedir + "/.nodeconfig/apps";

//If the NODE_CONFIG_DIR environment variable is not set
if (!process.env.NODE_CONFIG_DIR) {
    //if it exist on the file system then use it
    if (fs.existsSync(configDir)) {
        process.env.NODE_CONFIG_DIR = configDir;
    }
}
if(process.env.NODE_ENV === "development") {
    console.log("NODE ENV : " + process.env.NODE_ENV);
}

