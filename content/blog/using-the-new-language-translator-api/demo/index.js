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
