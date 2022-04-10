# Reactor

A compiler to ease the move from React to SolidJS.

## Features

Converts the following hooks to Solid equivalents:
 - `useState` -> `createSignal`
 - `useEffect` -> `createEffect`
 - `useReducer` -> `createSignal` + a function
 - `useRef` -> `{ current: <value> }` + a variable
   * convert (useRef-returned only) refs in `ref={myRef}` to `ref={myRef.current}`.

## Example
```js
export default () => {
  const [state, setState] = React.useState(0);
  let [, rerender] = useReducer(a => ~a, 0);
  Reactor.useEffect(() => console.log(state));

  const myRef = useRef();

  return (
    <>
      <button onClick={() => setState(state * 2)}/>
      {state}
      <div>
        <span className={state}/>
      </div>
    </>
  );
}
```

```js
export default () => {
  const [state, setState] = createSignal(0);
  let [$$__REACTOR_UNIQUE_VAR_1, $$__REACTOR_UNIQUE_VAR_0] = createSignal(0);
  const rerender = () =>
    $$__REACTOR_UNIQUE_VAR_0(((a) => ~a)($$__REACTOR_UNIQUE_VAR_1()));
  createEffect(() => console.log(state()));
  const myRef = {};

  return (
    <>
      <button onClick={() => setState(state() * 2)} />
      {state()}
      <div>
        <span class={state()} />
      </div>
    </>
  );
};
```
(output hand-prettified,
but youre likely to either be using this as a build step,
or have a codebase with a formatter setup)