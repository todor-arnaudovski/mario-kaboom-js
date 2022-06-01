kaboom({
  global: true,
  fullscreen: true,
  scale: 1.25,
  debug: true,
  background: [0, 0, 0],
});

let MOVE_SPEED = 120;
const JUMP_FORCE = 500;
const BIG_JUMP_FORCE = 550;
let CURRENT_JUMP_FORCE = JUMP_FORCE;
const FONT_SIZE = 16;
const ENEMY_SPEED = 50;
let isJumping = false;
const FALL_DEATH = 400;

loadRoot('./assets/');
loadSprite('coin', 'coin.png');
loadSprite('evil-shroom', 'evil-shroom.png');
loadSprite('brick', 'brick.png');
loadSprite('block', 'block.png');
loadSprite('mario', 'mario.png');
loadSprite('mushroom', 'mushroom.png');
loadSprite('surprise', 'surprise.png');
loadSprite('unboxed', 'unboxed.png');
loadSprite('pipe-top-left', 'pipe-top-left.png');
loadSprite('pipe-top-right', 'pipe-top-right.png');
loadSprite('pipe-bottom-left', 'pipe-bottom-left.png');
loadSprite('pipe-bottom-right', 'pipe-bottom-right.png');

loadSprite('blue-block', 'blue-block.png')
loadSprite('blue-brick', 'blue-brick.png')
loadSprite('blue-steel', 'blue-steel.png')
loadSprite('blue-evil-shroom', 'blue-evil-shroom.png')
loadSprite('blue-surprise', 'blue-surprise.png')

const increaseScore = (scoreLabel) => {
  scoreLabel.value++;
  scoreLabel.text = scoreLabel.value;
};

scene('game', ({ level, score }) => {
  layers(['bg', 'obj', 'ui'], 'obj');

  const maps = [
    [
      '                                      ',
      '                                      ',
      '                                      ',
      '                                      ',
      '                                      ',
      '     %   =*=%=                        ',
      '                                      ',
      '                            -+        ',
      '                    ^   ^   ()        ',
      '==============================   =====',
    ],
    [
      '£                                       £',
      '£                                       £',
      '£                                       £',
      '£                                       £',
      '£                                       £',
      '£        @@@@@@              x x        £',
      '£                          x x x        £',
      '£                        x x x x  x   -+£',
      '£               z   z  x x x x x  x   ()£',
      '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
    ],
  ];

  const levelConfig = {
    width: 20,
    height: 20,
    '=': () => [sprite('block'), area(), solid()],
    $: () => [sprite('coin'), area(), 'coin'],
    '%': () => [sprite('surprise'), area(), solid(), 'coin-surprise'],
    '*': () => [sprite('surprise'), area(), solid(), 'mushroom-surprise'],
    '}': () => [sprite('unboxed'), area(), solid()],
    '(': () => [sprite('pipe-bottom-left'), area(), solid(), scale(0.5)],
    ')': () => [sprite('pipe-bottom-right'), area(), solid(), scale(0.5)],
    '-': () => [sprite('pipe-top-left'), area(), solid(), scale(0.5), 'pipe'],
    '+': () => [sprite('pipe-top-right'), area(), solid(), scale(0.5), 'pipe'],
    '^': () => [sprite('evil-shroom'), area(), 'dangerous'],
    '#': () => [sprite('mushroom'), area(), solid(), 'mushroom', body()],
    '!': () => [sprite('blue-block'), area(), solid(), scale(0.5)],
    '£': () => [sprite('blue-brick'), area(), solid(), scale(0.5)],
    'z': () => [sprite('blue-evil-shroom'), area(), solid(), scale(0.5), 'dangerous'],
    '@': () => [sprite('blue-surprise'), area(), solid(), scale(0.5), 'coin-surprise'],
    'x': () => [sprite('blue-steel'), area(), solid(), scale(0.5)],
  };

  const gameLevel = addLevel(maps[level], levelConfig);

  const scoreLabel = add([
    text(score, { size: FONT_SIZE }),
    pos(120, 6),
    layer('ui'),
    {
      value: score,
    },
  ]);

  add([text('level ' + parseInt(level + 1), { size: FONT_SIZE }), pos(4, 6)]);

  const big = () => {
    let timer = 0;
    let isBig = false;

    return {
      update() {
        if (isBig) {
          CURRENT_JUMP_FORCE = BIG_JUMP_FORCE;
          timer -= dt();
          if (timer <= 0) {
            this.smallify();
          }
        }
      },
      isBig() {
        return isBig;
      },
      smallify() {
        this.scale = vec2(1);
        CURRENT_JUMP_FORCE = JUMP_FORCE;
        timer = 0;
        isBig = false;
      },
      biggify(time) {
        this.scale = vec2(1.5);
        timer = time;
        isBig = true;
      },
    };
  };

  const player = add([
    sprite('mario'),
    pos(30, 0),
    area({ width: 15 }),
    body(),
    big(),
    origin('bot'),
  ]);

  onUpdate('mushroom', (m) => {
    m.move(80, 0);
  });

  player.onCollide('coin-surprise', (obj, col) => {
    if (col.isTop()) {
      gameLevel.spawn('$', obj.gridPos.sub(0, 1));
      destroy(obj);
      gameLevel.spawn('}', obj.gridPos.sub(0, 0));
    }
  });

  player.onCollide('mushroom-surprise', (obj, col) => {
    if (col.isTop()) {
      gameLevel.spawn('#', obj.gridPos.sub(0, 1));
      destroy(obj);
      gameLevel.spawn('}', obj.gridPos.sub(0, 0));
    }
  });

  player.onCollide('mushroom', (m) => {
    destroy(m);
    player.biggify(6);
  });

  player.onCollide('coin', (c) => {
    destroy(c);
    increaseScore(scoreLabel);
  });

  onUpdate('dangerous', (d) => {
    d.move(-ENEMY_SPEED, 0);
  });

  player.onCollide('dangerous', (d) => {
    if (isJumping || !player.isGrounded()) {
      destroy(d);
      increaseScore(scoreLabel);
    } else {
      go('lose', { score: scoreLabel.value });
    }
  });

  player.onUpdate(() => {
    camPos(player.pos);
    if (player.pos.y >= FALL_DEATH) {
      go('lose', { score: scoreLabel.value });
    }
  });

  player.onCollide('pipe', () => {
    onKeyDown('down', () => {
      go('game', {
        level: (level + 1) % maps.length,
        score: scoreLabel.value,
      });
    });
  });

  onKeyDown('left', () => {
    player.move(-MOVE_SPEED, 0);
  });

  onKeyDown('right', () => {
    player.move(MOVE_SPEED, 0);
  });

  player.onUpdate(() => {
    if (player.isGrounded()) {
      isJumping = false;
    }
  });

  onKeyDown('space', () => {
    if (player.isGrounded()) {
      isJumping = true;
      player.jump(CURRENT_JUMP_FORCE);
    }
  });

  onKeyDown('shift', () => {
    MOVE_SPEED = 240;
  });

  onKeyRelease('shift', () => {
    MOVE_SPEED = 120;
  });
});

scene('lose', ({ score }) => {
  add([
    text(`Your score: ${score}`, { size: 24 }),
    origin('center'),
    pos(width() / 2, height() / 2),
  ]);
});

go('game', { level: 0, score: 0 });
