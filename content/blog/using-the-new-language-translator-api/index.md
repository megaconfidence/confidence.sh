---
title: "Using The New Language Translator API"
date: 2025-09-13
description: "How to use the new AI powered Translator API"
summary: "How to use the new AI powered Translator API"
tags: ["fugu", "ai"]
---

It’s 2025, and it’s no surprise AI is everywhere, including the browser. The browser can now download AI models, albeit the small ones, to power user experiences. This is great for many reasons. You don’t have to rely on third-party services to power experiences in your app. Also, you don’t have to call the network in the first place because the models are local and private.

The new [Translator and Language Detector APIs](https://developer.mozilla.org/en-US/docs/Web/API/Translator_and_Language_Detector_APIs) are two such APIs powered by local AI models running in the browser. They can be used to detect and translate between languages natively in the browser. This improves the user experience and simplifies your app's architecture. This article introduces the Translator API and everything you need to know to get started with it.

## The Translator API

Many web applications rely on translation to make the content accessible to users. Traditionally, adding this feature requires several steps. You'd have to get the user's preferred language, then upload content from your app to a translation service, then download the translated content, and finally display it. This changes with the new Translator API. Translation is done client-side, saving time and cost associated with external translation services.

To use this API, check to see if the browser supports it:

```js
if ("Translator" in self) {
  // Translator API is supported
}
```

If the API is not supported, you could fall back to an external service to keep the user experience consistent. Before creating a Translator, it’s a good idea to check if the model supports the source and target language pairs. If not, you could use a fallback. You can do this by calling the `availability` method with the pair:

```js
await Translator.availability({
  sourceLanguage: "es",
  targetLanguage: "ja",
});
// returns 'available', 'downloadable', 'downloading' or 'unavailable'
```

And finally, you can call the `create` method to download the model and create an instance. The model is automatically downloaded and initialised by the browser. To interact with the model, use the `Translator` instance:

```js
const translator = await Translator.create({
  sourceLanguage: "es",
  targetLanguage: "ja",
  // optionally show download progress to the user
  monitor(m) {
    m.addEventListener("downloadprogress", (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});
```

## Using the Translator API

To demonstrate how to use the Translator API, let's build an on-demand subtitle generation feature for a video player. We'll only use standard web APIs, including HTML5 video and subtitles using the [WebVTT API](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API). Here’s the source code with the embedded video and VTT subtitle files:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Web Translator</title>
  </head>
  <body>
    <video controls src="friday.mp4">
      <track
        default
        kind="subtitles"
        label="English"
        src="captions.vtt"
        srclang="en"
      />
    </video>
  </body>
</html>
```

<iframe src="./demo/index1.html"  style="width: 100%; border-style: none; height: 0; overflow: hidden" onload="resizeIframe(this)"></iframe>

The demo above is a regular video player with English subtitles. Let's write some JavaScript to read the content of the subtitle and translate it into another language. To do this, update the UI to enable the user to select a language they want captions generated for. And finally, we'll also need a JavaScript file:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Web Translator</title>
  </head>
  <body>
    <video controls src="friday.mp4">
      <track
        default
        kind="subtitles"
        label="English"
        src="captions.vtt"
        srclang="en"
      />
    </video>
    <div>
      <label for="cars">Generate subtitles for</label>
      <select name="subtitles" id="subtitles">
        <option value="ja">Japanese</option>
        <option value="fr">French</option>
        <option value="es">Spanish</option>
      </select>
      <button>Start</button>
      <span></span>
    </div>
    <script type="module" src="index.js"></script>
  </body>
</html>
```

In the JavaScript file, we get the language selected by the user, create a translator instance, and then read the subtitle track. While reading this track, we translate it to the selected language and create a new subtitle track in the selected language on demand. Here’s the JS implementation:

```js
const infoElem = document.querySelector("span");
const videoElem = document.querySelector("video");
document.querySelector("button").addEventListener("click", generateSubtitles);

async function generateSubtitles() {
  // check browser support
  if ("Translator" in self) {
    // get user selection
    const lang = document.querySelector("select").value;
    const langName = document.querySelector(`option[value="${lang}"]`).text;

    // create a translator instance
    const translator = await Translator.create({
      sourceLanguage: "es",
      targetLanguage: lang,
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          infoElem.innerText = `Downloaded ${e.loaded * 100}%`;
        });
      },
    });

    // reate the VTT text track, translate to target language
    // and generate a new subtitle track for the translation
    const track = videoElem.addTextTrack("subtitles", langName, lang);
    const enTrack = videoElem.textTracks[0]; // default english subtitle
    for (let [_, cue] of Object.entries(enTrack.cues)) {
      enTrack.mode = "hidden";
      const text = await translator.translate(cue.text);
      track.addCue(new VTTCue(cue.startTime, cue.endTime, text));
    }
    track.mode = "showing";
    infoElem.innerText = "Subtitles generated. Select it in the captions.";
  } else {
    // fall back if the Translator api is not supported
    infoElem.innerText = "Translator API not supported in this browser.";
  }
}
```

<iframe src="./demo/"  style="width: 100%; border-style: none; height: 0; overflow: hidden" onload="resizeIframe(this)"></iframe>

<script>
  function resizeIframe(obj) {
    obj.style.height = obj.contentWindow.document.documentElement.scrollHeight + 'px';
  }
</script>

Finally, if you need to translate a large volume of text like a book, you should use the streaming API:

```js
const stream = translator.translateStreaming(largeText);
for await (const chunk of stream) {
  console.log(chunk);
}
```

## Conclusion

The web platform is starting to reap the benefits of embedded models, and the Translator API is one of many. These AI-powered APIs will enable developers to bring rich user experiences that are native, fast, private, and secure. I’ll be exploring more of these in subsequent articles, so follow me on [Twitter](https://x.com/megaconfidence) or [LinkedIn](https://www.linkedin.com/in/megaconfidence/) to stay updated. See you next time.
