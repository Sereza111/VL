import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Sparkles, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import './MysticalForest.css';

// Цветовая палитра из требований
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',    // Тёмно-фиолетовый — основной фон
  beigeParchment: '#E8D3A9', // Бежево-пергаментный — текст, акценты
  darkTurquoise: '#1A3C34',  // Тёмный бирюзовый — светлячки, свечение
  inkyBlue: '#1B263B',       // Чернильный синий — тени, контуры
  moonBlue: '#A8C7FA',       // Голубоватый оттенок луны
};

// Компонент дерева
const Tree = ({ position, scale = [1, 1, 1], rotation = [0, 0, 0] }) => {
  const treeRef = useRef();
  
  // Создаем простую геометрию дерева (в реальном проекте здесь можно использовать модель)
  const treeGeometry = useMemo(() => {
    // Ствол
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    trunkGeometry.translate(0, 1, 0);
    
    // Крона
    const crownGeometry = new THREE.ConeGeometry(1, 2.5, 8);
    crownGeometry.translate(0, 3, 0);
    
    // Объединяем геометрии
    const combinedGeometry = new THREE.BufferGeometry();
    
    // Получаем атрибуты геометрий
    const trunkPositions = trunkGeometry.attributes.position.array;
    const crownPositions = crownGeometry.attributes.position.array;
    
    // Создаем новый буфер для объединенных позиций
    const positions = new Float32Array(trunkPositions.length + crownPositions.length);
    
    // Копируем данные из обеих геометрий
    positions.set(trunkPositions, 0);
    positions.set(crownPositions, trunkPositions.length);
    
    // Устанавливаем атрибут позиции
    combinedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    return combinedGeometry;
  }, []);
  
  // Материалы для дерева
  const trunkMaterial = new THREE.MeshStandardMaterial({ 
    color: '#4B3621', 
    roughness: 0.8 
  });
  
  const crownMaterial = new THREE.MeshStandardMaterial({ 
    color: COLOR_PALETTE.darkTurquoise, 
    roughness: 0.7 
  });
  
  // Анимация легкого покачивания
  useFrame((state) => {
    if (treeRef.current) {
      treeRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.02 + rotation[1];
      treeRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.01 + rotation[2];
    }
  });
  
  return (
    <group ref={treeRef} position={position} scale={scale}>
      {/* Ствол */}
      <mesh material={trunkMaterial}>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <meshStandardMaterial color="#4B3621" roughness={0.8} />
      </mesh>
      
      {/* Крона */}
      <mesh position={[0, 2.25, 0]} material={crownMaterial}>
        <coneGeometry args={[1, 2.5, 8]} />
        <meshStandardMaterial color={COLOR_PALETTE.darkTurquoise} roughness={0.7} />
      </mesh>
    </group>
  );
};

// Компонент силуэта гнома/криптида
const Cryptid = ({ position, speed = 0.5 }) => {
  const cryptidRef = useRef();
  const startPosition = useRef(position);
  const noise = useMemo(() => createNoise3D(), []);
  
  // Создаем силуэт
  const silhouette = useMemo(() => {
    const shape = new THREE.Shape();
    
    // Рисуем силуэт гнома
    shape.moveTo(0, 0);
    shape.lineTo(0.3, 0);
    shape.lineTo(0.3, 0.7);
    shape.lineTo(0.5, 1.0); // Шапка
    shape.lineTo(0.2, 1.2); // Верх шапки
    shape.lineTo(-0.1, 1.0); // Другая сторона шапки
    shape.lineTo(0, 0.7);
    shape.lineTo(0, 0);
    
    const geometry = new THREE.ShapeGeometry(shape);
    return geometry;
  }, []);
  
  // Анимация движения
  useFrame((state) => {
    if (cryptidRef.current) {
      // Используем шум для создания случайного движения
      const time = state.clock.getElapsedTime();
      const x = startPosition.current[0] + noise(time * 0.1, 0, 0) * 2;
      const z = startPosition.current[2] + noise(0, time * 0.1, 0) * 2;
      
      // Обновляем позицию
      cryptidRef.current.position.x = x;
      cryptidRef.current.position.z = z;
      
      // Поворачиваем в направлении движения
      const angle = Math.atan2(
        cryptidRef.current.position.z - cryptidRef.current.position.z,
        cryptidRef.current.position.x - cryptidRef.current.position.x
      );
      cryptidRef.current.rotation.y = angle;
      
      // Делаем силуэт более прозрачным в зависимости от расстояния от камеры
      const distance = Math.sqrt(x * x + z * z);
      cryptidRef.current.material.opacity = Math.max(0.1, 1 - distance / 15);
    }
  });
  
  return (
    <mesh 
      ref={cryptidRef} 
      position={position} 
      rotation={[0, Math.random() * Math.PI * 2, 0]}
    >
      <shapeGeometry args={[silhouette]} />
      <meshBasicMaterial 
        color={COLOR_PALETTE.inkyBlue} 
        transparent={true} 
        opacity={0.7} 
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Компонент светлячка/духа
const Firefly = ({ position, color = COLOR_PALETTE.darkTurquoise, size = 0.1 }) => {
  const fireflyRef = useRef();
  const startPosition = useRef(position);
  const noise = useMemo(() => createNoise3D(), []);
  
  // Анимация светлячка
  useFrame((state) => {
    if (fireflyRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Используем шум для создания органичного движения
      const x = startPosition.current[0] + noise(time * 0.5, 0, 0) * 1.5;
      const y = startPosition.current[1] + noise(0, time * 0.5, 0) * 1;
      const z = startPosition.current[2] + noise(0, 0, time * 0.5) * 1.5;
      
      // Обновляем позицию
      fireflyRef.current.position.set(x, y, z);
      
      // Пульсирующее свечение
      const pulse = (Math.sin(time * 3) + 1) * 0.5;
      fireflyRef.current.material.opacity = 0.5 + pulse * 0.5;
      fireflyRef.current.scale.setScalar(size * (0.8 + pulse * 0.4));
    }
  });
  
  return (
    <mesh ref={fireflyRef} position={position}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial 
        color={color} 
        transparent={true} 
        opacity={0.8}
      />
    </mesh>
  );
};

// Основной компонент мистического леса
const MysticalForest = ({ count = 30, cryptidCount = 5, fireflyCount = 20 }) => {
  // Генерируем случайные позиции для деревьев
  const trees = useMemo(() => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      const scale = 0.5 + Math.random() * 1.5;
      const rotation = [0, Math.random() * Math.PI * 2, 0];
      positions.push({ position: [x, 0, z], scale: [scale, scale, scale], rotation });
    }
    return positions;
  }, [count]);
  
  // Генерируем позиции для криптидов
  const cryptids = useMemo(() => {
    const positions = [];
    for (let i = 0; i < cryptidCount; i++) {
      const x = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 30;
      const y = 0.5; // Немного над землей
      positions.push([x, y, z]);
    }
    return positions;
  }, [cryptidCount]);
  
  // Генерируем позиции для светлячков
  const fireflies = useMemo(() => {
    const positions = [];
    for (let i = 0; i < fireflyCount; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = 1 + Math.random() * 5; // От 1 до 6 единиц над землей
      const z = (Math.random() - 0.5) * 30;
      const color = i % 3 === 0 ? COLOR_PALETTE.moonBlue : COLOR_PALETTE.darkTurquoise;
      const size = 0.05 + Math.random() * 0.15;
      positions.push({ position: [x, y, z], color, size });
    }
    return positions;
  }, [fireflyCount]);
  
  // Создаем землю
  const groundRef = useRef();
  
  return (
    <group>
      {/* Земля */}
      <mesh 
        ref={groundRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, 0]}
      >
        <planeGeometry args={[100, 100, 32, 32]} />
        <meshStandardMaterial 
          color={COLOR_PALETTE.darkPurple} 
          roughness={0.9} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Деревья */}
      {trees.map((tree, index) => (
        <Tree 
          key={`tree-${index}`} 
          position={tree.position} 
          scale={tree.scale} 
          rotation={tree.rotation}
        />
      ))}
      
      {/* Криптиды */}
      {cryptids.map((position, index) => (
        <Cryptid 
          key={`cryptid-${index}`} 
          position={position} 
          speed={0.2 + Math.random() * 0.3}
        />
      ))}
      
      {/* Светлячки */}
      {fireflies.map((firefly, index) => (
        <Firefly 
          key={`firefly-${index}`} 
          position={firefly.position} 
          color={firefly.color}
          size={firefly.size}
        />
      ))}
      
      {/* Добавляем эффект искр/частиц для атмосферы */}
      <Sparkles 
        count={200} 
        scale={[30, 10, 30]} 
        size={0.5} 
        speed={0.2} 
        color={COLOR_PALETTE.moonBlue}
        opacity={0.3}
      />
    </group>
  );
};

export default MysticalForest; 