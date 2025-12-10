import React, { useMemo, memo } from 'react';

const BackgroundFood = memo(() => {
  const allFoods = ['🍕','🍔','🍟','🌭','🍿','🧂','🥓','🥚','🍳','🧇','🥞','🧈','🥐','🥨','🥯','🥖','🧀','🥗','🥙','🥪','🌮','🌯','🥫','🍖','🍗','🥩','🍠','🥟','🥠','🥡','🍱','🍘','🍙','🍚','🍛','🍜','🦪','🍣','🍤','🍥','🥮','🍢','🧆','🥘','🍲','🍝','🥣','🥧','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🧃','🥤','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🧊','🍇','🍈','🍉','🍊','🍋','🍌','🍍','🥭','🍎','🍏','🍐','🍑','🍒','🍓','🥝','🍅','🥥','🥑','🍆','🥔','🥕','🌽','🌶️','🥒','🥬','🥦','🧄','🧅','🍄'];
  
  const drops = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      emoji: allFoods[Math.floor(Math.random() * allFoods.length)],
      style: {
        left: `${Math.random() * 100}%`,
        animationDuration: `${15 + Math.random() * 20}s`,
        animationDelay: `-${Math.random() * 30}s`,
        fontSize: `${2 + Math.random() * 2}rem`,
      }
    }));
  }, []);

  return (
    <div className="falling-food-container">
      {drops.map((drop) => (
        <span key={drop.id} className="food-emoji" style={drop.style}>{drop.emoji}</span>
      ))}
    </div>
  );
});

export default BackgroundFood;