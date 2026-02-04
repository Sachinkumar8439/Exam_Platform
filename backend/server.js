const server = require("./src/index");

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Backend running on network");
});