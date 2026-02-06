import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import '../styles/ValentineFlow.css';

type TimerId = ReturnType<typeof setInterval> | null;

// Configuration for all steps
const STEPS = [
  {
    id: 1,
    question: "Since you didn't ask if I wanted to be your Valentine (maybe you forgot), do you still want to ask me?",
    failText: "you hesitated…",
    buttonBehavior: 'teleporting', // Shrinks and teleports randomly
  },
  {
    id: 2,
    question: "Since you said no, I need to know, do you still love me?",
    failText: "love is a question, apparently…",
    buttonBehavior: 'tiny', // Tiny and moving around
  },
  {
    id: 3,
    question: "Would you pick me in every universe?",
    failText: "the multiverse has spoken…",
    buttonBehavior: 'tiny', // Tiny and moving around
  },
  {
    id: 4,
    question: "Am I your person?",
    failText: "guess I'm not your person…",
    buttonBehavior: 'blinking', // Appears and disappears
  },
  {
    id: 5,
    question: "Would you share your snacks with me?",
    failText: "the ultimate rejection…",
    buttonBehavior: 'rolling', // Rolls away
  },
];

const TIMER_DURATION = 15; // seconds

interface ButtonPosition {
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
  isDisintegrating?: boolean;
}

const ValentineFlow: React.FC = () => {
  const [showOpener, setShowOpener] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFinalEnding, setShowFinalEnding] = useState(false);
  const [buttonPos, setButtonPos] = useState<ButtonPosition>({ x: 0, y: 0 });
  const [q4ButtonVisible, setQ4ButtonVisible] = useState(true);
  const timerRef = useRef<TimerId>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const teleportIntervalRef = useRef<TimerId>(null);
  const movementIntervalRef = useRef<TimerId>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonsAreaRef = useRef<HTMLDivElement>(null);

  const currentQuestion = STEPS[currentStep];

  // Timer logic
  useEffect(() => {
    if (showSuccess || showFinalEnding) return;

    setTimeLeft(TIMER_DURATION);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - treat as "No"
          handleNo();
          return TIMER_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStep, showSuccess, showFinalEnding]);

  // Clean up movement intervals
  useEffect(() => {
    return () => {
      if (teleportIntervalRef.current) clearInterval(teleportIntervalRef.current);
      if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
    };
  }, []);

  // Q4 button visibility cycling
  useEffect(() => {
    if (currentStep !== 3 || showSuccess || showFinalEnding) return;

    let visibilityTimer: TimerId = null;
    const startCycle = () => {
      setQ4ButtonVisible(true);
      visibilityTimer = setTimeout(() => {
        setQ4ButtonVisible(false);
        visibilityTimer = setTimeout(() => {
          startCycle();
        }, 2000); // Invisible for 2 seconds
      }, 1000); // Visible for 1 second
    };

    startCycle();

    return () => {
      if (visibilityTimer) clearTimeout(visibilityTimer);
    };
  }, [currentStep, showSuccess, showFinalEnding]);

  // Button behavior logic
  useEffect(() => {
    if (showSuccess || showFinalEnding || !buttonsAreaRef.current) return;

    // Q2: No movement, buttons stay in normal position
    if (currentQuestion.id === 2) {
      return;
    }

    const area = buttonsAreaRef.current;
    const areaRect = area.getBoundingClientRect();
    const buttonWidth = 100;
    const buttonHeight = 50;
    const padding = 10;
    
    // Calculate boundaries relative to buttons-area
    const minX = padding;
    const maxX = areaRect.width - buttonWidth - padding;
    const minY = padding;
    const maxY = areaRect.height - buttonHeight - padding;

    const getRandomPosition = () => ({
      x: Math.random() * (maxX - minX) + minX,
      y: Math.random() * (maxY - minY) + minY,
    });

    if (currentQuestion.buttonBehavior === 'teleporting') {
      // Auto-teleport every 1 second (more frequently)
      teleportIntervalRef.current = setInterval(() => {
        setButtonPos(getRandomPosition());
      }, 1000);
    } else if (currentQuestion.buttonBehavior === 'tiny') {
      // Move around continuously (more frequently)
      movementIntervalRef.current = setInterval(() => {
        setButtonPos({
          ...getRandomPosition(),
          scale: 0.6,
        });
      }, 600);
    } else if (currentQuestion.buttonBehavior === 'blinking') {
      // Q4: Move to random position every 250ms (quarter second) while visible
      movementIntervalRef.current = setInterval(() => {
        setButtonPos(getRandomPosition());
      }, 250);
    } else if (currentQuestion.buttonBehavior === 'disintegrating' || currentQuestion.buttonBehavior === 'rolling') {
      // For disintegrating and rolling: reposition button frequently
      movementIntervalRef.current = setInterval(() => {
        setButtonPos(getRandomPosition());
      }, 600);
    }

    return () => {
      if (teleportIntervalRef.current) clearInterval(teleportIntervalRef.current);
      if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
    };
  }, [currentQuestion, showSuccess, showFinalEnding]);

  // Mouse move handler for button behaviors
  const handleMouseMove = (e: React.MouseEvent) => {
    if (
      showSuccess ||
      showFinalEnding ||
      !yesButtonRef.current ||
      !buttonsAreaRef.current ||
      currentQuestion.id === 2 // Q2: No movement
    )
      return;

    const button = yesButtonRef.current;
    const buttonRect = button.getBoundingClientRect();
    const areaRect = buttonsAreaRef.current.getBoundingClientRect();

    const buttonCenterX = buttonRect.left - areaRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top - areaRect.top + buttonRect.height / 2;
    const mouseX = e.clientX - areaRect.left;
    const mouseY = e.clientY - areaRect.top;

    const distance = Math.sqrt(
      Math.pow(mouseX - buttonCenterX, 2) + Math.pow(mouseY - buttonCenterY, 2)
    );

    const buttonWidth = 100;
    const buttonHeight = 50;
    const padding = 10;
    const minX = padding;
    const maxX = areaRect.width - buttonWidth - padding;
    const minY = padding;
    const maxY = areaRect.height - buttonHeight - padding;

    if (currentQuestion.buttonBehavior === 'teleporting') {
      // Teleport when cursor gets close
      if (distance < 120) {
        setButtonPos({
          x: Math.random() * (maxX - minX) + minX,
          y: Math.random() * (maxY - minY) + minY,
        });
      }
    } else if (currentQuestion.buttonBehavior === 'phasing') {
      // Invisible when cursor is within 300px
      if (distance < 300) {
        setButtonPos({ x: buttonPos.x, y: buttonPos.y, opacity: 0 });
      } else {
        setButtonPos({ x: buttonPos.x, y: buttonPos.y, opacity: 1 });
      }
    } else {
      // For all other behaviors: move button away from cursor if too close
      // Q3 and Q4 (disintegrating) have even faster flee speeds
      const isQ3OrQ4 = currentQuestion.id === 3 || currentQuestion.id === 4;
      const detectionRadius = isQ3OrQ4 ? 250 : 150;
      const fleeDistance = isQ3OrQ4 ? 400 : 200;
      
      if (distance < detectionRadius) {
        // For Q3 and Q4: if cursor overlaps button, teleport to opposite side
        if (isQ3OrQ4 && distance < 50) {
          // Teleport to opposite side of the button area
          const oppositeX = mouseX < areaRect.width / 2 ? maxX : minX;
          const oppositeY = mouseY < areaRect.height / 2 ? maxY : minY;
          
          setButtonPos({
            x: oppositeX,
            y: oppositeY,
            scale: buttonPos.scale,
            opacity: buttonPos.opacity,
          });
        } else {
          // Normal flee behavior
          const angle = Math.atan2(buttonCenterY - mouseY, buttonCenterX - mouseX);
          let newX = buttonCenterX + Math.cos(angle) * fleeDistance - buttonRect.width / 2;
          let newY = buttonCenterY + Math.sin(angle) * fleeDistance - buttonRect.height / 2;

          // Clamp within container bounds
          newX = Math.max(minX, Math.min(newX, maxX));
          newY = Math.max(minY, Math.min(newY, maxY));

          setButtonPos({
            x: newX,
            y: newY,
            scale: buttonPos.scale,
            opacity: buttonPos.opacity,
          });
        }
      }
    }
  };

  const handleYesClick = (e: React.MouseEvent) => {
    // Prevent any click on Yes button from registering
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow click if button is fully visible and not moving
    if (currentQuestion.buttonBehavior === 'phasing') {
      return; // Can't click phasing button
    }
    if (currentQuestion.buttonBehavior === 'disintegrating') {
      return; // Can't click disintegrating button
    }
    if (currentQuestion.buttonBehavior === 'rolling') {
      return; // Can't click rolling button
    }
    if (currentQuestion.buttonBehavior === 'tiny') {
      return; // Can't click tiny button
    }
    
    // For teleporting, also make it very hard to click
    if (currentQuestion.buttonBehavior === 'teleporting') {
      // 95% chance to teleport instead of registering click
      if (Math.random() > 0.05) {
        const padding = 20;
        const minX = padding;
        const maxX = 500 - 100 - padding;
        const minY = padding;
        const maxY = 600 - 50 - padding;

        setButtonPos({
          x: Math.random() * (maxX - minX) + minX,
          y: Math.random() * (maxY - minY) + minY,
        });
        return;
      }
    }
    
    handleYes();
  };

  const handleYes = () => {
    // Trigger confetti
    triggerConfetti();

    // Show success message
    setShowSuccess(true);

    // Restart after 3 seconds
    setTimeout(() => {
      setCurrentStep(0);
      setShowSuccess(false);
      setButtonPos({ x: 0, y: 0 });
    }, 3000);
  };

  const handleNo = () => {
    if (currentStep < STEPS.length - 1) {
      // Move to next step
      setCurrentStep(currentStep + 1);
      setButtonPos({ x: 0, y: 0 });
    } else {
      // Final ending
      setShowFinalEnding(true);
    }
  };

  const triggerConfetti = () => {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 50,
        spread: 160,
        gravity: 0.6,
        scalar: 1.2,
      });
    }, 250);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setShowSuccess(false);
    setShowFinalEnding(false);
    setShowOpener(true);
    setButtonPos({ x: 0, y: 0 });
  };

  const handleOpenLetter = () => {
    setShowOpener(false);
  };

  // Render opener letter
  if (showOpener) {
    return (
      <div className="valentine-container opener-state">
        <div className="valentine-letter" onClick={handleOpenLetter}>
          <div className="letter-flap"></div>
          <div className="letter-content">
            <h1 className="letter-title">Happy Valentine's</h1>
            <p className="letter-subtitle">(or not)</p>
            <p className="letter-instruction">Click to open</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate button style based on behavior
  const getButtonStyle = (): React.CSSProperties => {
    // Q2: No special positioning, use default layout
    if (currentQuestion.id === 2) {
      return {};
    }

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${buttonPos.x}px`,
      top: `${buttonPos.y}px`,
      transition: currentQuestion.buttonBehavior === 'teleporting' ? 'none' : 'all 0.3s ease',
    };

    if (currentQuestion.buttonBehavior === 'phasing') {
      return {
        ...baseStyle,
        opacity: buttonPos.opacity ?? 1,
        pointerEvents: (buttonPos.opacity ?? 1) < 0.5 ? 'none' : 'auto',
      };
    } else if (currentQuestion.buttonBehavior === 'tiny') {
      return {
        ...baseStyle,
        transform: `scale(${buttonPos.scale ?? 1})`,
        pointerEvents: 'none',
      };
    } else if (currentQuestion.buttonBehavior === 'blinking') {
      return {
        ...baseStyle,
        opacity: q4ButtonVisible ? 1 : 0,
        pointerEvents: q4ButtonVisible ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      };
    } else if (currentQuestion.buttonBehavior === 'disintegrating') {
      return {
        ...baseStyle,
        opacity: 0.3,
        pointerEvents: 'none',
      };
    } else if (currentQuestion.buttonBehavior === 'rolling') {
      return {
        ...baseStyle,
        transform: `translateX(${buttonPos.x * 2}px)`,
        pointerEvents: 'none',
      };
    }

    return baseStyle;
  };

  // Render success state
  if (showSuccess) {
    return (
      <div className="valentine-container success-state">
        <div className="valentine-card">
          <h2 className="success-message">💕 Yes! You made the right choice! 💕</h2>
          <p className="success-subtext">Restarting in a moment...</p>
        </div>
      </div>
    );
  }

  // Render final ending state
  if (showFinalEnding) {
    return (
      <div className="valentine-container final-state">
        <div className="valentine-card">
          <h2 className="final-message">Go ask LeBron to be your Valentine then 😞</h2>
          <div className="lebron-image-placeholder">
            <img src="/assets/lebron.jpg" alt="LeBron" className="placeholder-img" />
          </div>
          <p className="sad-face">😭</p>
          <button onClick={handleRestart} className="restart-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="valentine-container" onMouseMove={handleMouseMove} ref={containerRef}>
      <div className="valentine-card" ref={cardRef}>
        {/* Timer */}
        <div className="timer-container">
          <div className="timer-circle">
            <svg className="timer-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="timer-progress"
                style={{
                  strokeDashoffset: `${(1 - timeLeft / TIMER_DURATION) * 282.7}`,
                }}
              />
            </svg>
            <span className="timer-text">{timeLeft}s</span>
          </div>
        </div>

        {/* Question */}
        <div className="question-area">
          <h1 className="question-text">{currentQuestion.question}</h1>
        </div>

        {/* Buttons Container */}
        <div className="buttons-area" ref={buttonsAreaRef}>
          <button
            onClick={handleNo}
            className="button button-no"
          >
            No
          </button>

          <button
            ref={yesButtonRef}
            onClick={currentQuestion.id === 2 ? handleNo : handleYesClick}
            className={`button ${currentQuestion.id === 2 ? 'button-no' : 'button-yes'} ${currentQuestion.id === 2 ? '' : `button-behavior-${currentQuestion.buttonBehavior}`}`}
            style={getButtonStyle()}
          >
            {currentQuestion.id === 2 ? 'No' : 'Yes'}
          </button>
        </div>

        {/* Fail message */}
        <p className="fail-message">{currentQuestion.failText}</p>
      </div>

      {/* Hearts decoration */}
      <div className="hearts-background">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="heart" />
        ))}
      </div>
    </div>
  );
};

export default ValentineFlow;
