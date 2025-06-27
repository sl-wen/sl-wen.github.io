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
    <div className="task-card">
      <div>
        <div>
          <h3>{task.title}</h3>
          <p>{task.description}</p>
        </div>
        <div>
          {isCompleted ? '已完成' : isInProgress ? '进行中' : '可接取'}
        </div>
      </div>

      <div>
        <div>
          <span>等级要求:</span>
          <span>{task.required_level}</span>
        </div>
        <div>
          <span>奖励金币:</span>
          <span>{task.reward_coins}</span>
        </div>
        <div>
          <span>奖励经验:</span>
          <span>{task.reward_exp}</span>
        </div>
      </div>

      {!isCompleted && (
        <div>
          {!isInProgress && onStart && (
            <button onClick={onStart}>接取任务</button>
          )}
          {isInProgress && onComplete && (
            <button onClick={onComplete}>完成任务</button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;