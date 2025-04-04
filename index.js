const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;
let window = [];

app.use(cors());

const TYPE_MAP = {
  p: "primes",
  f: "fibo",
  e: "even",
  r: "rand",
};

const BASE_URL = "http://20.244.56.144/evaluation-service/";

// Your credentials
const credentials = {
  email: "e22cseu1282@bennett.edu.in",
  name: "swapneel singh",
  rollNo: "e22cseu1282",
  accessCode: "rtCHZJ",
  clientID: "b37c7106-989a-4fb1-9c29-592a1da925a7",
  clientSecret: "VcKXYuDrcPfFVSpP",
};

// Get auth token
async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}auth`, credentials);
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Authentication Failed:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
}

app.get("/numbers/:numberid", async (req, res) => {
  const { numberid } = req.params;

  if (!TYPE_MAP[numberid]) {
    return res.status(400).json({ error: "Invalid number ID" });
  }

  const prevWindow = [...window];
  let newNumbers = [];

  try {
    const token = await getAuthToken();
    if (!token) {
      return res.status(500).json({ error: "Token fetch failed" });
    }

    const source = axios.CancelToken.source();
    const timeout = setTimeout(() => {
      source.cancel();
    }, 500);

    const response = await axios.get(BASE_URL + TYPE_MAP[numberid], {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cancelToken: source.token,
    });

    clearTimeout(timeout);
    newNumbers = response.data.numbers || [];

    // Maintain window of unique numbers
    for (let num of newNumbers) {
      if (!window.includes(num)) {
        if (window.length >= WINDOW_SIZE) {
          window.shift();
        }
        window.push(num);
      }
    }

    const avg =
      window.length > 0
        ? (window.reduce((a, b) => a + b, 0) / window.length).toFixed(2)
        : 0.0;

    res.json({
      windowPrevState: prevWindow,
      windowCurrState: window,
      numbers: newNumbers,
      avg: parseFloat(avg),
    });
  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).json({ error: "Failed to fetch or response too slow" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
