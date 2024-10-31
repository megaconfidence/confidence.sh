---
title: "Here's How Building a HTTP Stream Processor Went"
date: 2024-10-31
description: "Learn how to handle streaming responses from AI models"
summary: "Learn how to handle streaming responses from AI models"
tags: ["ai", "web"]
---

I worked on my first AI chat app last week and it was fun. I had to stream the response of an AI model to the client and got that cool typing effect. It was a whole week of figuring stuff out and I’m sharing some learnings here.

Streams are awesome because the server doesn’t have to buffer its entire response in memory and return a large payload. Each chunk is streamed to the client when available and helps efficiency & performance. But there are demerits too i.e. processing data in chunks.

![Streams gif](./images/giphy.gif)

Of course, streams come in all shapes and sizes, ranging from raw [HTTP streams](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Transfer-Encoding#directives) to [Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events). This article aims to help you understand how to work with and process streams. Let’s get into it.

## Before We Start…

Before exploring JavaScript APIs for processing streams, we need a stream server. If you don’t already have one, I’ll show you how to run a quick server locally with the `sse-fake-server` package.

Open a new terminal and create a Node.js stream server with the following commands:

```bash
mkdir stream-server && cd $_
npm init -y
npm install sse-fake-server
```

Then let’s write some logic that returns the current server time every 2 seconds. Create an `index.js` file with the following content:

```js
const SSEServer = require("sse-fake-server");

SSEServer((client) => {
  setInterval(() => {
    client.send(JSON.stringify({ time: new Date().toISOString() }));
  }, 2000);
});
```

To run the server, open a terminal in the project’s directory and execute the command below. This starts the server on [http://localhost:5555/stream](http://localhost:5555/stream):

```bash
node index.js
```

## Processing Streams With `for await...of` Loops

![Struggling with streams](./images/giphy_1.gif)

The first API we’ll explore is using `for await...of` loops, which can loop through over any iterable object. JavaScript’s fetch API returns the response body as an iterable [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream). Thus we can iterate over the response body using `for await..of`.

Here’s how to do it. First, we make a fetch request to the stream API and return the body without calling any [format-changing method](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#reading_the_response_body) on it. Then we can use `for await...of` to read the stream in chunks:

```js
const stream = await fetch("http://localhost:5555/stream").then((r) => r.body);

for await (const chunk of stream) {
  console.log(chunk);
}

//results in:
//Uint8Array(43) [ 100, 97, 116, 97, 58, 32, 123, 34, 116, 105, … ]
```

But something isn’t quite right. You’ll notice logging the chunks doesn’t print the server time, but outputs a series of bytes as a `Uint8Array`. This happens because we didn’t tell JavaScript what the data format of the response is. Thankfully, that’s quite easy to fix.

Create a [TextDecoder](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder) to decode the chunks of bytes to text. This prints out the response containing the server time in plain text:

```js
//...
const decoder = new TextDecoder();
for await (const chunk of stream) {
  console.log(decoder.decode(chunk));
}

//results in:
//data: {"time":"2024-09-09T08:52:37.998Z"}
```

With access to each chunk in the `for await...of` loop, you can easily process the data and transform it however you need. But the loop consumes the stream, and may be unsuitable if you only need to do transformations on the stream.

## Processing Streams With `ReadableStream`

![Playing with a hose](./images/giphy_2.gif)

Imagine you need to convert the timestamp of the server time to UTC, while still returning a stream. This involves processing the stream on the fly and, JS has the [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) API to enable this use case. With this API, you can start processing a stream without waiting to receive all its contents.

Processing a stream in real-time involves creating a lock on the source using its `getReader` method. Then a new `ReadableStream` can be returned with the transformation logic. Here’s the code to convert the server time to a UTC stream:

```js
const stream = await fetch("http://localhost:5555/stream").then((r) => r.body);

function processStream(sourceStream) {
  const reader = sourceStream.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      function push() {
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }
          const text = decoder.decode(value);
          const json = JSON.parse(text.split(": ")[1]);
          const time = new Date(json.time).toUTCString();
          const newTxt = JSON.stringify({ time });
          const newVal = encoder.encode(newTxt);
          controller.enqueue(newVal);
          push();
        });
      }
      push();
    },
  });
}

const decoder = new TextDecoder();
const processedStream = processStream(stream);
for await (const chunk of processedStream) {
  console.log(decoder.decode(chunk));
}

//results in:
//{"time":"Mon, 09 Sep 2024 20:16:22 GMT"}
```

The `processStream` function takes a source stream and returns a new `ReadableStream`. In the `start` method, we have a `push` function that uses a `reader` to read each chunk from the source stream. This results in a `done` boolean indicating the end of the stream, and a `value` containing bytes of the chunk. These bytes can be transformed and put back on the `ReadableStream`, which can then be sent to a new destination to be consumed.

## Processing Streams With `TransformStream`

![Playing with many hoses](./images/giphy_3.gif)

JavaScript also offers a `TransformStream` interface for folks who don’t like functional programming. With its API, you can implement any custom processing with Classes. As.a bonus, it also works nicely with [pipelining](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/pipeThrough).

Here’s a snippet implementing the previous transformation with `TransformStream`:

```js
const stream = await fetch("http://localhost:5555/stream").then((r) => r.body);

class TimeTranformStream extends TransformStream {
  constructor() {
    super({
      transform: (chunk, controller) => this.transform(chunk, controller),
    });
  }
  transform(chunk, controller) {
    const json = JSON.parse(chunk.split(": ")[1]);
    const time = new Date(json.time).toUTCString();
    controller.enqueue(JSON.stringify({ time }));
  }
}

const decoder = new TextDecoder();
const processedStream = stream
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TimeTranformStream())
  .pipeThrough(new TextEncoderStream());
for await (const chunk of processedStream) {
  console.log(decoder.decode(chunk));
}

//results in:
//{"time":"Mon, 09 Sep 2024 20:49:09 GMT"}
```

This example produces the same response as the `ReadableStream` implementation, but I’d argue it is much cleaner.

## Extra Credit: Converting Iterators To ReadableStreams

While working with streams you may sometimes run into situations where you need to convert an iterable object into a stream. In such cases, it’s important to know how to convert iterators to streams.

Fortunately, the use case is common enough that [ReadableStreams have a `.from` method](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/from_static) that converts an iterator to a stream. Unfortunately, as of writing, support in major browsers is lacking. Fortunately (again), we can implement a converter with a few lines of JavaScript:

```js
function iteratorToStream(iterator) {
  return new ReadableStream({
    async pull(controller) {
      for await (const chunk of iterator) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}
```

That’s it. The function takes any iterator and converts it to a readable stream.

## Conclusion

![You can float](./images/giphy_4.gif)

Streams may be tough at first, but you can float with help from JS APIs like ReadableStream, TransformStream, and others. If you found this exciting, you may find other Web-native content I’m working on. I’d love to connect with you on [LinkedIn](https://www.linkedin.com/in/megaconfidence/) and [Twitter](https://x.com/megaconfidence).

Until we see each other on the web, have a good one.
