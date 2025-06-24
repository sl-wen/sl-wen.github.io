import React from 'react';
import { Task } from '../utils/task';

interface TaskCardProps {
  task: Task;
  onStart?: () => void;
  onComplete?: () => void;
  isInProgress?: boolean;
  isCompleted?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStart,
  onComplete,
  isInProgress,
  isCompleted
}) => {
  return (
    <div
      className="task-card"
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        marginBottom: '1rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>
            {task.title}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {task.description}
          </p>
        </div>
        <div
          style={{
            backgroundColor: isCompleted ? '#e6f4ea' : isInProgress ? '#fff8e1' : '#f1f3f5',
            padding: '0.25rem 0.75rem',
            borderRadius: '16px',
            fontSize: '0.85rem',
            color: isCompleted ? '#137333' : isInProgress ? '#b28704' : 'var(--text-secondary)'
          }}
        >
          {isCompleted ? '已完成' : isInProgress ? '进行中' : '可接取'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>等级要求:</span>
          <span>{task.required_level}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>奖励金币:</span>
          <span>{task.reward_coins}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>奖励经验:</span>
          <span>{task.reward_exp}</span>
        </div>
      </div>

      {!isCompleted && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          {!isInProgress && onStart && (
            <button
              onClick={onStart}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--accent-color)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              接取任务
            </button>
          )}
          {isInProgress && onComplete && (
            <button
              onClick={onComplete}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#34a853',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              完成任务
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;