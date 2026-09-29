// ========== STATE ==========
    let mode = 'ai';
    let difficulty = 'normal';
    let numPlayers = 2;
    let players = [];
    let currentPlayer = 0;
    let direction = 1;
    let deck = [];
    let discard = [];
    let currentColor = null;
    let gameOver = false;
    let waitingColor = false;
    let mustDraw = 0;
    let calledLast = {};
    let musicOn = true;
    let lastSettings = { mode: 'ai', difficulty: 'normal', numPlayers: 2 };

    const COLORS = ['red', 'blue', 'green', 'yellow'];

    // ========== AUDIO ==========
    const bgm = document.getElementById('bgm');
    const musicBtn = document.getElementById('musicBtn');

    function toggleMusic() {
      musicOn = !musicOn;
      if (musicOn) {
        bgm.play().catch(()=>{});
        musicBtn.textContent = '🔊';
      } else {
        bgm.pause();
        musicBtn.textContent = '🔇';
      }
    }
    musicBtn.onclick = toggleMusic;

    function playSfx(type) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'play') { osc.frequency.value = 540; gain.gain.value = 0.07; }
        else if (type === 'draw') { osc.frequency.value = 300; gain.gain.value = 0.06; }
        else if (type === 'win') { osc.frequency.value = 700; gain.gain.value = 0.09; }
        else { osc.frequency.value = 220; gain.gain.value = 0.05; }
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.stop(ctx.currentTime + 0.14);
      } catch(e) {}
    }

    // ========== LOBBY ==========
    function selectMode(m) {
      mode = m;
      document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
      document.querySelector(`[data-mode="${m}"]`).classList.add('active');
      document.getElementById('diffSection').classList.toggle('show', m === 'ai');
      document.getElementById('playersSection').classList.toggle('show', m === 'multi');
      if (m === 'ai') numPlayers = 2;
    }

    function setDiff(d) {
      difficulty = d;
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      document.querySelector(`.diff-btn[data-diff="${d}"]`).classList.add('active');
    }

    function setPlayers(n) {
      numPlayers = n;
      document.querySelectorAll('.player-btn').forEach(b => b.classList.remove('active'));
      document.querySelector(`.player-btn[data-n="${n}"]`).classList.add('active');
    }

    // ========== DECK ==========
    function createDeck() {
      const d = [];
      COLORS.forEach(color => {
        d.push({ color, value: '0' });
        for (let i = 1; i <= 9; i++) {
          d.push({ color, value: String(i) });
          d.push({ color, value: String(i) });
        }
        ['skip','reverse','draw2'].forEach(v => {
          d.push({ color, value: v });
          d.push({ color, value: v });
        });
      });
      for (let i = 0; i < 4; i++) {
        d.push({ color: 'wild', value: 'wild' });
        d.push({ color: 'wild', value: 'wild4' });
      }
      return shuffle(d);
    }

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    // ========== START ==========
    function startGame() {
      lastSettings = { mode, difficulty, numPlayers };
      gameOver = false;
      direction = 1;
      mustDraw = 0;
      calledLast = {};
      currentPlayer = 0;

      deck = createDeck();
      discard = [];
      players = [];

      for (let i = 0; i < numPlayers; i++) {
        const hand = [];
        for (let j = 0; j < 7; j++) hand.push(deck.pop());
        players.push({
          name: mode === 'ai' ? (i === 0 ? 'Kamu' : 'Bot') : `Player ${i + 1}`,
          hand,
          isAI: mode === 'ai' && i > 0
        });
      }

      let first;
      do {
        first = deck.pop();
        if (first.color === 'wild' || ['skip','reverse','draw2'].includes(first.value)) {
          deck.unshift(first);
          deck = shuffle(deck);
        } else break;
      } while (true);
      discard.push(first);
      currentColor = first.color;

      document.getElementById('lobby').style.display = 'none';
      document.getElementById('game').style.display = 'flex';
      renderAll();

      if (musicOn) bgm.play().catch(()=>{});

      if (players[currentPlayer].isAI) setTimeout(aiTurn, 700);
      else if (mode === 'multi' && currentPlayer !== 0) showPassOverlay();
    }

    // ========== RENDER ==========
    function renderAll() {
      renderPlayerInfo();
      renderDiscard();
      renderHand();
      renderDirection();
      updateTurnMsg();
      updateLastBtn();
    }

    function renderPlayerInfo() {
      const el = document.getElementById('playerInfo');
      el.innerHTML = players.map((p, i) => `
        <div class="player-badge ${i === currentPlayer ? 'active' : ''}">
          ${p.name} <span class="count">${p.hand.length}</span>
        </div>
      `).join('');
    }

    function renderDiscard() {
      const top = discard[discard.length - 1];
      const pile = document.getElementById('discardPile');
      pile.innerHTML = '';
      const card = createCardElement(top, true);
      card.style.width = '96px';
      card.style.height = '140px';
      card.style.margin = '0';
      card.style.borderRadius = '12px';
      pile.appendChild(card);

      document.getElementById('currentColor').style.background = {
        red: 'var(--red)', blue: 'var(--blue)', green: 'var(--green)', yellow: 'var(--yellow)'
      }[currentColor] || '#888';
    }

    function renderHand() {
      const handEl = document.getElementById('hand');
      handEl.innerHTML = '';
      const p = players[currentPlayer];
      if (mode === 'multi' && document.getElementById('passOverlay').classList.contains('show')) return;

      p.hand.forEach((card, idx) => {
        const el = createCardElement(card);
        const canPlay = isPlayable(card) && !waitingColor && !gameOver && !p.isAI;
        if (canPlay) el.classList.add('playable');
        el.onclick = () => { if (canPlay) playCard(idx); };
        handEl.appendChild(el);
      });
    }

    function createCardElement(card) {
      const el = document.createElement('div');
      el.className = `card ${card.color === 'wild' ? 'wild' : card.color}`;

      let display = card.value;
      if (card.value === 'skip') display = '⊘';
      else if (card.value === 'reverse') display = '⇄';
      else if (card.value === 'draw2') display = '+2';
      else if (card.value === 'wild') display = 'W';
      else if (card.value === 'wild4') display = '+4';

      el.innerHTML = `
        <span class="corner tl">${display}</span>
        <div class="oval"><span class="oval-val">${display}</span></div>
        <span class="corner br">${display}</span>
      `;
      return el;
    }

    function renderDirection() {
      const el = document.getElementById('direction');
      el.textContent = direction === 1 ? '➡️' : '⬅️';
      el.classList.toggle('reverse', direction === -1);
    }

    function updateTurnMsg() {
      const p = players[currentPlayer];
      document.getElementById('turnMsg').textContent = p.isAI ? 'Bot berpikir...' : (mode === 'multi' ? `Giliran ${p.name}` : 'Giliranmu');
    }

    function updateLastBtn() {
      const btn = document.getElementById('lastBtn');
      const p = players[currentPlayer];
      const hasPlayable = p.hand.some(c => isPlayable(c));
      const show = !p.isAI && p.hand.length === 2 && hasPlayable && !calledLast[currentPlayer];
      btn.classList.toggle('show', show);
    }

    // ========== LOGIC ==========
    function isPlayable(card) {
      if (!card) return false;
      if (mustDraw > 0) return card.value === 'draw2' || card.value === 'wild4';
      if (card.color === 'wild') return true;
      const top = discard[discard.length - 1];
      return card.color === currentColor || card.value === top.value;
    }

    function playCard(idx) {
      if (gameOver || waitingColor) return;
      const p = players[currentPlayer];
      const card = p.hand[idx];
      if (!isPlayable(card)) return;

      p.hand.splice(idx, 1);
      discard.push(card);
      playSfx('play');
      if (card.color !== 'wild') currentColor = card.color;

      if (p.hand.length === 1 && p.isAI) calledLast[currentPlayer] = true;
      if (p.hand.length === 0) { endGame(currentPlayer); return; }

      applyEffect(card);
    }

    function applyEffect(card) {
      if (card.value === 'skip') {
        nextPlayer(); nextPlayer(); afterTurn();
      } else if (card.value === 'reverse') {
        direction *= -1;
        if (players.length === 2) nextPlayer();
        nextPlayer(); afterTurn();
      } else if (card.value === 'draw2') {
        mustDraw += 2; nextPlayer(); afterTurn();
      } else if (card.value === 'wild' || card.value === 'wild4') {
        if (card.value === 'wild4') mustDraw += 4;
        if (players[currentPlayer].isAI) {
          currentColor = pickBestColor(players[currentPlayer]);
          nextPlayer(); afterTurn();
        } else {
          waitingColor = true;
          document.getElementById('colorModal').classList.add('show');
        }
      } else {
        nextPlayer(); afterTurn();
      }
    }

    function chooseColor(color) {
      currentColor = color;
      waitingColor = false;
      document.getElementById('colorModal').classList.remove('show');
      nextPlayer(); afterTurn();
    }

    function nextPlayer() {
      currentPlayer = (currentPlayer + direction + players.length) % players.length;
    }

    function afterTurn() {
      calledLast[currentPlayer] = false;
      renderAll();

      if (mustDraw > 0) {
        const p = players[currentPlayer];
        const canStack = p.hand.some(c => c.value === 'draw2' || c.value === 'wild4');
        if (!canStack) {
          for (let i = 0; i < mustDraw; i++) {
            if (deck.length === 0) refillDeck();
            p.hand.push(deck.pop());
          }
          showToast(`${p.name} +${mustDraw} kartu`);
          mustDraw = 0;
          nextPlayer();
          renderAll();
        }
      }

      if (gameOver) return;
      if (players[currentPlayer].isAI) setTimeout(aiTurn, difficulty === 'impossible' ? 500 : 850);
      else if (mode === 'multi') showPassOverlay();
    }

    function drawCard() {
      if (gameOver || waitingColor || players[currentPlayer].isAI || mustDraw > 0) return;
      if (deck.length === 0) refillDeck();
      const card = deck.pop();
      players[currentPlayer].hand.push(card);
      playSfx('draw');
      showToast('Kartu diambil');
      if (!isPlayable(card)) {
        nextPlayer(); afterTurn();
      } else {
        renderAll();
      }
    }

    function refillDeck() {
      const top = discard.pop();
      deck = shuffle(discard);
      discard = [top];
    }

    function callLast() {
      calledLast[currentPlayer] = true;
      showToast('LAST!');
      document.getElementById('lastBtn').classList.remove('show');
    }

    function pickBestColor(p) {
      const counts = { red:0, blue:0, green:0, yellow:0 };
      p.hand.forEach(c => { if (c.color !== 'wild') counts[c.color]++; });
      return Object.entries(counts).sort((a,b) => b[1] - a[1])[0][0];
    }

    // ========== AI DIFFICULTIES ==========
    function aiTurn() {
      if (gameOver) return;
      const p = players[currentPlayer];

      // Must draw handling
      if (mustDraw > 0) {
        const stackIdx = p.hand.findIndex(c => c.value === 'draw2' || c.value === 'wild4');
        if (stackIdx >= 0 && (difficulty !== 'easy' || Math.random() > 0.4)) {
          playCard(stackIdx);
          return;
        }
        for (let i = 0; i < mustDraw; i++) {
          if (deck.length === 0) refillDeck();
          p.hand.push(deck.pop());
        }
        showToast(`Bot +${mustDraw} kartu`);
        mustDraw = 0;
        nextPlayer(); afterTurn();
        return;
      }

      const playable = [];
      p.hand.forEach((c, i) => { if (isPlayable(c)) playable.push({ card: c, idx: i }); });

      if (playable.length === 0) {
        if (deck.length === 0) refillDeck();
        const card = deck.pop();
        p.hand.push(card);
        playSfx('draw');
        if (isPlayable(card) && (difficulty !== 'easy' || Math.random() > 0.35)) {
          setTimeout(() => playCard(p.hand.length - 1), 350);
        } else {
          nextPlayer(); afterTurn();
        }
        return;
      }

      let chosen;
      if (difficulty === 'easy') {
        // Random + sometimes skip good plays
        chosen = playable[Math.floor(Math.random() * playable.length)];
        if (Math.random() < 0.25 && playable.length > 1) {
          // Prefer number cards randomly
          const nums = playable.filter(x => !isNaN(x.card.value));
          if (nums.length) chosen = nums[Math.floor(Math.random() * nums.length)];
        }
      } else if (difficulty === 'normal') {
        // Prefer actions > wild > numbers
        playable.sort((a, b) => priority(b.card) - priority(a.card));
        chosen = playable[0];
      } else {
        // Impossible: smartest
        chosen = bestImpossibleMove(playable, p);
      }

      if (p.hand.length === 2) calledLast[currentPlayer] = true;
      playCard(chosen.idx);
    }

    function priority(c) {
      if (c.value === 'wild4') return 6;
      if (c.value === 'draw2') return 5;
      if (c.value === 'skip' || c.value === 'reverse') return 4;
      if (c.value === 'wild') return 3;
      return 1;
    }

    function bestImpossibleMove(playable, p) {
      // 1. If can finish, do it
      const finish = playable.find(x => p.hand.length === 1);
      if (finish) return finish;

      // 2. Prefer +4 / +2 if opponent has few cards
      const opp = players[(currentPlayer + direction + players.length) % players.length];
      if (opp.hand.length <= 3) {
        const punish = playable.find(x => x.card.value === 'wild4' || x.card.value === 'draw2');
        if (punish) return punish;
      }

      // 3. Prefer action cards
      const actions = playable.filter(x => ['skip','reverse','draw2','wild4'].includes(x.card.value));
      if (actions.length) {
        actions.sort((a,b) => priority(b.card) - priority(a.card));
        return actions[0];
      }

      // 4. Keep wild for later, prefer matching numbers that reduce color variety
      const nonWild = playable.filter(x => x.card.color !== 'wild');
      if (nonWild.length) {
        // Prefer the color we have most of
        const counts = { red:0, blue:0, green:0, yellow:0 };
        p.hand.forEach(c => { if (c.color !== 'wild') counts[c.color]++; });
        nonWild.sort((a,b) => (counts[b.card.color] || 0) - (counts[a.card.color] || 0));
        return nonWild[0];
      }

      return playable[0];
    }

    // ========== PASS & PLAY ==========
    function showPassOverlay() {
      if (mode !== 'multi') return;
      document.getElementById('passName').textContent = `Giliran ${players[currentPlayer].name}`;
      document.getElementById('passOverlay').classList.add('show');
      document.getElementById('hand').innerHTML = '';
    }

    function revealHand() {
      document.getElementById('passOverlay').classList.remove('show');
      renderHand();
    }

    // ========== END ==========
    function endGame(winnerIdx) {
      gameOver = true;
      playSfx('win');
      const winner = players[winnerIdx];
      const isPlayerWin = mode === 'ai' && winnerIdx === 0;
      document.getElementById('trophy').textContent = isPlayerWin ? '🏆' : '🎉';
      document.getElementById('winnerText').textContent = `${winner.name} Menang!`;
      document.getElementById('scoreText').textContent = isPlayerWin ? 'Keren banget!' : (difficulty === 'impossible' ? 'Bot Impossible terlalu gila...' : 'GG!');
      document.getElementById('gameOverModal').classList.add('show');
    }

    function tryAgain() {
      document.getElementById('gameOverModal').classList.remove('show');
      mode = lastSettings.mode;
      difficulty = lastSettings.difficulty;
      numPlayers = lastSettings.numPlayers;
      startGame();
    }

    function backToLobby() {
      document.getElementById('gameOverModal').classList.remove('show');
      document.getElementById('game').style.display = 'none';
      document.getElementById('lobby').style.display = 'flex';
      bgm.pause();
    }

    function confirmLobby() {
      if (confirm('Kembali ke lobby? Progress akan hilang.')) backToLobby();
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 1700);
    }

    // Init
    selectMode('ai');
