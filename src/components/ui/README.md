# UI 组件库

基于 TailwindCSS 的可复用 React 组件库，提供现代化、可访问的用户界面组件。

## 组件列表

### Button 按钮组件

- **变体**: primary, secondary, ghost, danger, success, warning
- **尺寸**: sm, md, lg, xl
- **功能**: 图标支持、加载状态、禁用状态、全宽选项

```tsx
import { Button } from './components/ui';

<Button variant="primary" size="md" onClick={handleClick}>
  点击按钮
</Button>

<Button leftIcon={<PlusIcon />} variant="secondary">
  新建
</Button>

<Button isLoading onClick={handleSubmit}>
  {isLoading ? '提交中...' : '提交'}
</Button>
```

### Input 输入框组件

- **变体**: default, filled, underlined
- **尺寸**: sm, md, lg
- **功能**: 图标支持、标签、帮助文本、错误状态、加载状态

```tsx
import { Input } from './components/ui';

<Input
  label="用户名"
  placeholder="请输入用户名"
  leftIcon={<UserIcon />}
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  required
  error={hasError}
  errorMessage="用户名不能为空"
/>;
```

### Textarea 文本框组件

- **变体**: default, filled, underlined
- **尺寸**: sm, md, lg
- **功能**: 自动调整高度、标签、帮助文本、错误状态

```tsx
import { Textarea } from './components/ui';

<Textarea
  label="描述"
  placeholder="请输入描述"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  autoResize
  helperText="最多500个字符"
/>;
```

### Card 卡片组件

- **变体**: default, outlined, elevated, filled
- **尺寸**: sm, md, lg
- **功能**: 头部、底部、悬停效果、交互式

```tsx
import { Card } from './components/ui';

<Card variant="default" hoverable>
  <h3>卡片标题</h3>
  <p>卡片内容</p>
</Card>

<Card
  variant="elevated"
  header={<h3>带头部的卡片</h3>}
  footer={<Button>操作</Button>}
>
  卡片内容
</Card>

<Card interactive onClick={handleCardClick}>
  点击这个卡片
</Card>
```

### Alert 提示组件

- **变体**: info, success, warning, error
- **尺寸**: sm, md, lg
- **功能**: 自定义图标、标题、关闭按钮

```tsx
import { Alert } from './components/ui';

<Alert variant="success" onClose={() => {}}>
  操作成功完成！
</Alert>

<Alert
  variant="error"
  title="错误"
  icon={<CustomIcon />}
  onClose={handleClose}
>
  出现了错误，请重试。
</Alert>
```

### Modal 模态框组件

- **尺寸**: sm, md, lg, xl, full
- **功能**: ESC关闭、遮罩层关闭、自定义头部底部、防止背景滚动

```tsx
import { Modal } from './components/ui';

<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="模态框标题"
  size="md"
  footer={
    <div className="flex justify-end gap-3">
      <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
        取消
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        确认
      </Button>
    </div>
  }
>
  <p>模态框内容</p>
</Modal>;
```

## 统一导入

```tsx
import { Button, Input, Textarea, Card, Alert, Modal } from './components/ui';
```

## 设计特点

- **现代化设计**: 使用 TailwindCSS 实现现代化的视觉效果
- **响应式**: 完全适配移动端和桌面端
- **无障碍**: 支持键盘导航、屏幕阅读器、高对比度模式
- **TypeScript**: 完整的类型支持和智能提示
- **性能优化**: 轻量级实现，优秀的性能表现
- **主题支持**: 支持深色模式和自定义主题

## 工具函数

### cn 类名合并函数

用于合并和处理 CSS 类名：

```tsx
import { cn } from '../../utils/cn';

const className = cn(
  'base-class',
  condition && 'conditional-class',
  ['array', 'of', 'classes'],
  customClassName
);
```

## 样式定制

所有组件都支持通过 `className` prop 传入自定义样式：

```tsx
<Button className="my-custom-class" variant="primary">
  自定义样式按钮
</Button>
```

## 演示页面

查看 `UIComponentDemo.tsx` 文件可以看到所有组件的完整演示和使用示例。
