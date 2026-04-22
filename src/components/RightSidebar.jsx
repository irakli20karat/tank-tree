import { useState, useRef } from 'react';
import { Plus, X, ChevronRight, GripVertical } from 'lucide-react';
import { generateId } from '../utils/utils';

const FIELD_TYPES = ['text', 'number', 'boolean', 'rating'];

const RightSidebar = ({ tank, updateTank, isOpen, setIsOpen }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('text');
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOverPos, setDragOverPos] = useState(null); // 'before' | 'after'
  const [draggingFieldId, setDraggingFieldId] = useState(null); // for render (opacity)
  const draggingId = useRef(null); // for drop handler logic (no re-render needed)

  const fields = tank?.customFields || [];

  const addField = () => {
    if (!tank) return;
    const label = newLabel.trim() || 'New Field';
    const defaultValue = newType === 'boolean' ? false : newType === 'number' ? 0 : newType === 'rating' ? 0 : '';
    updateTank(tank.id, 'customFields', [
      ...fields,
      { id: generateId(), label, value: defaultValue, type: newType }
    ]);
    setNewLabel('');
  };

  const updateField = (fieldId, key, val) =>
    updateTank(tank.id, 'customFields', fields.map(f => f.id === fieldId ? { ...f, [key]: val } : f));

  const deleteField = (fieldId) =>
    updateTank(tank.id, 'customFields', fields.filter(f => f.id !== fieldId));

  const handleDragStart = (e, fieldId) => {
    draggingId.current = fieldId;
    setDraggingFieldId(fieldId);
    e.dataTransfer.effectAllowed = 'move';
    // Use a transparent drag image so only our visual cues show
    const ghost = document.createElement('div');
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, fieldId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (fieldId === draggingId.current) {
      setDragOverId(null);
      setDragOverPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragOverId(fieldId);
    setDragOverPos(e.clientY < midY ? 'before' : 'after');
  };

  const handleDragLeave = () => {
    setDragOverId(null);
    setDragOverPos(null);
  };

  const handleDrop = (e, targetFieldId) => {
    e.preventDefault();
    const sourceId = draggingId.current;
    if (!sourceId || sourceId === targetFieldId) {
      setDragOverId(null);
      setDragOverPos(null);
      return;
    }

    const newFields = [...fields];
    const fromIndex = newFields.findIndex(f => f.id === sourceId);
    const toIndex = newFields.findIndex(f => f.id === targetFieldId);
    const [moved] = newFields.splice(fromIndex, 1);

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertAfter = e.clientY >= midY;
    const insertAt = fromIndex < toIndex
      ? (insertAfter ? toIndex : toIndex)
      : (insertAfter ? toIndex + 1 : toIndex);

    newFields.splice(insertAt, 0, moved);
    updateTank(tank.id, 'customFields', newFields);
    setDragOverId(null);
    setDragOverPos(null);
    draggingId.current = null;
    setDraggingFieldId(null);
  };

  const handleDragEnd = () => {
    draggingId.current = null;
    setDraggingFieldId(null);
    setDragOverId(null);
    setDragOverPos(null);
  };

  const renderInput = (field) => {
    if (field.type === 'boolean') return (
      <button
        onClick={() => updateField(field.id, 'value', !field.value)}
        style={{
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.05em',
          color: field.value ? '#4ade80' : '#a3407a',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        {field.value ? '● YES' : '○ NO'}
      </button>
    );

    if (field.type === 'rating') return (
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => updateField(field.id, 'value', field.value === star ? 0 : star)}
            style={{
              fontSize: 16,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: field.value >= star ? '#fbbf24' : '#3a3a3a',
              lineHeight: 1,
            }}
          >★</button>
        ))}
      </div>
    );

    if (field.type === 'number') return (
      <input
        type="number"
        value={field.value}
        onChange={e => updateField(field.id, 'value', parseFloat(e.target.value) || 0)}
        style={{
          background: 'none',
          border: 'none',
          borderBottom: '1px solid #2a2a2a',
          outline: 'none',
          color: '#d4d4d4',
          fontSize: 15,
          fontFamily: 'var(--font-mono)',
          width: '100%',
          padding: '2px 0',
        }}
      />
    );

    return (
      <input
        type="text"
        value={field.value}
        placeholder="—"
        onChange={e => updateField(field.id, 'value', e.target.value)}
        style={{
          background: 'none',
          border: 'none',
          borderBottom: '1px solid #2a2a2a',
          outline: 'none',
          color: '#d4d4d4',
          fontSize: 15,
          width: '100%',
          padding: '2px 0',
        }}
      />
    );
  };

  return (
    <div style={{
      flexShrink: 0,
      width: isOpen ? 260 : 0,
      overflow: 'hidden',
      transition: 'width 0.25s ease',
      background: '#0f0f0f',
      borderLeft: '1px solid #1f1f1f',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ width: 260 }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.12em',
            color: '(--text-neutral-400)',
            textTransform: 'uppercase',
          }}>Custom Fields</span>
          <button
            onClick={() => setIsOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#404040', padding: 0, display: 'flex' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {!tank ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#404040', lineHeight: 1.6 }}>Select a vehicle<br />to add custom fields</p>
          </div>
        ) : (
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 57px)' }}>

            {/* Field list */}
            {fields.length === 0 ? (
              <p style={{ fontSize: 13, color: '#383838', textAlign: 'center', padding: '36px 20px' }}>
                No fields yet
              </p>
            ) : (
              <div style={{ padding: '8px 0' }}>
                {fields.map(field => {
                  const isOver = dragOverId === field.id;
                  return (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={e => handleDragStart(e, field.id)}
                      onDragOver={e => handleDragOver(e, field.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={e => handleDrop(e, field.id)}
                      onDragEnd={handleDragEnd}
                      className="group"
                      style={{
                        padding: '12px 20px 12px 8px',
                        borderBottom: '1px solid #141414',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 4,
                        opacity: draggingFieldId === field.id ? 0.4 : 1,
                        boxShadow: isOver
                          ? dragOverPos === 'before'
                            ? 'inset 0 2px 0 0 #525252'
                            : 'inset 0 -2px 0 0 #525252'
                          : 'none',
                        transition: 'box-shadow 0.1s, opacity 0.15s',
                        cursor: 'default',
                      }}
                    >
                      {/* Grip handle */}
                      <div
                        style={{
                          flexShrink: 0,
                          paddingTop: 2,
                          color: '#2a2a2a',
                          cursor: 'grab',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#555'}
                        onMouseLeave={e => e.currentTarget.style.color = '#2a2a2a'}
                      >
                        <GripVertical size={13} />
                      </div>

                      {/* Field content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Label row */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                          <input
                            type="text"
                            value={field.label}
                            onChange={e => updateField(field.id, 'label', e.target.value)}
                            style={{
                              background: 'none',
                              border: 'none',
                              outline: 'none',
                              fontSize: 11,
                              fontFamily: 'var(--font-mono)',
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                              color: '#999999',
                              width: '100%',
                              padding: 0,
                            }}
                          />
                          <button
                            onClick={() => deleteField(field.id)}
                            className="opacity-0 group-hover:opacity-100"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#404040',
                              padding: 0,
                              flexShrink: 0,
                              display: 'flex',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#404040'}
                          >
                            <X size={12} />
                          </button>
                        </div>

                        {/* Value row */}
                        {renderInput(field)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add field section */}
            <div style={{ padding: '20px 20px 32px', borderTop: fields.length > 0 ? '1px solid #141414' : 'none' }}>
              <p style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#303030',
                marginBottom: 14,
              }}>Add field</p>

              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addField()}
                placeholder="Field name..."
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid #2a2a2a',
                  outline: 'none',
                  color: '#d4d4d4',
                  fontSize: 15,
                  width: '100%',
                  padding: '4px 0 6px',
                  marginBottom: 16,
                }}
              />

              {/* Type picker */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {FIELD_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      background: newType === t ? '#1f1f1f' : 'none',
                      border: `1px solid ${newType === t ? '#333' : '#1f1f1f'}`,
                      borderRadius: 3,
                      cursor: 'pointer',
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: newType === t ? '#a3a3a3' : '#404040',
                      textTransform: 'capitalize',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <button
                onClick={addField}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  background: 'none',
                  border: '1px solid #222',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#525252',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#a3a3a3'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#525252'; }}
              >
                <Plus size={13} /> Add field
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;