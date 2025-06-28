import React from 'react';
import { Task } from '../utils/task';
import '../styles/TaskCard.css';

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
    <div className="taskCard">
      <div className="taskHeader">
        <div className="taskInfo">
          <h3 className="taskTitle">{task.task_name}</h3>
          <p className="taskDescription">{task.task_description}</p>
        </div>
        <div className={`taskStatus ${isCompleted ? 'statusCompleted' : isInProgress ? 'statusInProgress' : 'statusAvailable'}`}>
          {isCompleted ? '已完成' : isInProgress ? '进行中' : '可接取'}
        </div>
      </div>

      <div className="taskRewards">
        <div className="rewardItem">
          <span className="rewardLabel">等级要求:</span>
          <span className="rewardValue">{task.min_level}</span>
        </div>
        <div className="rewardItem">
          <span className="rewardLabel">奖励金币:</span>
          <span className="rewardValue">{task.coins_reward}</span>
        </div>
        <div className="rewardItem">
          <span className="rewardLabel">奖励经验:</span>
          <span className="rewardValue">{task.exp_reward}</span>
        </div>
      </div>

      {!isCompleted && (
        <div className="taskActions">
          {!isInProgress && onStart && (
            <button
              className="taskButton startButton"
              onClick={onStart}
            >
              接取任务
            </button>
          )}
          {isInProgress && onComplete && (
            <button
              className="taskButton completeButton"
              onClick={onComplete}
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