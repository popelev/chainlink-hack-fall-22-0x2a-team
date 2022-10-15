// index.js -> bundle.js

//"type": "module",

const { toFile } = require("qrcode")

let myid = "0x0bdc2820d3098ec1f4ea8567dc0c9b24707b4f204552fa0858e1ffe6adf34708"

let data = { id: myid }

let stJson = JSON.stringify(data)

toFile("qr.png", stJson, { type: "terminal" }, function (err, code) {
    if (err) return console.log("error")
    console.log(code)
})
