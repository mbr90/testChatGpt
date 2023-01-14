const express = require("express");
require("dotenv").config();
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");
const { Configuration, OpenAIApi } = require("openai");

const app = express();

app.use("/", express.static("public"));

app.use(fileUpload());

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});

const openai = new OpenAIApi(configuration);

app.post("/extract-text", async (req, res) => {
  if (!req.files && !req.files.pdfFile) {
    res.status(400);
    res.end();
  }

  const pdf = await pdfParse(req.files.pdfFile);

  let firstWords = pdf.text.substring(0, 1500);

  let textArray = pdf.text.split(" ");
  let lastWords = textArray.slice(-30).join(" ");

  let reducedText = firstWords + lastWords;

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt:
        `I expect a table of this type:

      Utgiver: Name of publisher
      Forfatter: Name of author
      Redaktør: Name of editor
      ISBN: Number
      Utgivelsesdato: Date of publication
            
      Can you extract such a table from the following text:     
      ` + reducedText,
      temperature: 0,
      max_tokens: 500,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    res.send(response.data.choices[0].text);
    console.log(response.data.choices[0].text);
  } catch (error) {
    console.log(error);
  }
});

const port = process.env.PORT || 3000;

app.listen(port);
