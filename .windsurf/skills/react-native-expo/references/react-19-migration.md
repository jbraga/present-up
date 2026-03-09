# React 19 Migration Guide for React Native

## Impact: CRITICAL
## Applies to: React Native 0.78+

## Overview

React 19 introduces several breaking changes that affect React Native apps. This guide covers every change and the migration path.

## Breaking Changes

### 1. propTypes Removed

React 19 removed `propTypes` completely. No runtime validation, no warnings — silently ignored.

**Detection:**
```bash
# Find all propTypes usage in your codebase
grep -rn "propTypes" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" src/
grep -rn "import PropTypes" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" src/
```

**Automated Fix:**
```bash
npx @codemod/react-19 upgrade
```

**Manual Fix:**
```tsx
// BEFORE: propTypes (silently ignored in React 19)
import PropTypes from 'prop-types';

function Card({ title, subtitle, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Text>{title}</Text>
      {subtitle && <Text>{subtitle}</Text>}
    </Pressable>
  );
}

Card.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  onPress: PropTypes.func.isRequired,
};

// AFTER: TypeScript types
type CardProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
};

function Card({ title, subtitle, onPress }: CardProps) {
  return (
    <Pressable onPress={onPress}>
      <Text>{title}</Text>
      {subtitle && <Text>{subtitle}</Text>}
    </Pressable>
  );
}
```

**After migration:**
```bash
# Remove prop-types dependency
npm uninstall prop-types @types/prop-types
```

### 2. forwardRef Deprecated

`forwardRef` is no longer needed — pass `ref` as a regular prop.

**Detection:**
```bash
grep -rn "forwardRef" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" src/
```

**Manual Fix:**
```tsx
// BEFORE: forwardRef wrapper
import { forwardRef, useImperativeHandle } from 'react';
import { TextInput, TextInputProps } from 'react-native';

const CustomInput = forwardRef<TextInput, TextInputProps>((props, ref) => {
  return <TextInput ref={ref} {...props} />;
});

// AFTER: ref as regular prop
import { useImperativeHandle, Ref } from 'react';
import { TextInput, TextInputProps } from 'react-native';

type CustomInputProps = TextInputProps & {
  ref?: Ref<TextInput>;
};

function CustomInput({ ref, ...props }: CustomInputProps) {
  return <TextInput ref={ref} {...props} />;
}
```

### 3. defaultProps Deprecated for Function Components

`defaultProps` is deprecated for function components. Use JavaScript default parameters instead.

**Detection:**
```bash
grep -rn "defaultProps" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" src/
```

**Manual Fix:**
```tsx
// BEFORE: defaultProps
function Avatar({ size, source }) {
  return <Image source={source} style={{ width: size, height: size }} />;
}
Avatar.defaultProps = {
  size: 40,
};

// AFTER: default parameters
type AvatarProps = {
  size?: number;
  source: ImageSourcePropType;
};

function Avatar({ size = 40, source }: AvatarProps) {
  return <Image source={source} style={{ width: size, height: size }} />;
}
```

### 4. New Hooks Available

#### useActionState
Replaces common form submission patterns:

```tsx
import { useActionState } from 'react';

function SubmitForm() {
  const [state, submitAction, isPending] = useActionState(
    async (prevState, formData) => {
      try {
        const result = await api.submit(formData);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    { success: false }
  );

  return (
    <View>
      <TextInput placeholder="Email" />
      <Button
        title={isPending ? 'Submitting...' : 'Submit'}
        onPress={submitAction}
        disabled={isPending}
      />
      {state.error && <Text style={{ color: 'red' }}>{state.error}</Text>}
    </View>
  );
}
```

#### useOptimistic
For optimistic UI updates:

```tsx
import { useOptimistic } from 'react';

function TodoList({ todos, onToggle }) {
  const [optimisticTodos, toggleOptimistic] = useOptimistic(
    todos,
    (currentTodos, toggledId) =>
      currentTodos.map(todo =>
        todo.id === toggledId ? { ...todo, done: !todo.done } : todo
      )
  );

  async function handleToggle(id) {
    toggleOptimistic(id);      // Update UI immediately
    await onToggle(id);         // Then update server
  }

  return (
    <FlatList
      data={optimisticTodos}
      renderItem={({ item }) => (
        <Pressable onPress={() => handleToggle(item.id)}>
          <Text>{item.done ? '✓' : '○'} {item.title}</Text>
        </Pressable>
      )}
    />
  );
}
```

#### use
Read promises and contexts during render:

```tsx
import { use, Suspense } from 'react';

function UserProfile({ userPromise }) {
  const user = use(userPromise);  // Suspends if pending
  return <Text>{user.name}</Text>;
}

// Usage:
<Suspense fallback={<ActivityIndicator />}>
  <UserProfile userPromise={fetchUser(id)} />
</Suspense>
```

## Migration Checklist

- [ ] Run `npx @codemod/react-19 upgrade`
- [ ] Remove all `propTypes` declarations
- [ ] Replace `propTypes` with TypeScript types
- [ ] Remove `forwardRef` wrappers, pass `ref` as prop
- [ ] Replace `defaultProps` with default parameters
- [ ] Uninstall `prop-types` package
- [ ] Test all components render correctly
- [ ] Update third-party libraries to React 19 compatible versions

## Common Pitfalls

1. **Silent failures**: propTypes won't throw errors — they just stop working. Your app may accept invalid props without warning.
2. **Third-party libraries**: Some libraries still use propTypes internally. Update to latest versions.
3. **forwardRef in libraries**: If a library exports forwardRef components, check for updates that support React 19.
4. **Testing**: If your tests assert on propTypes warnings, they will now pass silently. Update test expectations.

## Sources

- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [React 19 Release Notes](https://react.dev/blog/2024/12/05/react-19)
