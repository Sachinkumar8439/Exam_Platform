const app = require("./src/index");

const PORT = process.env.PORT || 5000;

app.listen(5000, "0.0.0.0", () => {
  console.log("Backend running on network");
});