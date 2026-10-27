// ページの組み立てと、アバターとの会話の動き。
// 文章を変えたいときは content.js を編集してください。

(function () {
  const $ = (id) => document.getElementById(id);
  const TYPE_SPEED = 35; // 1文字を出す間隔（ミリ秒）
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- タイトル・自己紹介・リンク ----
  document.title = CONTENT.title;
  buildLogo();
  $("site-lead").textContent = CONTENT.lead;
  $("footer-text").textContent = CONTENT.footer;

  // ---- ロゴ（タイトル） ----
  // 上に小さな英字、下にタイトル。英字は飾りなので、読み上げでは読まない（aria-hidden）。
  function buildLogo() {
    const h1 = $("site-title");
    h1.replaceChildren();
    h1.setAttribute("aria-label", CONTENT.title);

    const sub = document.createElement("span");
    sub.className = "logo-sub";
    sub.setAttribute("aria-hidden", "true");
    sub.textContent = CONTENT.logoSub || "";

    const text = document.createElement("span");
    text.className = "logo-text";
    text.setAttribute("aria-hidden", "true");
    text.textContent = CONTENT.title;
    h1.append(sub, text);

    // ロゴ用の文字（Googleフォント）を、タイトルに使う文字だけ読み込む（軽くするため）
    const chars = Array.from(new Set(Array.from(
      CONTENT.title + (CONTENT.logoSub || "") + (CONTENT.logoSub || "").toUpperCase() // 英字は大文字で表示するため
    ))).join("");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2"
      + "?family=Zen+Maru+Gothic:wght@700"
      + "&family=Quicksand:wght@600"
      + "&display=swap&text=" + encodeURIComponent(chars);
    document.head.appendChild(link);
  }

  for (const text of CONTENT.profile) {
    const p = document.createElement("p");
    p.textContent = text;
    $("profile-body").appendChild(p);
  }

  for (const app of CONTENT.apps || []) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "app-card";
    a.href = app.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    if (app.image) {
      const img = document.createElement("img");
      img.className = "app-thumb";
      img.src = app.image;
      img.alt = "";
      img.loading = "lazy";
      a.appendChild(img);
    }
    const body = document.createElement("div");
    body.className = "app-body";
    const name = document.createElement("span");
    name.className = "app-name";
    name.textContent = app.name;
    body.appendChild(name);
    if (app.tags && app.tags.length) {
      const tags = document.createElement("span");
      tags.className = "app-tags";
      for (const t of app.tags) {
        const tag = document.createElement("span");
        tag.className = "app-tag";
        tag.textContent = t;
        tags.appendChild(tag);
      }
      body.appendChild(tags);
    }
    if (app.text) {
      const text = document.createElement("span");
      text.className = "app-text";
      text.textContent = app.text;
      body.appendChild(text);
    }
    const open = document.createElement("span");
    open.className = "app-open";
    open.textContent = "ひらく ↗";
    body.appendChild(open);
    a.appendChild(body);
    li.appendChild(a);
    $("app-list").appendChild(li);
  }
  if (!(CONTENT.apps || []).length) document.querySelector(".apps").hidden = true;

  for (const link of CONTENT.links) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    const name = document.createElement("span");
    name.className = "link-name";
    name.textContent = link.name;
    a.appendChild(name);
    if (link.note) {
      const note = document.createElement("span");
      note.className = "link-note";
      note.textContent = link.note;
      a.appendChild(note);
    }
    const arrow = document.createElement("span");
    arrow.className = "link-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    a.appendChild(arrow);
    li.appendChild(a);
    $("link-list").appendChild(li);
  }

  // ---- ライト／ダークの切り替え ----
  // 最初は端末の設定に合わせる。ボタンで選んだら、その選択を覚えておく。
  const themeButton = $("theme-toggle");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  function isDark() {
    const t = document.documentElement.dataset.theme;
    return t ? t === "dark" : systemDark.matches;
  }
  function updateThemeButton() {
    const dark = isDark();
    themeButton.setAttribute("aria-pressed", String(dark));
    themeButton.setAttribute("aria-label", dark ? "ライトモードにする" : "ダークモードにする");
  }
  themeButton.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    updateThemeButton();
  });
  systemDark.addEventListener("change", updateThemeButton);
  updateThemeButton();

  // ---- 効果音（文字送りのポコポコ音） ----
  // 音声ファイルは使わず、ブラウザの機能で音を作っています。
  // ブラウザの決まりで、ページを一度タップ／クリックするまでは音が出ません。
  const sound = (function () {
    let ctx = null;
    let enabled = true;
    try {
      enabled = localStorage.getItem("sound") !== "off";
    } catch (e) { /* 保存できない環境では、音ありのまま */ }

    function unlock() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!ctx) ctx = new AC();
      if (ctx.state === "suspended") ctx.resume();
    }
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    function blip(pitch) {
      if (!enabled || !ctx || ctx.state !== "running") return;
      const t = ctx.currentTime;
      const base = 520 * pitch * (0.94 + Math.random() * 0.12); // 少しずつ高さを揺らす
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 0.6, t + 0.07); // 音程を下げて「ポコ」っぽく
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.09, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    }

    return {
      blip,
      get enabled() { return enabled; },
      set enabled(v) {
        enabled = v;
        try { localStorage.setItem("sound", v ? "on" : "off"); } catch (e) {}
      },
    };
  })();

  const soundButton = $("sound-toggle");
  function updateSoundButton() {
    soundButton.setAttribute("aria-pressed", String(sound.enabled));
    soundButton.setAttribute("aria-label", sound.enabled ? "音をオフにする" : "音をオンにする");
  }
  soundButton.addEventListener("click", (e) => {
    e.stopPropagation(); // 文字送りにならないように
    sound.enabled = !sound.enabled;
    updateSoundButton();
  });
  updateSoundButton();

  // ---- アバター ----
  // avatars には「1人のキャラクター」と「2人組（members があるもの）」が並んでいる。
  // 2人組は、members に書いた名前のキャラクターの画像・声を使う。
  // hidden: true のキャラクターは、2人組にだけ出て、左右の切り替えには出てこない。
  const characters = {};
  for (const a of CONTENT.avatars) if (!a.members) characters[a.name] = a;
  const avatars = CONTENT.avatars.filter((a) => !a.hidden);

  let currentIndex = 0;
  let current = avatars[0];   // いま表示している項目（1人または2人組）
  let speaking = null;        // いましゃべっているキャラクター

  // 項目に出てくるキャラクターの一覧（1人なら自分だけ）
  // 1人のキャラクターに guests があれば、その人たちも会話に入れる（最初は出ていない）
  function membersOf(entry) {
    if (entry.members) return entry.members.map((n) => characters[n]).filter(Boolean);
    return [entry, ...(entry.guests || []).map((n) => characters[n]).filter(Boolean)];
  }

  // 舞台：キャラクターの名前 → 表示している img
  const stage = $("avatar-stage");
  const shown = new Map();

  function showCharacter(ch) {
    if (shown.has(ch.name)) return shown.get(ch.name);
    const img = document.createElement("img");
    img.className = "avatar";
    img.alt = ch.alt || "";
    img.src = ch.faces.normal;
    img.addEventListener("click", advance);
    // members に書いた順番で左から並べる
    const order = membersOf(current).indexOf(ch);
    const after = [...shown.entries()].find(([n]) => membersOf(current).findIndex((m) => m.name === n) > order);
    stage.insertBefore(img, after ? after[1] : null);
    shown.set(ch.name, img);
    stage.classList.toggle("is-pair", shown.size > 1);
    return img;
  }

  // 舞台から下げる（最後の1人は下げない）
  function hideCharacter(name) {
    const img = shown.get(name);
    if (!img || shown.size <= 1) return;
    img.remove();
    shown.delete(name);
    stage.classList.toggle("is-pair", shown.size > 1);
  }

  function resetStage() {
    stage.replaceChildren();
    shown.clear();
    const members = membersOf(current);
    const first = current.startWith
      ? members.filter((m) => current.startWith.includes(m.name))
      : current.members ? members : [current]; // guests は最初は出さない
    for (const m of first) showCharacter(m);
    stage.classList.toggle("is-pair", shown.size > 1);
  }

  // しゃべる人を決める。まだ舞台にいなければ登場させる。
  function setSpeaker(ch, face) {
    speaking = ch;
    const img = showCharacter(ch);
    for (const [name, el] of shown) el.classList.toggle("speaking", name === ch.name);
    // 画像が用意できていない表情は normal で表示する
    const src = ch.faces[face] || ch.faces.normal;
    if (img.getAttribute("src") !== src) img.src = src;
    $("speaker").textContent = ch.name;
    img.classList.remove("talking");
    void img.offsetWidth; // アニメーションをやり直すため
    img.classList.add("talking");
  }

  // 左右の切り替えボタン。左は前のアバター、右は次のアバターの顔を出す。
  // 端まで行くと反対側に戻る（ループ）。1人だけのときは、同じアバターが出る。
  const prevButton = $("avatar-prev");
  const nextButton = $("avatar-next");
  const wrap = (i) => (i + avatars.length) % avatars.length;

  function updateNavButton(button, index, label) {
    const a = avatars[index];
    const faces = button.querySelector(".avatar-nav-faces");
    faces.replaceChildren();
    const members = a.members ? membersOf(a) : [a]; // guests はボタンには出さない
    faces.classList.toggle("is-pair", members.length > 1);
    button.classList.toggle("is-pair", members.length > 1);
    for (const m of members.slice(0, 2)) {
      const img = document.createElement("img");
      img.src = m.faces.normal;
      img.alt = "";
      faces.appendChild(img);
    }
    button.setAttribute("aria-label", label + "のアバター（" + a.name + "）に切り替える");
    button.dataset.tip = a.name;
  }

  function setAvatar(index) {
    currentIndex = wrap(index);
    current = avatars[currentIndex];
    // 表情の画像を先に読み込んでおき、切り替えたときにちらつかないようにする
    for (const m of membersOf(current)) {
      for (const src of Object.values(m.faces)) new Image().src = src;
    }
    resetStage();
    updateNavButton(prevButton, wrap(currentIndex - 1), "前");
    updateNavButton(nextButton, wrap(currentIndex + 1), "次");
    playScene("start");
  }

  prevButton.addEventListener("click", () => setAvatar(currentIndex - 1));
  nextButton.addEventListener("click", () => setAvatar(currentIndex + 1));

  // ---- 会話 ----
  const window_ = document.querySelector(".message-window");
  const message = $("message");
  const choices = $("choices");
  const nextMark = $("next-mark");
  const SILENT = /[\s、。，．,.！？!?「」『』（）()・…～ー♡]/; // 音を鳴らさない文字

  let scene = null;
  let lineIndex = 0;
  let typing = false;
  let timer = null;
  let fullText = "";

  // 声の高さ：content.js の voice（1〜5）を、音の高さの倍率にする
  const VOICE_LEVELS = [0.7, 0.9, 1.1, 1.3, 1.5];
  function voicePitch(level) {
    const i = Math.min(Math.max(Math.round(level || 3), 1), 5) - 1;
    return VOICE_LEVELS[i];
  }

  function lineOf(scene, i) {
    // セリフは文字列か { text, face, who } のどちらでも書ける
    const line = scene.lines[i];
    return typeof line === "string" ? { text: line } : line;
  }

  // そのセリフをしゃべるキャラクター。2人組では who で指定（なければ1人目）
  function speakerOf(line) {
    const members = membersOf(current);
    const name = line.who || scene.who;
    return members.find((m) => m.name === name) || members[0];
  }

  function playScene(name) {
    // 場面が見つからないときは、質問に戻る場面へ
    scene = current.talk[name] || current.talk[current.talkHome];
    if (!scene) return;
    lineIndex = 0;
    showLine();
  }

  function showLine() {
    clearInterval(timer);
    const line = lineOf(scene, lineIndex);
    setSpeaker(speakerOf(line), line.face || scene.face || "normal");
    choices.replaceChildren();
    nextMark.hidden = true;
    fullText = line.text;

    if (reduceMotion) {
      message.textContent = fullText;
      finishLine();
      return;
    }
    typing = true;
    message.textContent = "";
    let i = 0;
    const chars = Array.from(fullText);
    timer = setInterval(() => {
      const ch = chars[i++];
      message.textContent += ch;
      if (i % 2 === 1 && !SILENT.test(ch)) sound.blip(voicePitch(speaking.voice)); // 2文字に1回鳴らす
      if (i >= chars.length) finishLine();
    }, TYPE_SPEED);
  }

  function finishLine() {
    clearInterval(timer);
    typing = false;
    message.textContent = fullText;
    if (isLastLine() && hasChoices()) {
      showChoices();
    } else {
      nextMark.hidden = false;
    }
  }

  function isLastLine() {
    return lineIndex >= scene.lines.length - 1;
  }

  function hasChoices() {
    return Array.isArray(scene.choices) && scene.choices.length > 0;
  }

  function showChoices() {
    for (const c of scene.choices || []) {
      const b = document.createElement(c.url ? "a" : "button");
      b.className = "choice";
      b.textContent = c.label;
      if (c.url) {
        b.href = c.url;
        b.target = "_blank";
        b.rel = "noopener noreferrer";
      } else {
        b.type = "button";
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          leaveAfterLine();
          playScene(c.next);
        });
      }
      choices.appendChild(b);
    }
  }

  // メッセージウィンドウかアバターを押すと、文字送り／次のセリフ
  function advance() {
    if (typing) {
      finishLine();
    } else if (!isLastLine()) {
      leaveAfterLine();
      lineIndex++;
      showLine();
    } else if (!hasChoices()) {
      // 続きの会話がないので、質問に戻る
      leaveAfterLine();
      playScene(current.talkHome);
    }
  }

  // セリフに leave があれば、次へ進むときに下げる。
  // leave: true はしゃべった本人、leave: "名前" はその人。
  function leaveAfterLine() {
    const line = lineOf(scene, lineIndex);
    if (!line.leave) return;
    hideCharacter(line.leave === true ? speakerOf(line).name : line.leave);
  }
  window_.addEventListener("click", advance);
  window_.tabIndex = 0;
  window_.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target === window_) {
      e.preventDefault();
      advance();
    }
  });

  setAvatar(0);
})();
