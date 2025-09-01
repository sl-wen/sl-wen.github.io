import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Phaser from 'phaser';
import GridEngine from 'grid-engine';
import BootScene from './game/scenes/BootScene';
import MainMenuScene from './game/scenes/MainMenuScene';
import GameOverScene from './game/scenes/GameOverScene';
import GameScene from './game/scenes/GameScene';
import { styled } from '@mui/material/styles';
import classNames from 'classnames';
import { Backdrop, Fade, Modal, Typography } from '@mui/material';
import dialogBorderBox from './game/assets/images/dialog_borderbox.png';
import GameMenu from "./game/GameMenu";
import DialogBox from "./game/DialogBox";
import HeroCoin from "./game/HeroCoin";
import HeroHealth from "./game/HeroHealth";
import './App.css';
import { calculateGameSize } from "./game/utils";

const { width, height, multiplier } = calculateGameSize();

const GameContentWrapper = styled('div')(({ theme }) => ({
  width: `${width * multiplier}px`,
  height: `${height * multiplier}px`,
  margin: 'auto',
  padding: 0,
  overflow: 'hidden',
  '& canvas': {
    imageRendering: 'pixelated',
    '-ms-interpolation-mode': 'nearest-neighbor',
    boxShadow: '0px 0px 0px 3px rgba(0,0,0,0.75)',
  },
}));

const GameWrapper = styled('div')(({ theme }) => ({
  color: '#FFFFFF',
}));

const dialogs = {
  "npc_01": [{
    "message": "Hello",
  }, {
    "message": "How are you?",
  }],
  "npc_02": [{
    "message": "Hello there",
  }],
  "npc_03": [{
    "message": "Hi",
  }, {
    "message": "Ok bye!",
  }],
  "npc_04": [{
    "message": "Hey",
  }],
  "sword": [{
    "message": "You got a sword",
  }],
  "push": [{
    "message": "You can push boxes now",
  }],
  "sign_01": [{
    "message": "You can read this!",
  }],
  "book_01": [{
    "message": "Welcome to the game!",
  }]
};

function App() {
  const [messages, setMessages] = useState([]);
  const [characterName, setCharacterName] = useState('');
  const [gameMenuItems, setGameMenuItems] = useState([]);
  const [gameMenuPosition, setGameMenuPosition] = useState('center');
  const [heroHealthStates, setHeroHealthStates] = useState([]);
  const [heroCoins, setHeroCoins] = useState(null);

  const handleMessageIsDone = useCallback(() => {
    const customEvent = new CustomEvent(`${characterName}-dialog-finished`, {
      detail: {},
    });
    window.dispatchEvent(customEvent);

    setMessages([]);
    setCharacterName('');
  }, [characterName]);

  const handleMenuItemSelected = useCallback((selectedItem) => {
    setGameMenuItems([]);

    const customEvent = new CustomEvent('menu-item-selected', {
      detail: {
        selectedItem,
      },
    });
    window.dispatchEvent(customEvent);
  }, []);

  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      title: 'some-game-title',
      parent: 'game-content',
      orientation: Phaser.Scale.LANDSCAPE,
      localStorageName: 'some-game-title',
      width,
      height,
      autoRound: true,
      pixelArt: true,
      scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH,
        mode: Phaser.Scale.ENVELOP,
      },
      scene: [
        BootScene,
        MainMenuScene,
        GameScene,
        GameOverScene,
      ],
      physics: {
        default: 'arcade',
      },
      plugins: {
        scene: [
          {
            key: 'gridEngine',
            plugin: GridEngine,
            mapping: 'gridEngine',
          },
        ],
      },
      backgroundColor: '#000000',
    });

    // window.phaserGame = game;
  }, []);

  useEffect(() => {
    const dialogBoxEventListener = ({ detail }) => {
      // TODO fallback
      setCharacterName(detail.characterName);
      setMessages(
          dialogs[detail.characterName]
      );
    };
    window.addEventListener('new-dialog', dialogBoxEventListener);

    const gameMenuEventListener = ({ detail }) => {
      setGameMenuItems(detail.menuItems);
      setGameMenuPosition(detail.menuPosition);
    };
    window.addEventListener('menu-items', gameMenuEventListener);

    const heroHealthEventListener = ({ detail }) => {
      setHeroHealthStates(detail.healthStates);
    };
    window.addEventListener('hero-health', heroHealthEventListener);

    const heroCoinEventListener = ({ detail }) => {
      setHeroCoins(detail.heroCoins);
    };
    window.addEventListener('hero-coin', heroCoinEventListener);

    return () => {
      window.removeEventListener('new-dialog', dialogBoxEventListener);
      window.removeEventListener('menu-items', gameMenuEventListener);
      window.removeEventListener('hero-health', heroHealthEventListener);
      window.removeEventListener('hero-coin', heroCoinEventListener);
    };
  }, [setCharacterName, setMessages]);

  return (
      <div>
        <GameWrapper>
          <GameContentWrapper
              id="game-content"
          >
            {/* this is where the game canvas will be rendered */}
          </GameContentWrapper>
          {heroHealthStates.length > 0 && (
              <HeroHealth
                  gameSize={{
                    width,
                    height,
                    multiplier,
                  }}
                  healthStates={heroHealthStates}
              />
          )}
          {heroCoins !== null && (
              <HeroCoin
                  gameSize={{
                    width,
                    height,
                    multiplier,
                  }}
                  heroCoins={heroCoins}
              />
          )}
          {messages.length > 0 && (
              <DialogBox
                  onDone={handleMessageIsDone}
                  characterName={characterName}
                  messages={messages}
                  gameSize={{
                    width,
                    height,
                    multiplier,
                  }}
              />
          )}
          {gameMenuItems.length > 0 && (
              <GameMenu
                  items={gameMenuItems}
                  gameSize={{
                    width,
                    height,
                    multiplier,
                  }}
                  position={gameMenuPosition}
                  onSelected={handleMenuItemSelected}
              />
          )}
        </GameWrapper>
      </div>
  );
}

export default App;
