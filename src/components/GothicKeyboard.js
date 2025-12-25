import React, { useState, useEffect, useRef } from 'react';
import './GothicKeyboard.css';

// Gothic keyboard layouts
const KEYBOARD_LAYOUTS = {
  english: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['symbols', 'space', 'enter']
  ],
  russian: [
    ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х'],
    ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
    ['shift', 'я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', 'backspace'],
    ['symbols', 'space', 'enter']
  ],
  symbols: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['.', ',', '?', '!', ';', ':', '"', "'", '-', '(', ')'],
    ['@', '#', '$', '%', '&', '*', '+', '=', '/', 'backspace'],
    ['letters', 'space', 'enter']
  ]
};

// Special gothic symbols for decoration
const GOTHIC_SYMBOLS = ['☽', '☾', '✦', '❋', '⚜', '✧', '☆', '◈', '❈', '✤'];

// Convert to Symbols Panel: keep textarea optional, default to system keyboard usage
const GothicKeyboard = ({
  onKeyPress,
  onTextChange,
  placeholder = "Write your mystical thoughts...",
  initialText = "",
  className = "",
  showKeyboard = false,
  enableSound = false,
  language = 'english'
}) => {
  const [currentLayout, setCurrentLayout] = useState(language);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [text, setText] = useState(initialText);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(showKeyboard);
  const [activeKey, setActiveKey] = useState(null);
  const textareaRef = useRef(null);

  // Handle text changes
  useEffect(() => {
    if (onTextChange) {
      onTextChange(text);
    }
  }, [text, onTextChange]);

  // Focus management
  useEffect(() => {
    if (textareaRef.current && isKeyboardVisible) {
      textareaRef.current.focus();
    }
  }, [isKeyboardVisible]);

  // Key press handler
  const handleKeyPress = (key) => {
    setActiveKey(key);
    setTimeout(() => setActiveKey(null), 150); // Visual feedback

    if (onKeyPress) {
      onKeyPress(key);
    }

    // Play sound effect if enabled
    if (enableSound) {
      playKeySound(key);
    }

    // Handle different key types
    switch (key) {
      case 'shift':
        setIsShiftPressed(!isShiftPressed);
        break;
      case 'backspace':
        handleBackspace();
        break;
      case 'enter':
        handleEnter();
        break;
      case 'space':
        handleSpace();
        break;
      case 'symbols':
        setCurrentLayout(currentLayout === 'symbols' ? 'english' : 'symbols');
        break;
      case 'letters':
        setCurrentLayout(language);
        break;
      default:
        handleTextInput(key);
        break;
    }
  };

  const handleTextInput = (key) => {
    let inputChar = key;
    
    // Apply shift transformation
    if (isShiftPressed && currentLayout !== 'symbols') {
      inputChar = inputChar.toUpperCase();
      setIsShiftPressed(false); // Auto-release shift after one character
    }

    // Insert character at cursor position
    const beforeCursor = text.slice(0, cursorPosition);
    const afterCursor = text.slice(cursorPosition);
    const newText = beforeCursor + inputChar + afterCursor;
    
    setText(newText);
    setCursorPosition(cursorPosition + 1);
  };

  const handleBackspace = () => {
    if (cursorPosition > 0) {
      const beforeCursor = text.slice(0, cursorPosition - 1);
      const afterCursor = text.slice(cursorPosition);
      setText(beforeCursor + afterCursor);
      setCursorPosition(cursorPosition - 1);
    }
  };

  const handleEnter = () => {
    const beforeCursor = text.slice(0, cursorPosition);
    const afterCursor = text.slice(cursorPosition);
    const newText = beforeCursor + '\n' + afterCursor;
    
    setText(newText);
    setCursorPosition(cursorPosition + 1);
  };

  const handleSpace = () => {
    const beforeCursor = text.slice(0, cursorPosition);
    const afterCursor = text.slice(cursorPosition);
    const newText = beforeCursor + ' ' + afterCursor;
    
    setText(newText);
    setCursorPosition(cursorPosition + 1);
  };

  const playKeySound = (key) => {
    // Create different tones for different key types
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different key types
    let frequency = 800;
    if (key === 'space' || key === 'enter') frequency = 600;
    if (key === 'backspace') frequency = 400;
    if (key === 'shift') frequency = 1000;
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const handleTextareaChange = (e) => {
    setText(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleTextareaClick = (e) => {
    setCursorPosition(e.target.selectionStart);
  };

  const getKeyDisplayText = (key) => {
    if (key === 'shift') return isShiftPressed ? '⇧' : '⇧';
    if (key === 'backspace') return '⌫';
    if (key === 'enter') return '⏎';
    if (key === 'space') return '␣';
    if (key === 'symbols') return '⚹';
    if (key === 'letters') return 'ABC';
    
    if (isShiftPressed && currentLayout !== 'symbols') {
      return key.toUpperCase();
    }
    
    return key;
  };

  const getKeyClassName = (key) => {
    let className = 'gothic-key';
    
    if (activeKey === key) className += ' active';
    if (isShiftPressed && key === 'shift') className += ' pressed';
    if (key === 'space') className += ' space-key';
    if (key === 'enter') className += ' enter-key';
    if (key === 'backspace') className += ' backspace-key';
    if (['shift', 'symbols', 'letters'].includes(key)) className += ' modifier-key';
    
    return className;
  };

  const addGothicSymbol = (symbol) => {
    const beforeCursor = text.slice(0, cursorPosition);
    const afterCursor = text.slice(cursorPosition);
    const newText = beforeCursor + symbol + afterCursor;
    
    setText(newText);
    setCursorPosition(cursorPosition + 1);
  };

  return (
    <div className={`gothic-keyboard-container ${className}`}>
      {/* Symbols Panel only; textarea is optional and can be hidden if parent provides its own */}
      <div className="gothic-symbols-palette">
        <span className="palette-label">Mystical Symbols:</span>
        {GOTHIC_SYMBOLS.map((symbol, index) => (
          <button
            key={index}
            className="gothic-symbol-btn"
            onClick={() => addGothicSymbol(symbol)}
            title={`Add ${symbol}`}
          >
            {symbol}
          </button>
        ))}
      </div>

      {/* Optional on-screen keyboard: hidden by default; user can open it */}
      {isKeyboardVisible && (
        <div className="gothic-keyboard">
          <div className="keyboard-header">
            <div className="keyboard-title">
              ✦ Mystical Keyboard ✦
            </div>
            <div className="keyboard-controls">
              <button
                className={`layout-btn ${currentLayout === 'english' ? 'active' : ''}`}
                onClick={() => setCurrentLayout('english')}
              >
                EN
              </button>
              <button
                className={`layout-btn ${currentLayout === 'russian' ? 'active' : ''}`}
                onClick={() => setCurrentLayout('russian')}
              >
                РУ
              </button>
              <button
                className="close-btn"
                onClick={() => setIsKeyboardVisible(false)}
                title="Hide Keyboard"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="keyboard-body">
            {KEYBOARD_LAYOUTS[currentLayout].map((row, rowIndex) => (
              <div key={rowIndex} className={`keyboard-row row-${rowIndex}`}>
                {row.map((key, keyIndex) => (
                  <button
                    key={keyIndex}
                    className={getKeyClassName(key)}
                    onClick={() => handleKeyPress(key)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <span className="key-text">
                      {getKeyDisplayText(key)}
                    </span>
                    <div className="key-glow"></div>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Keyboard Footer */}
          <div className="keyboard-footer">
            <div className="layout-indicator">
              Layout: {currentLayout.toUpperCase()} {isShiftPressed && '(SHIFT)'}
            </div>
            <div className="character-count">
              {text.length} characters
            </div>
          </div>
        </div>
      )}

      {/* Show Keyboard Button (when hidden) */}
      {!isKeyboardVisible && (
        <button
          className="show-keyboard-btn"
          onClick={() => setIsKeyboardVisible(true)}
          title="Show Gothic Keyboard"
        >
          ⌨ Show Mystical Keyboard
        </button>
      )}
    </div>
  );
};

export default GothicKeyboard;