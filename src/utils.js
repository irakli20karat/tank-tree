// utils.js
import { Target, Diamond, Hexagon, Square, Triangle, Circle } from 'lucide-react';

export const COLUMN_WIDTH = 160;
export const TANK_WIDTH = 144;

export const DEFAULT_GROUPS = [
  { id: 'g_lt', name: 'Light Tanks', color: '#a3a3a3', icon: 'diamond' },
  { id: 'g_mt', name: 'Medium Tanks', color: '#4ade80', icon: 'hexagon' },
  { id: 'g_ht', name: 'Heavy Tanks', color: '#e7f84bff', icon: 'square' },
  { id: 'g_td', name: 'Tank Destroyers', color: '#38bdf8', icon: 'triangle' },
  { id: 'g_spg', name: 'SPGs', color: '#c084fc', icon: 'circle' },
];

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const GroupIcon = ({ icon, color, size = 16 }) => {
  const props = { size, color, strokeWidth: 2 };
  switch (icon) {
    case 'diamond': return <Diamond {...props} />;
    case 'hexagon': return <Hexagon {...props} />;
    case 'square': return <Square {...props} />;
    case 'triangle': return <Triangle {...props} />;
    case 'circle': return <Circle {...props} />;
    default: return <Target {...props} />;
  }
};

// --- Geometry Helpers ---
const isBetween = (c, a, b) => (c >= a && c <= b) || (c >= b && c <= a);

export const doSegmentsIntersect = (p0, p1, p2, p3) => {
  const minX1 = Math.min(p0.x, p1.x), maxX1 = Math.max(p0.x, p1.x);
  const minY1 = Math.min(p0.y, p1.y), maxY1 = Math.max(p0.y, p1.y);
  const minX2 = Math.min(p2.x, p3.x), maxX2 = Math.max(p2.x, p3.x);
  const minY2 = Math.min(p2.y, p3.y), maxY2 = Math.max(p2.y, p3.y);
  if (maxX1 < minX2 || minX1 > maxX2 || maxY1 < minY2 || minY1 > maxY2) return false;
  const isHorz1 = p0.y === p1.y;
  const isHorz2 = p2.y === p3.y;
  if (isHorz1 === isHorz2) return false;
  if (isHorz1) return isBetween(p2.x, p0.x, p1.x) && isBetween(p0.y, p2.y, p3.y);
  else return isBetween(p0.x, p2.x, p3.x) && isBetween(p2.y, p0.y, p1.y);
};

export const getAllConnectedIds = (startId, allTanks) => {
  if (!startId) return new Set();
  const connected = new Set([startId]);
  const tankMap = new Map(allTanks.map(t => [t.id, t]));

  // Upstream
  const queueUp = [startId];
  while (queueUp.length) {
    const currentId = queueUp.pop();
    const tank = tankMap.get(currentId);
    if (tank && tank.parentIds) {
      tank.parentIds.forEach(pid => {
        if (!connected.has(pid)) {
          connected.add(pid);
          queueUp.push(pid);
        }
      });
    }
  }
  // Downstream
  const queueDown = [startId];
  while (queueDown.length) {
    const currentId = queueDown.pop();
    allTanks.forEach(t => {
      if (t.parentIds && t.parentIds.includes(currentId) && !connected.has(t.id)) {
        connected.add(t.id);
        queueDown.push(t.id);
      }
    });
  }
  return connected;
};