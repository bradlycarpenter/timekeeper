## Rules

### Effect

This is an effect repository, write effect code all the way through and reference libraries/ to learn how to write effect, read their test cases to understand how to use effect.

### UI
#### Shadcn
Use shadcn and write components as compound components.

#### Compound
```tsx
//my-component-root.types.ts

export type MyComponentRootProps = {
    children: React.ReactNode
}

export type MyComponentActionProps = {
    onClick = () => void
}

// my-component.tsx
const MyComponentRoot = (props: MyComponentRootProps) => {
    return <div>{props.children}</div>
}

const MyComponentAction = (props: MyComponentProps) => {
    return <Button onClick={props.onClick}>Click me</Button>
}

export const MyComponent = {
    Root: MyComponentRoot,
    Action: MyComponentAction
}
```

Never create a wrapper component:

##### Wrong
```tsx
// some-wrapper.tsx
const Wrapper = () => {
    return 
        <MyComponent.Root>
            <MyComponent.Action onClick={() => {}}/>
        </MyComponent.Root >
}
```

##### Right
```tsx
// index.tsx

const myRouteWhatever = () => {
    const { data, error } = useQueryWhatever
    return 
        <MyComponent.Root>
            <MyComponent.Action onClick={() => {}}/>
        </MyComponent.Root >
}
```

#### File Naming
Colocate things to their component using the dot suffix before the filetype like component.test.tsx or component.constants.tsx you get the point.
